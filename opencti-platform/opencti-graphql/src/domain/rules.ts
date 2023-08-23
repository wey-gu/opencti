import type { RuleDefinition, RuleRuntime } from '../types/rules';
import type { BasicRuleEntity } from '../types/store';
import { ENTITY_TYPE_RULE, ENTITY_TYPE_SETTINGS } from '../schema/internalObject';
import { BUS_TOPICS } from '../config/conf';
import type { AuthContext, AuthUser } from '../types/user';
import { isEmptyField } from '../database/utils';
import { UnsupportedError } from '../config/errors';
import { createEntity } from '../database/middleware';
import { createRuleTask, deleteRuleTasks } from './backgroundTask';
import { notify } from '../database/redis';
import { getEntitiesListFromCache } from '../database/cache';
import { isModuleActivated } from './settings';
import { publishUserAction } from '../listener/UserActionListener';
import { RULES } from '../rules/rules';

export const getRules = async (context: AuthContext, user: AuthUser): Promise<Array<RuleRuntime>> => {
  const rules = await getEntitiesListFromCache<BasicRuleEntity>(context, user, ENTITY_TYPE_RULE);
  return RULES.map((def: RuleRuntime) => {
    const esRule = rules.find((e) => e.internal_id === def.id);
    const isActivated = esRule?.active === true;
    return { ...def, activated: isActivated };
  });
};

export const getActivatedRules = async (context: AuthContext, user: AuthUser): Promise<Array<RuleRuntime>> => {
  const rules = await getRules(context, user);
  return rules.filter((r) => r.activated);
};

export const getRule = async (context: AuthContext, user: AuthUser, id: string): Promise<RuleDefinition | undefined> => {
  const rules = await getRules(context, user);
  return rules.find((e) => e.id === id);
};

export const setRuleActivation = async (context: AuthContext, user: AuthUser, ruleId: string, active: boolean): Promise<RuleDefinition | undefined> => {
  const resolvedRule = await getRule(context, user, ruleId);
  if (isEmptyField(resolvedRule)) {
    throw UnsupportedError(`Cant ${active ? 'enable' : 'disable'} undefined rule ${ruleId}`);
  }
  // Update the rule via upsert
  const rule = await createEntity(context, user, { internal_id: ruleId, active, update: true }, ENTITY_TYPE_RULE);
  // Notify configuration change for caching system
  await notify(BUS_TOPICS[ENTITY_TYPE_RULE].EDIT_TOPIC, rule, user);
  // Refresh the activated rules
  const isRuleEngineActivated = await isModuleActivated('RULE_ENGINE');
  if (isRuleEngineActivated) {
    await deleteRuleTasks(context, user, ruleId);
    await createRuleTask(context, user, resolvedRule, { rule: ruleId, enable: active });
  }
  await publishUserAction({
    user,
    event_type: 'mutation',
    event_scope: 'update',
    event_access: 'administration',
    message: `${active ? 'activates' : 'deactivates'} rule \`${resolvedRule?.name}\``,
    context_data: { id: ruleId, entity_type: ENTITY_TYPE_SETTINGS, input: { id: ruleId, active } }
  });
  return getRule(context, user, ruleId);
};
