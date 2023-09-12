import type { Resolvers } from '../../../generated/graphql';
import { createCsvMapper, deleteCsvMapper, fieldPatchCsvMapper, findAll, findById } from './csvMapper-domain';

const csvMapperResolvers: Resolvers = {
  Query: {
    csvMapper: (_, {id}, context) => findById(context, context.user, id),
    csvMappers: (_, args, context) => findAll(context, context.user, args),
  },
  Mutation: {
    csvMapperAdd: (_, { input }, context) => {
      return createCsvMapper(context, context.user, input);
    },
    csvMapperDelete: (_, { id }, context) => {
      return deleteCsvMapper(context, context.user, id);
    },
    csvMapperFieldPatch: (_, { id, input }, context) => {
      return fieldPatchCsvMapper(context, context.user, id, input);
    },
  }
};

export default csvMapperResolvers;
