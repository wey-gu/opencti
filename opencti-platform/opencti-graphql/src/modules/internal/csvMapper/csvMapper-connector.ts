import { CONNECTOR_INTERNAL_IMPORT_FILE } from '../../../schema/general';
import type { Connector } from '../../../generated/graphql';
import type { AuthContext, AuthUser } from '../../../types/user';
import type { BasicStoreEntity } from '../../../types/store';
import { listAllEntities } from '../../../database/middleware-loader';
import { ENTITY_TYPE_CSV_MAPPER } from './csvMapper-types';

interface ImportConnector extends Partial<Connector> {
  built_in: boolean;
  connector_schema_runtime_fn: <T extends BasicStoreEntity> (context: AuthContext, user: AuthUser) => Promise<T[]>;
}

export const IMPORT_CONNECTOR_CSV = 'd336676c-4ee5-4257-96ff-b2a86688d4af';


export const BUILTIN_IMPORT_CONNECTORS: Record<string, ImportConnector> = {
  [IMPORT_CONNECTOR_CSV]: {
    id: IMPORT_CONNECTOR_CSV,
    active: true,
    auto: false,
    connector_scope: ['text/csv'],
    connector_type: CONNECTOR_INTERNAL_IMPORT_FILE,
    name: 'ImportCsv',
    built_in: true,
    connector_schema_runtime_fn: (context: AuthContext, user: AuthUser) => listAllEntities(context, user, [ENTITY_TYPE_CSV_MAPPER]),// Add JSON schema (runtime configuration VS static configuration in webhook) to display in front side
    // connector_schema_runtime_ui: '', // Si besoin
    // Handle not schema config if not present
  },
}
