/* eslint-disable no-console */
import events from 'node:events';
import readline from 'node:readline';
import fs from 'node:fs';
import moment from 'moment-timezone';
import * as R from 'ramda';
import { parse } from 'csv-parse';
import { v4 as uuidv4 } from 'uuid';
import { convertTypeToStixType } from '../database/stix-converter';
import { generateStandardId } from '../schema/identifier';
import {
  ENTITY_TYPE_IDENTITY_ORGANIZATION,
  ENTITY_TYPE_IDENTITY_SECTOR,
  ENTITY_TYPE_INCIDENT,
  ENTITY_TYPE_LOCATION_CITY,
  ENTITY_TYPE_LOCATION_COUNTRY,
  ENTITY_TYPE_LOCATION_REGION,
  ENTITY_TYPE_THREAT_ACTOR_GROUP
} from '../schema/stixDomainObject';
import { RELATION_LOCATED_AT, RELATION_PART_OF, RELATION_TARGETS } from '../schema/stixCoreRelationship';
import { ENTITY_TYPE_EXTERNAL_REFERENCE } from '../schema/stixMetaObject';
import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { UnsupportedError } from '../config/errors';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';

type IRepresentation = { multiple: true, representation: string[] } | { multiple: false, representation: string };

interface CsvConverterDefinition {
  name: string
  exclude_header: boolean
  representations: {
    id: string,
    enabled: boolean
    type: 'entity' | 'relationship'
    target: {
      type: string // Entity Type
      column_based: {
        column_reference: string
        operator: 'eq'
        value: string
      } | undefined
    }
    attributes: {
      key: string
      type: 'ref' | 'direct'
      direct?: {
        multiple: boolean
        column: number
        type: 'string' | 'date' | 'number'
        type_configuration?: {
          date_format?: string
          splitter?: string
          timezone?: string
        }
      },
      ref?: IRepresentation
    }[]
  }[]
}

// (x) Date => date incident
// (x) Country 1 => VictimOrga located-at Country
// (x) Category => Incident types
// (x) Sector1 and Sector2 => VictimOrga part-of Sector
// () confidence => confidence+reliability incident
// (x) severity => severity incident
// (x) Threat actor /Malware Family => ENTITY_TYPE_THREAT_ACTOR_GROUP name [unknown = empty]
// (x) Victim = Organization name
// (x) ----------- ENTITY_TYPE_THREAT_ACTOR_GROUP target Victim
// (x) Threat type => threat action group type
// (x) description => Incident description
// (x) Source 1 and Source 2 => incident External Ref
// (x) Motivation => primary motivation ENTITY_TYPE_THREAT_ACTOR_GROUP

/*
  TODO Global remarks
  - 01. We need an unified schema resolver for an entity => schemaAttributesDefinition + schemaRelationsRefDefinition
  - 02. Processing logic could be needed, like find domain inside url for external reference source_name
  - 03. Not sure to have an idea for now to split a content to setup multiple attribute (like confidence+reliability)
  - 04. Schema must be perfectly defined (Refactor of schema PR must be merged before)
  - 05. Interface to list possible attributes must be done on schema definition (see point 01)
  - 06. Concept of inlineAttributes & attributesGenerator (see below) is not expected. Must be integrated to the schema definition
  - 07. Stix bundle should be globally checked after generation.
 */

const inlineAttributes = ['externalReferences'];

const attributesGenerator: { [k: string]: () => object } = {
  [ENTITY_TYPE_LOCATION_COUNTRY]: () => {
    return {
      x_opencti_location_type: ENTITY_TYPE_LOCATION_COUNTRY
    };
  },
  [ENTITY_TYPE_LOCATION_CITY]: () => {
    return {
      x_opencti_location_type: ENTITY_TYPE_LOCATION_CITY
    };
  },
  [ENTITY_TYPE_LOCATION_REGION]: () => {
    return {
      x_opencti_location_type: ENTITY_TYPE_LOCATION_REGION
    };
  },
  [ENTITY_TYPE_IDENTITY_SECTOR]: () => {
    return {
      identity_class: 'class'
    };
  }
};

const converter: CsvConverterDefinition = {
  name: 'my test converted',
  exclude_header: true,
  representations: [
    // META ENTITIES
    {
      id: 'EXTERNAL_REFERENCE01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_EXTERNAL_REFERENCE,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_name',
          type: 'direct',
          direct: {
            multiple: false,
            column: 16,
            type: 'string'
          }
        },
        {
          key: 'url',
          type: 'direct',
          direct: {
            multiple: false,
            column: 16,
            type: 'string'
          }
        }
      ]
    },
    {
      id: 'EXTERNAL_REFERENCE02',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_EXTERNAL_REFERENCE,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_name',
          type: 'direct',
          direct: {
            multiple: false,
            column: 16,
            type: 'string'
          }
        },
        {
          key: 'url',
          type: 'direct',
          direct: {
            multiple: false,
            column: 17,
            type: 'string'
          }
        }
      ]
    },
    // CORE ENTITIES
    {
      id: 'COUNTRY01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_LOCATION_COUNTRY,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            column: 3,
            multiple: false,
            type: 'string'
          }
        }
      ]
    },
    {
      id: 'SECTOR01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_IDENTITY_SECTOR,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            column: 7,
            multiple: false,
            type: 'string'
          }
        }
      ]
    },
    {
      id: 'SECTOR02',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_IDENTITY_SECTOR,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            column: 8,
            multiple: false,
            type: 'string'
          }
        }
      ]
    },
    {
      id: 'INCIDENT01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_INCIDENT,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            multiple: false,
            column: 5,
            type: 'string'
          }
        },
        {
          key: 'description',
          type: 'direct',
          direct: {
            multiple: false,
            column: 14,
            type: 'string'
          }
        },
        {
          key: 'incident_type',
          type: 'direct',
          direct: {
            multiple: false,
            column: 6,
            type: 'string'
          }
        }, {
          key: 'severity',
          type: 'direct',
          direct: {
            multiple: false,
            column: 10,
            type: 'string'
          }
        },
        {
          key: 'first_seen',
          type: 'direct',
          direct: {
            column: 1,
            type: 'date',
            multiple: false,
            type_configuration: {
              date_format: 'DD/MM/YYYY',
              timezone: 'Europe/Paris'
            }
          }
        },
        {
          key: 'externalReferences',
          type: 'ref',
          ref: {
            multiple: true,
            representation: ['EXTERNAL_REFERENCE01', 'EXTERNAL_REFERENCE02']
          }
        }
      ]
    },
    {
      id: 'THREAT01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_THREAT_ACTOR_GROUP,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            multiple: false,
            column: 11,
            type: 'string'
          }
        },
        {
          key: 'threat_actor_types',
          type: 'direct',
          direct: {
            column: 13,
            multiple: true,
            type: 'string',
            type_configuration: {
              splitter: '/'
            }
          }
        },
        {
          key: 'primary_motivation',
          type: 'direct',
          direct: {
            column: 18,
            multiple: false,
            type: 'string'
          }
        }
      ]
    },
    {
      id: 'ORGANIZATION01',
      enabled: true,
      type: 'entity',
      target: {
        type: ENTITY_TYPE_IDENTITY_ORGANIZATION,
        column_based: undefined
      },
      attributes: [
        {
          key: 'name',
          type: 'direct',
          direct: {
            multiple: false,
            column: 12,
            type: 'string'
          }
        }
      ]
    },
    // RELATIONSHIPS
    {
      id: 'ORGANIZATION01-LOCATED_AT-COUNTRY01',
      enabled: true,
      type: 'relationship',
      target: {
        type: RELATION_LOCATED_AT,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'ORGANIZATION01'
          }
        },
        {
          key: 'target_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'COUNTRY01'
          }
        }
      ]
    },
    {
      id: 'ORGANIZATION01-PART_OF-SECTOR01',
      enabled: true,
      type: 'relationship',
      target: {
        type: RELATION_PART_OF,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'ORGANIZATION01'
          }
        },
        {
          key: 'target_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'SECTOR01'
          }
        }
      ]
    },
    {
      id: 'ORGANIZATION01-PART_OF-SECTOR02',
      enabled: true,
      type: 'relationship',
      target: {
        type: RELATION_PART_OF,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'ORGANIZATION01'
          }
        },
        {
          key: 'target_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'SECTOR02'
          }
        }
      ]
    },
    {
      id: 'THREAT01-TARGET-ORGANIZATION01',
      enabled: true,
      type: 'relationship',
      target: {
        type: RELATION_TARGETS,
        column_based: undefined
      },
      attributes: [
        {
          key: 'source_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'THREAT01'
          }
        },
        {
          key: 'target_ref',
          type: 'ref',
          ref: {
            multiple: false,
            representation: 'ORGANIZATION01'
          }
        }
      ]
    }
  ]
};

const lineBuilder = (data: string[]) => {
  const elements = new Map<string, any>();
  const inlineElements = [];
  for (let index = 0; index < converter.representations.length; index += 1) {
    const representation = converter.representations[index];
    if (representation.enabled) {
      try {
        const generated = attributesGenerator[representation.target.type] ? attributesGenerator[representation.target.type]() : {};
        const stixData: any = { spec_version: '2.1', ...generated };
        if (representation.type === 'entity') {
          stixData.type = convertTypeToStixType(representation.target.type);
        } else {
          stixData.type = 'relationship';
          stixData.relationship_type = representation.target.type;
        }
        for (let i = 0; i < representation.attributes.length; i += 1) {
          const attribute = representation.attributes[i];
          const { key, type: attrType, direct, ref } = attribute;
          const isInlineAttribute = inlineAttributes.includes(key);
          if (attrType === 'direct' && direct) {
            const attributeDefinition = schemaAttributesDefinition.getAttribute(representation.target.type, key);
            if (!attributeDefinition) {
              throw UnsupportedError(`Cant find attribute definition for ${representation.target.type} ${key}`);
            }
            const columnData = data[direct.column];
            if (direct.multiple) {
              if (attributeDefinition.multiple === false) {
                throw UnsupportedError(`Cant configure multiple on attribute definition for ${representation.target.type} ${key}`);
              }
              if (!direct.type_configuration?.splitter) {
                throw UnsupportedError(`Missing splitter attribute definition for ${representation.target.type} ${key}`);
              }
            }
            const isAttrTargetMultiple = attributeDefinition?.multiple;
            // Handle string management with multiple
            if (direct.type === 'string') {
              if (direct.multiple && direct.type_configuration?.splitter) {
                stixData[key] = columnData.split(direct.type_configuration?.splitter);
              } else {
                stixData[key] = isAttrTargetMultiple ? [columnData] : columnData;
              }
            }
            // Handle numeric (multiple not supported)
            if (direct.type === 'number') {
              const num = Number(columnData);
              if (!Number.isNaN(num)) {
                stixData[key] = isAttrTargetMultiple ? [num] : num;
              }
            }
            // Handle date (multiple not supported)
            if (direct.type === 'date') {
              const timezone = direct.type_configuration?.timezone;
              if (timezone) {
                const date = moment.tz(columnData, direct.type_configuration?.date_format ?? '', timezone).toISOString();
                stixData[key] = isAttrTargetMultiple ? [date] : date;
              } else {
                const date = moment(columnData, direct.type_configuration?.date_format ?? '').toISOString();
                stixData[key] = isAttrTargetMultiple ? [date] : date;
              }
            }
          }
          if (attrType === 'ref' && ref && isInlineAttribute === false) {
            if (ref.multiple) {
              const references = ref.representation.map((r) => elements.get(r));
              stixData[key] = references.map((r) => r.id);
            } else {
              const reference = elements.get(ref.representation);
              stixData[key] = reference.id;
            }
          }
          if (attrType === 'ref' && ref && isInlineAttribute === true) {
            const relationDefinition = schemaRelationsRefDefinition.getRelationRef(representation.target.type, key);
            if (!relationDefinition) {
              throw UnsupportedError(`Cant find relation definition for ${representation.target.type} ${key}`);
            }
            const isAttrTargetMultiple = relationDefinition?.multiple;
            if (ref.multiple) {
              if (!isAttrTargetMultiple) {
                throw UnsupportedError(`Cant configure multiple on attribute definition for ${representation.target.type} ${key}`);
              }
              const references = ref.representation.map((r) => elements.get(r)).filter((r) => r);
              if (references.length > 0) {
                stixData[relationDefinition.stixName] = references.map((r) => R.omit(['id', 'type', 'spec_version'], r));
                inlineElements.push(...ref.representation);
              }
            } else {
              const reference = elements.get(ref.representation);
              if (reference) {
                const refData = R.omit(['id', 'type', 'spec_version'], reference);
                stixData[relationDefinition.stixName] = isAttrTargetMultiple ? [refData] : refData;
                inlineElements.push(ref.representation);
              }
            }
          }
        }
        stixData.id = generateStandardId(representation.target.type, stixData);
        elements.set(representation.id, stixData);
      } catch (e) {
        // Nothing to do here
        // console.error(e);
      }
    }
  }
  inlineElements.forEach((i) => elements.delete(i));
  return elements.values();
};

const parseCsv = async () => {
  let lineIndex = 0;

  // Setup parser
  const parser = parse({ delimiter: ',' });
  const bundle: any = {
    id: `bundle--${uuidv4()}`,
    type: 'bundle',
    objects: [],
  };

  // parsing
  parser.on('readable', () => {
    let read;
    // eslint-disable-next-line no-cond-assign
    while ((read = parser.read()) !== null) {
      if (!(lineIndex === 0 && converter.exclude_header)) {
        const parsedElements = lineBuilder(read);
        bundle.objects.push(...parsedElements);
      }
      lineIndex += 1;
    }
  });
  const rl = readline.createInterface({
    input: fs.createReadStream('./tests/data/test-schema-incidents.csv'),
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    parser.write(`${line}\n`);
  });
  parser.on('error', (err) => {
    console.error(err.message);
  });
  await events.once(rl, 'close');
  parser.end();

  // Control
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  const filteredBundle = {
    id: bundle.id,
    type: bundle.type,
    objects: R.uniqBy((item: { id: string }) => item.id, bundle.objects)
  };
  console.log(`Bundle size > ${filteredBundle.objects.length}`);
  console.log(JSON.stringify(bundle));
};

export default parseCsv;
