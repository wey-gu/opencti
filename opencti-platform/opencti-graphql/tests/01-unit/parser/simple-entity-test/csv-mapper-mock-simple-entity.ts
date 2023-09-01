import { ENTITY_TYPE_THREAT_ACTOR_GROUP } from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';

export const csvMapperMockSimpleEntity: CsvMapperDefinition = {
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
            column_name: 'R',
            multiple: false,
          },
        },
        {
          key: 'threat_actor_types',
          column: {
            column_name: 'AG',
            multiple: true,
            configuration: {
              seperator: ',',
            }
          },
        },
      ]
    }
  ]
}
