import type { AuthContext, AuthUser } from '../types/user';
import type { StoreEntity } from '../types/store';
import { createEntity, deleteElementById, updateAttribute } from '../database/middleware';
import { publishUserAction } from '../listener/UserActionListener';
import { notify } from '../database/redis';
import { BUS_TOPICS } from '../config/conf';
import { ABSTRACT_INTERNAL_OBJECT } from '../schema/general';
import { ENTITY_TYPE_FEED } from '../schema/internalObject';
import type { EditInput } from '../generated/graphql';
import { FunctionalError } from '../config/errors';
import { storeLoadById } from '../database/middleware-loader';

const hrfEntityType = (entityType: string) => {
 return entityType.replace(/([A-Z])/g, ' $1').trim();
}

export const createInternalObject = async <T extends StoreEntity>(context: AuthContext, user: AuthUser, input: Record<string, any>, entityType: string): Promise<T> => {
    const { element, isCreation } = await createEntity(context, user, input, entityType, { complete: true });
    if (isCreation) {
        await publishUserAction({
            user,
            event_type: 'mutation',
            event_scope: 'create',
            event_access: 'administration',
            message: `creates ${hrfEntityType(entityType)} \`${element.name}\``,
            context_data: { id: element.id, entity_type: element.entity_type, input }
        });
    }
    return notify(BUS_TOPICS[ABSTRACT_INTERNAL_OBJECT].ADDED_TOPIC, element, user);
};

export const editInternalObject = async <T extends StoreEntity>(context: AuthContext, user: AuthUser, id: string, entityType: string, input: EditInput[]): Promise<T> => {
    const internalObject = await storeLoadById(context, user, id, entityType);
    if (!internalObject) {
        throw FunctionalError(`${entityType} ${id} cant be found`);
    }
    const { element } = await updateAttribute(context, user, id, entityType, input);
    await publishUserAction({
        user,
        event_type: 'mutation',
        event_scope: 'update',
        event_access: 'administration',
        message: `updates \`${input.map((i) => i.key).join(', ')}\` for ${hrfEntityType(entityType)} \`${element.name}\``,
        context_data: { id, entity_type: ENTITY_TYPE_FEED, input }
    });
    return notify(BUS_TOPICS[ABSTRACT_INTERNAL_OBJECT].EDIT_TOPIC, element, user);
};

export const deleteInternalObject = async (context: AuthContext, user: AuthUser, id: string, entityType: string) => {
    const internalObject = await storeLoadById(context, user, id, entityType);
    if (!internalObject) {
        throw FunctionalError(`${entityType} ${id} cant be found`);
    }
    const deleted = await deleteElementById(context, user, id, entityType);
    await publishUserAction({
        user,
        event_type: 'mutation',
        event_scope: 'delete',
        event_access: 'administration',
        message: `deletes ${hrfEntityType(entityType)} \`${deleted.name}\``,
        context_data: { id: id, entity_type: entityType, input: deleted }
    });
    await notify(BUS_TOPICS[ABSTRACT_INTERNAL_OBJECT].DELETE_TOPIC, internalObject, user);
    return id;
};
