import type { StoreEntity } from '../../../types/store';
import type { StixObject } from '../../../types/stix-common';
import { STIX_EXT_OCTI } from '../../../types/stix-extensions';
import type { StixOpenctiExtensionSDO } from '../../../types/stix-common';
import type { BasicStoreEntity } from '../../../types/store';

export const ENTITY_TYPE_CSV_MAPPER = 'CsvMapper';

interface AttributeColumnConfiguration {
  seperator: string
  pattern_date: string
  timezone: string
}
interface AttributeColumn {
  multiple: boolean
  column_name: string
  configuration: AttributeColumnConfiguration
}
interface AttributeBasedOn {
  multiple: boolean
  representation: string
  representations: string[]
}
interface AttributeRef {
  multiple: boolean
  id: string
  ids: string[]
}

interface CsvMapperRepresentationAttribute {
  key: string
  column: AttributeColumn
  based_on: AttributeBasedOn
  ref: AttributeRef
}
enum Operator {
  eq,
  neq,
}
interface CsvMapperRepresentationTargetColumn {
  column_reference: string
  operator: Operator
  value: string
}
interface CsvMapperRepresentationTarget {
  entity_type: string
  column_based: CsvMapperRepresentationTargetColumn
}
enum CsvMapperRepresentationType {
  entity,
  relationship,
}
interface CsvMapperRepresentation {
  id: string
  type: CsvMapperRepresentationType
  target: CsvMapperRepresentationTarget
  attributes: CsvMapperRepresentationAttribute[]
  from: String
  to: String
}
export interface BasicStoreEntityCsvMapper extends BasicStoreEntity {
  name: string
  has_header: boolean
  representations: CsvMapperRepresentation[]
}

export interface StoreEntityCsvMapper extends BasicStoreEntityCsvMapper, StoreEntity {}

export interface StixCsvMapper extends StixObject {
  name: string
  has_header: boolean
  representations: CsvMapperRepresentation[]
  extensions: {
    [STIX_EXT_OCTI] : StixOpenctiExtensionSDO
  }
}
