import React, { FunctionComponent } from 'react';
import { graphql, PreloadedQuery, useFragment, usePreloadedQuery } from 'react-relay';
import CsvMapperEdition from '@components/data/csvMapper/CsvMapperEdition';
import {
  CsvMapperEditionContainerFragment_csvMapper$key,
} from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerFragment_csvMapper.graphql';
import {
  CsvMapperEditionContainerQuery,
} from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerQuery.graphql';
import Loader, { LoaderVariant } from '../../../../components/Loader';

const csvMapperEditionContainerFragment = graphql`
  fragment CsvMapperEditionContainerFragment_csvMapper on CsvMapper {
    id
    name
    has_header
  }
`;

export const csvMapperEditionContainerQuery = graphql`
  query CsvMapperEditionContainerQuery($id: String!) {
    csvMapper(id: $id) {
      ...CsvMapperEditionContainerFragment_csvMapper
    }
  }
`;

interface CsvMapperEditionProps {
  queryRef: PreloadedQuery<CsvMapperEditionContainerQuery>;
  onClose?: () => void;
}

const CsvMapperEditionContainer: FunctionComponent<CsvMapperEditionProps> = ({
  queryRef,
  onClose,
}) => {
  const data = usePreloadedQuery(csvMapperEditionContainerQuery, queryRef);
  const csvMapper = useFragment<CsvMapperEditionContainerFragment_csvMapper$key>(csvMapperEditionContainerFragment, data.csvMapper);

  if (!csvMapper) {
    return <Loader variant={LoaderVariant.inElement} />;
  }

  return (
    <CsvMapperEdition csvMapper={csvMapper} onClose={onClose}/>
  );
};

export default CsvMapperEditionContainer;
