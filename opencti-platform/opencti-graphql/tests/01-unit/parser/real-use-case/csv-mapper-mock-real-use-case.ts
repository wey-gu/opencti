import {
    ENTITY_TYPE_IDENTITY_SECTOR,
    ENTITY_TYPE_INCIDENT,
    ENTITY_TYPE_LOCATION_COUNTRY,
    ENTITY_TYPE_THREAT_ACTOR_GROUP
} from '../../../../src/schema/stixDomainObject';
import type { CsvMapperDefinition } from '../../../../src/parser/csv-mapper';
import { ENTITY_TYPE_IDENTITY_ORGANIZATION } from '../../../../src/modules/organization/organization-types';
import { ENTITY_TYPE_EXTERNAL_REFERENCE } from '../../../../src/schema/stixMetaObject';
import { RELATION_LOCATED_AT, RELATION_PART_OF, RELATION_TARGETS } from '../../../../src/schema/stixCoreRelationship';

// A -> ID ?
// C -> Week ?
// J ->
// P
// T

export const csvMapperMockRealUseCase: CsvMapperDefinition = {
    id: 'mapper-mock-simple-entity',
    has_header: true,
    representations: [
        // ENTITIES
        {
            id: 'representationIncident01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_INCIDENT,
            },
            attributes: [
                {
                    key: 'first_seen',
                    column: {
                        column_name: 'B',
                        multiple: false,
                        configuration: {
                            pattern_date: 'DD-MM-YYYY',
                            timezone: 'Europe/Paris',
                        }
                    },
                },
                {
                    key: 'name',
                    column: {
                        column_name: 'F',
                        multiple: false,
                    },
                },
                {
                    key: 'incident_type',
                    column: {
                        column_name: 'G',
                        multiple: false,
                    },
                },
                {
                    key: 'severity',
                    column: {
                        column_name: 'K',
                        multiple: false,
                    },
                },
                {
                    key: 'description',
                    column: {
                        column_name: 'O',
                        multiple: false,
                    },
                },
                {
                    key: 'externalReferences',
                    based_on: {
                        representation: ['representationExternalRef01', 'representationExternalRef02'],
                        multiple: true
                    }
                },
            ]
        },
        {
            id: 'representationCountry01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_LOCATION_COUNTRY,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'D',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationCountry02',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_LOCATION_COUNTRY,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'E',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationSector01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_IDENTITY_SECTOR,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'H',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationSector02',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_IDENTITY_SECTOR,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'I',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationThreat01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_THREAT_ACTOR_GROUP,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'L',
                        multiple: false,
                    },
                },
                {
                    key: 'threat_actor_types',
                    column: {
                        column_name: 'N',
                        multiple: false,
                    },
                },
                {
                    key: 'primary_motivation',
                    column: {
                        column_name: 'S',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationOrganization01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_IDENTITY_ORGANIZATION,
            },
            attributes: [
                {
                    key: 'name',
                    column: {
                        column_name: 'M',
                        multiple: false,
                    },
                },
            ]
        },
        // META
        {
            id: 'representationExternalRef01',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_EXTERNAL_REFERENCE,
            },
            attributes: [
                {
                    key: 'source_name',
                    column: {
                        column_name: 'Q',
                        multiple: false,
                    },
                },
                {
                    key: 'url',
                    column: {
                        column_name: 'Q',
                        multiple: false,
                    },
                },
            ]
        },
        {
            id: 'representationExternalRef02',
            type: 'entity',
            target: {
                entity_type: ENTITY_TYPE_EXTERNAL_REFERENCE,
            },
            attributes: [
                {
                    key: 'source_name',
                    column: {
                        column_name: 'R',
                        multiple: false,
                    },
                },
                {
                    key: 'url',
                    column: {
                        column_name: 'R',
                        multiple: false,
                    },
                },
            ]
        },
        // RELATIONSHIPS
        {
            id: 'representationOrganization01-LOCATED_AT-representationCountry01',
            type: 'relationship',
            target: {
                entity_type: RELATION_LOCATED_AT,
            },
            attributes: [
                {
                    key: 'from',
                    based_on: {
                        representation: 'representationOrganization01',
                        multiple: false,
                    }
                },
                {
                    key: 'to',
                    based_on: {
                        representation: 'representationCountry01',
                        multiple: false,
                    }
                }
            ]
        },
        {
            id: 'representationOrganization01-LOCATED_AT-representationCountry02',
            type: 'relationship',
            target: {
                entity_type: RELATION_LOCATED_AT,
            },
            attributes: [
                {
                    key: 'from',
                    based_on: {
                        representation: 'representationOrganization01',
                        multiple: false,
                    }
                },
                {
                    key: 'to',
                    based_on: {
                        representation: 'representationCountry02',
                        multiple: false,
                    }
                }
            ]
        },
        {
            id: 'representationOrganization01-PART_OF-representationSector01',
            type: 'relationship',
            target: {
                entity_type: RELATION_PART_OF,
            },
            attributes: [
                {
                    key: 'from',
                    based_on: {
                        representation: 'representationOrganization01',
                        multiple: false,
                    }
                },
                {
                    key: 'to',
                    based_on: {
                        representation: 'representationSector01',
                        multiple: false,
                    }
                }
            ]
        },
        {
            id: 'representationOrganization01-PART_OF-representationSector02',
            type: 'relationship',
            target: {
                entity_type: RELATION_PART_OF,
            },
            attributes: [
                {
                    key: 'from',
                    based_on: {
                        representation: 'representationOrganization01',
                        multiple: false,
                    }
                },
                {
                    key: 'to',
                    based_on: {
                        representation: 'representationSector02',
                        multiple: false,
                    }
                }
            ]
        },
        {
            id: 'representationThreat01-TARGET-representationOrganization01',
            type: 'relationship',
            target: {
                entity_type: RELATION_TARGETS,
            },
            attributes: [
                {
                    key: 'from',
                    based_on: {
                        representation: 'representationThreat01',
                        multiple: false,
                    }
                },
                {
                    key: 'to',
                    based_on: {
                        representation: 'representationOrganization01',
                        multiple: false,
                    }
                }
            ]
        }
    ]
}
