import React, { FunctionComponent } from 'react';
import {
  CsvMapperLinesPaginationQuery$variables
} from '@components/data/csvMapper/__generated__/CsvMapperLinesPaginationQuery.graphql';
import { Field, Form, Formik, FormikConfig } from 'formik';
import TextField from '../../../../components/TextField';
import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import { Theme } from '../../../../components/Theme';
import { graphql, useMutation } from 'react-relay';
import * as Yup from 'yup';
import { useFormatter } from '../../../../components/i18n';
import { insertNode } from '../../../../utils/store';
import { CsvMapperAddInput } from './__generated__/CsvMapperCreationMutation.graphql';
import Drawer, { DrawerVariant } from '@components/common/drawer/Drawer';

const useStyles = makeStyles<Theme>((theme) => ({
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
}));

const csvMapperCreation = graphql`
  mutation CsvMapperCreationMutation($input: CsvMapperAddInput!) {
    csvMapperAdd(input: $input) {
      id
      name
      has_header
    }
  }
`;

const csvMapperValidation = (t: (v: string) => string) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
});

interface CsvMapperCreationFormProps {
  onClose?: () => void;
  paginationOptions: CsvMapperLinesPaginationQuery$variables;
}

const CsvMapperCreationForm: FunctionComponent<CsvMapperCreationFormProps> = ({
  onClose,
  paginationOptions,
}) => {
  const classes = useStyles();
  const { t } = useFormatter();

  const [commit] = useMutation(csvMapperCreation);
  const onSubmit: FormikConfig<CsvMapperAddInput>['onSubmit'] = (
    values,
    { resetForm },
  ) => {
    const input: CsvMapperAddInput = {
      name: values.name,
      has_header: values.has_header,
      representations: values.representations ?? []
    };
    commit({
      variables: {
        input: input,
      },
      updater: (store) => insertNode(
        store,
        'Pagination_csvMappers',
        paginationOptions,
        'csvMapperAdd',
      ),
      onCompleted: () => {
        resetForm();
        if (onClose) {
          onClose();
        }
      },
    });
  };

  const initialValues: CsvMapperAddInput = {
    name: '',
    has_header: false,
    representations: [],
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={csvMapperValidation(t)}
      onSubmit={onSubmit}
      onReset={onClose}
    >
      {({ submitForm, handleReset, isSubmitting }) => (
        <Form style={{ margin: '20px 0 20px 0' }}>
          <Field
            component={TextField}
            variant="standard"
            name="name"
            label={t('Name')}
            fullWidth={true}
          />
          <div className={classes.buttons}>
            <Button
              variant="contained"
              onClick={handleReset}
              disabled={isSubmitting}
              classes={{ root: classes.button }}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={submitForm}
              disabled={isSubmitting}
              classes={{ root: classes.button }}
            >
              {t('Create')}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

interface CsvMapperCreationProps {
  paginationOptions: CsvMapperLinesPaginationQuery$variables;
}

const CsvMapperCreation: FunctionComponent<CsvMapperCreationProps> = ({
  paginationOptions
}) => {
  const { t } = useFormatter();

  return (
    <Drawer
      title={t('Create a csv mapper')}
      variant={DrawerVariant.createWithPanel}
    >
      <CsvMapperCreationForm paginationOptions={paginationOptions}/>
    </Drawer>
  );
}

export default CsvMapperCreation;
