import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import CsvMapperLines, { csvMapperLinesQuery } from '@components/data/csvMapper/CsvMapperLines';
import {
  CsvMapperLinesPaginationQuery,
  CsvMapperLinesPaginationQuery$variables,
} from '@components/data/csvMapper/__generated__/CsvMapperLinesPaginationQuery.graphql';
import CsvMapperCreation from '@components/data/csvMapper/CsvMapperCreation';
import { CsvMapperLine_csvMapper$data } from '@components/data/csvMapper/__generated__/CsvMapperLine_csvMapper.graphql';
import ListLines from '../../../components/list_lines/ListLines';
import { usePaginationLocalStorage } from '../../../utils/hooks/useLocalStorage';
import IngestionMenu from './IngestionMenu';
import Loader, { LoaderVariant } from '../../../components/Loader';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';

const LOCAL_STORAGE_KEY_CSV_MAPPERS = 'view-csvMappers';

const useStyles = makeStyles(() => ({
  container: {
    paddingRight: '200px',
  },
}));

const CsvMappers = () => {
  const classes = useStyles();

  const {
    viewStorage,
    paginationOptions,
    helpers,
  } = usePaginationLocalStorage<CsvMapperLinesPaginationQuery$variables>(LOCAL_STORAGE_KEY_CSV_MAPPERS, {
    sortBy: 'name',
    orderAsc: false,
    searchTerm: '',
  });
  const queryRef = useQueryLoading<CsvMapperLinesPaginationQuery>(
    csvMapperLinesQuery,
    paginationOptions,
  );
  const dataColumns = {
    name: {
      label: 'Name',
      width: '100%',
      isSortable: true,
      render: (data: CsvMapperLine_csvMapper$data) => data.name,
    },
  };
  return (
    <div className={classes.container}>
      <IngestionMenu />
      <ListLines
        sortBy={viewStorage.sortBy}
        orderAsc={viewStorage.orderAsc}
        dataColumns={dataColumns}
        handleSort={helpers.handleSort}
        handleSearch={helpers.handleSearch}
        displayImport={false}
        secondaryAction={true}
        keyword={viewStorage.searchTerm}
      >
        {queryRef && (
            <>
              <React.Suspense
                  fallback={<Loader variant={LoaderVariant.inElement} />}
              >
                <CsvMapperLines
                    queryRef={queryRef}
                    paginationOptions={paginationOptions}
                    dataColumns={dataColumns}
                />
              </React.Suspense>
            </>
        )}
      </ListLines>
       <CsvMapperCreation paginationOptions={paginationOptions} />
    </div>
  );
};

export default CsvMappers;
