import type { AuthContext, AuthUser } from '../../../types/user';
import { listEntitiesPaginated, storeLoadById } from '../../../database/middleware-loader';
import { type BasicStoreEntityCsvMapper, ENTITY_TYPE_CSV_MAPPER, type StoreEntityCsvMapper } from './csvMapper-types';
import type { CsvMapperAddInput, EditInput, QueryCsvMappersArgs } from '../../../generated/graphql';
import { createInternalObject, deleteInternalObject, editInternalObject } from '../../../domain/internalObject';

export const findById = (context: AuthContext, user: AuthUser, csvMapperId: string) => {
    return storeLoadById<BasicStoreEntityCsvMapper>(context, user, csvMapperId, ENTITY_TYPE_CSV_MAPPER);
};

export const findAll = (context: AuthContext, user: AuthUser, opts: QueryCsvMappersArgs) => {
    return listEntitiesPaginated<BasicStoreEntityCsvMapper>(context, user, [ENTITY_TYPE_CSV_MAPPER], opts);
};

export const createCsvMapper = async (context: AuthContext, user: AuthUser, csvMapperInput: CsvMapperAddInput) => {
    return createInternalObject<StoreEntityCsvMapper>(context, user, csvMapperInput, ENTITY_TYPE_CSV_MAPPER);
};

export const fieldPatchCsvMapper = async (context: AuthContext, user: AuthUser, csvMapperId: string, input: EditInput[]) => {
    return editInternalObject<StoreEntityCsvMapper>(context, user, csvMapperId, ENTITY_TYPE_CSV_MAPPER, input);
}

export const deleteCsvMapper = async (context: AuthContext, user: AuthUser, csvMapperId: string) => {
    return deleteInternalObject(context, user, csvMapperId, ENTITY_TYPE_CSV_MAPPER);
};
