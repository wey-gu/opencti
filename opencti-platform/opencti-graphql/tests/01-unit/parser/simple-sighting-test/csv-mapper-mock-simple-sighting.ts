import { ENTITY_TYPE_THREAT_ACTOR_GROUP } from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';
import { ENTITY_TYPE_IDENTITY_ORGANIZATION } from '../../../../src/modules/organization/organization-types';
import { STIX_SIGHTING_RELATIONSHIP } from '../../../../src/schema/stixSightingRelationship';

export const csvMapperMockSimpleSighting: CsvMapperDefinition = {
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
            column_name: 'A',
            multiple: false,
          },
        },
      ]
    }, {
      id: 'representation02',
      type: 'entity',
      target: {
        entity_type: ENTITY_TYPE_IDENTITY_ORGANIZATION,
      },
      attributes: [
        {
          key: 'name',
          column: {
            column_name: 'B',
            multiple: false,
          },
        },
      ]
    },
    {
      id: 'representation01-SIGHTING-representation02',
      type: 'relationship',
      target: {
        entity_type: STIX_SIGHTING_RELATIONSHIP,
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
            column_name: 'C',
            multiple: false,
          },
        }
      ]
    },
  ]
}
