import { ENTITY_TYPE_THREAT_ACTOR_GROUP } from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';
import { RELATION_PART_OF } from '../../../../src/schema/stixCoreRelationship';

export const csvMapperMockSimpleRelationship: CsvMapperDefinition = {
  id: 'mapper-mock-simple-relationship',
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
          key: 'confidence',
          column: {
            column_name: 'A',
            multiple: false,
          },
        }
      ]
    }, {
      id: 'representation02',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_THREAT_ACTOR_GROUP,
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'C',
            multiple: false,
          },
        },
        {
          key: 'confidence',
          column: {
            column_name: 'D',
            multiple: false,
          },
        }
      ]
    },
    {
      id: 'representation01-PART_OF-representation02',
      type: 'relationship',
      target: {
        entity_type: RELATION_PART_OF,
      },
      attributes: [
        {
          key: 'from',
          based_on: {
            representation: 'representation01',
            multiple: false,
          }
        },
        {
          key: 'to',
          based_on: {
            representation: 'representation02',
            multiple: false,
          }
        },
        {
          key: 'confidence',
          column: {
            column_name: 'E',
            multiple: false,
          },
        }
      ]
    },
  ]
}
