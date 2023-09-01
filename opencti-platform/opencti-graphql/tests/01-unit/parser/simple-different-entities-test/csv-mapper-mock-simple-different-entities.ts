import { ENTITY_TYPE_THREAT_ACTOR_GROUP } from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';
import { ENTITY_TYPE_IDENTITY_ORGANIZATION } from '../../../../src/modules/organization/organization-types';

export const csvMapperMockSimpleDifferentEntities: CsvMapperDefinition = {
  id: 'mapper-mock-simple-different-entities',
  has_header: true,
  representations: [
    {
      id: 'representation01',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_THREAT_ACTOR_GROUP,
        column_based: {
          column_reference: 'B',
          operator: 'eq',
          value: 'threat-actor'
        }
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'A',
            multiple: false,
          },
        },
      ]
    },
    {
      id: 'representation02',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_IDENTITY_ORGANIZATION,
        column_based: {
          column_reference: 'B',
          operator: 'neq',
          value: 'threat-actor'
        }
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'A',
            multiple: false,
          },
        },
      ]
    }
  ]
}
