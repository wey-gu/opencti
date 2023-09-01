import { ENTITY_TYPE_IDENTITY_INDIVIDUAL, ENTITY_TYPE_THREAT_ACTOR_GROUP } from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';
import { ENTITY_TYPE_LABEL } from '../../../../src/schema/stixMetaObject';

export const csvMapperMockSimpleEntityWithRef: CsvMapperDefinition = {
  id: 'mapper-mock-simple-entity',
  has_header: true,
  representations: [
    {
      id: 'representation01',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_THREAT_ACTOR_GROUP,
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'B',
            multiple: false,
          },
        },
        {
          key: 'createdBy',
          based_on: {
            representation: 'representation02',
            multiple: false,
          },
        },
        {
          key: 'objectLabel',
          based_on: {
            representation: 'representation03',
            multiple: false,
          },
        }
      ]
    },
    {
      id: 'representation02',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_IDENTITY_INDIVIDUAL,
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'A',
            multiple: false,
          },
        }
      ]
    },
    {
      id: 'representation03',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_LABEL,
      },
      attributes: [
        {
          key: 'value',
          column: {
            column_name: 'C',
            multiple: false,
          },
        }
      ]
    }
  ]
}
