/* eslint-disable no-param-reassign */
import moment from 'moment';
import type {
  AttributeDefinition,
  AttrType,
} from '../schema/attribute-definition';
import {
  entityType,
  relationshipType,
  standardId
} from '../schema/attribute-definition';
import { generateStandardId } from '../schema/identifier';
import { schemaAttributesDefinition } from '../schema/schema-attributes';
import { isEmptyField, isNotEmptyField } from '../database/utils';
import { schemaRelationsRefDefinition } from '../schema/schema-relationsRef';
import { handleInnerType } from '../domain/stixDomainObject';
import { columnNameToIdx } from './csv-helper';
import { isStixRelationshipExceptRef } from '../schema/stixRelationship';
import { isStixObject } from '../schema/stixCoreObject';

// TODO: compare with Julien bundle

// UI
//  Admin CRUD, validator
// Back-End
//  Flat types, validation info, elasticSearch/OpenSearch -> flat object/flatten, GraphQL real object

type IColumn = { multiple: true, column_name: string, configuration: { seperator: string, pattern_date?: string, timezone?: string } }
| { multiple: false, column_name: string, configuration?: { pattern_date?: string, timezone?: string } };
type IBasedOn = { multiple: true, representation: string[] } | { multiple: false, representation: string };
type IRef = { multiple: true, id: string[] } | { multiple: false, id: string };
interface CsvMapperRepresentationAttribute {
  key: string
  // mode: 'direct' | 'column' | 'ref' // column from csv, ref (based_on), direct -> UI field (UUID)
  column?: IColumn
  based_on?: IBasedOn
  ref?: IRef

  // TODO: handle & resolve IDs IRef
}

interface CsvMapperRepresentation {
  id: string
  type: 'entity' | 'relationship'
  target: {
    entity_type: string
    column_based?: {
      column_reference: string
      operator: 'eq' | 'neq'
      value: string
    }
  }
  attributes: CsvMapperRepresentationAttribute[]
  from?: string
  to?: string
}

export interface CsvMapperDefinition {
  id: string
  has_header: boolean
  representations: CsvMapperRepresentation[]
}

type InputType = string | string[] | number | Record<string, any>;

// -- HANDLE VALUE --

/*
  Format value depending on type
 */
const formatValue = (value: string, type: AttrType, column: IColumn) => {
  const pattern_date = column.configuration?.pattern_date;
  const timezone = column.configuration?.timezone;
  if (type === 'string') {
    return value.trim();
  } if (type === 'numeric') {
    const formatedValue = Number(value);
    return Number.isNaN(formatedValue) ? formatedValue : null;
  } if (type === 'date') {
    if (isEmptyField(pattern_date)) {
      throw Error('A pattern date is required for a date attribute');
    }
    if (isNotEmptyField(timezone)) {
      return moment(value, pattern_date, timezone).toISOString();
    }
    return moment(value, pattern_date).toISOString();
  }
  return value;
};

/*
  Compute value depending on multiplicity of attribute
 */
const computeValue = (value: string, column: IColumn, attributeDef: AttributeDefinition) => {
  if (isEmptyField(value)) {
    return null;
  }
  // Handle multiple or simple attribute
  if (attributeDef.multiple ?? false) {
    if (column.multiple && column.configuration.seperator) {
      return value.split(column.configuration.seperator).map((v) => formatValue(v, attributeDef.type, column));
    }
    return [formatValue(value, attributeDef.type, column)];
  }
  return formatValue(value, attributeDef.type, column);
};

/*
  Extract value from csv cell
 */
const extractValueFromCsv = (record: string[], columnName: string) => {
  const idx = columnNameToIdx(columnName); // Handle letter to idx here & remove headers
  if (isEmptyField(idx)) {
    throw Error(`Unknown column name ${columnName}`);
  } else {
    return record[idx as number];
  }
};

// -- VALIDATION --

/*
  Verify :
    - validity of entity type name
    - validity of column based compared to the actual line (if needed)
 */
const isValidTargetType = (record: string[], representation: CsvMapperRepresentation) => {
  if (representation.type === 'relationship') {
    if (!isStixRelationshipExceptRef(representation.target.entity_type)) {
      throw Error(`Unknown relationship ${representation.target.entity_type}`);
    }
  } else if (representation.type === 'entity') {
    if (!isStixObject(representation.target.entity_type)) {
      throw Error(`Unknown entity ${representation.target.entity_type}`);
    }
  }

  const columnBased = representation.target.column_based;
  if (columnBased) {
    const recordValue = extractValueFromCsv(record, columnBased.column_reference);
    if (columnBased.operator === 'eq') {
      return recordValue === columnBased.value;
    } if (columnBased.operator === 'neq') {
      return recordValue !== columnBased.value;
    }
    return false;
  }
  return true;
};

/*
  Verify :
    - relationship should have from and to attributes fill
    - entity should have at least one fill attributes from mapper
 */
const isFilledInput = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  if (isStixRelationshipExceptRef(input[entityType.name] as string)) {
    if (isEmptyField(input.from) || isEmptyField(input.to)) {
      return false;
    }
  }

  const { attributes } = representation;
  const keys = attributes.map((attr) => attr.key);
  return keys.some((key) => isNotEmptyField(input[key]));
};

// -- COMPUTE properties for input --

const handleType = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  const { entity_type } = representation.target;
  input[entityType.name] = entity_type;
  if (representation.type === 'relationship') {
    input[relationshipType.name] = entity_type;
  }
};
const handleOpenCtiProperties = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  return handleInnerType(input, representation.target.entity_type);
};
const handleId = (representation: CsvMapperRepresentation, input: Record<string, InputType>) => {
  input[standardId.name] = generateStandardId(representation.target.entity_type, input);
};

const handleDirectAttribute = (attributeKey: string, column: IColumn, input: Record<string, InputType>, value: string) => {
  const entity_type = input[entityType.name] as string;
  const attributeDef = schemaAttributesDefinition.getAttribute(entity_type, attributeKey);
  if (!attributeDef) {
    throw Error(`Invalid attribute ${attributeKey} for this entity ${entity_type}`);
  }
  if (column.multiple && !attributeDef?.multiple) {
    throw Error(`Invalid multiple attribute ${attributeKey} for this entity ${entity_type}`);
  }
  const computedValue = computeValue(value, column, attributeDef);
  if (computedValue) {
    input[attributeKey] = computedValue;
  }
};
const handleBasedOnAttribute = (attributeKey: string, input: Record<string, InputType>, entities: Record<string, InputType>[]) => {
  const entity_type = input[entityType.name] as string;
  // Is relation from or to (stix-core || stix-sighting)
  if (isStixRelationshipExceptRef(entity_type) && (['from', 'to'].includes(attributeKey))) {
    if (attributeKey === 'from') {
      const entity = entities[0];
      if (isNotEmptyField(entity)) {
        input.from = entity;
        input.fromType = entity[entityType.name];
      }
    } else if (attributeKey === 'to') {
      const entity = entities[0];
      if (isNotEmptyField(entity)) {
        input.to = entity;
        input.toType = entity[entityType.name];
      }
    }
  // Is relation ref
  } else {
    const relationDef = schemaRelationsRefDefinition.getRelationRef(entity_type, attributeKey);
    if (!relationDef) {
      throw Error(`Invalid attribute ${attributeKey} for this entity ${entity_type}`);
    } else {
      input[attributeKey] = relationDef.multiple ? entities : entities[0];
    }
  }
};

const handleAttributes = (record: string[], representation: CsvMapperRepresentation, input: Record<string, InputType>, map: Map<string, Record<string, InputType>>) => {
  const attributes = representation.attributes ?? [];
  attributes.forEach((attribute) => {
    // Handle based_on attribute
    if (attribute.based_on) {
      const basedOn = attribute.based_on;
      const entities = basedOn.multiple ? basedOn.representation.map((based) => map.get(based)) : [map.get(basedOn.representation)];
      if (isEmptyField(entities)) {
        throw Error(`Unknown based on ${basedOn.representation}`);
      } else {
        const definedEntities = entities.filter((e) => e !== undefined) as Record<string, InputType>[];
        handleBasedOnAttribute(attribute.key, input, definedEntities);
      }
      // Handle multiple or simple attribute
    } else if (attribute.column) {
      const { column } = attribute;
      const recordValue = extractValueFromCsv(record, column.column_name);
      handleDirectAttribute(attribute.key, attribute.column, input, recordValue);
    }
  });
};

const mapRecord = (record: string[], representation: CsvMapperRepresentation, map: Map<string, Record<string, InputType>>) => {
  if (!isValidTargetType(record, representation)) {
    return null;
  }
  let input: Record<string, InputType> = {};

  handleType(representation, input);
  input = handleOpenCtiProperties(representation, input);
  handleAttributes(record, representation, input, map);

  if (!isFilledInput(representation, input)) {
    return null;
  }

  handleId(representation, input);

  // TODO: validate input
  return input;
};
export const mappingProcess = (mapper: CsvMapperDefinition, record: string[]): Record<string, InputType>[] => {
  const { representations } = mapper;
  const representationEntities = representations.filter((r) => r.type === 'entity');
  const representationRelationships = representations.filter((r) => r.type === 'relationship');
  const results = new Map<string, Record<string, InputType>>();
  // TODO: handle order in UI side

  // 1. entities by sorting min ref in first
  representationEntities
    .sort((r1, r2) => r1.attributes.filter((attr) => attr.based_on).length - r2.attributes.filter((attr) => attr.based_on).length)
    .forEach((representation) => {
    // Compute input by representation
      const input = mapRecord(record, representation, results);
      if (input) {
        results.set(representation.id, input);
      }
    });
  // 2. relationships
  representationRelationships.forEach((representation) => {
    // Compute input by representation
    const input = mapRecord(record, representation, results);
    if (input) {
      results.set(representation.id, input);
    }
  });
  return Array.from(results.values());
};
