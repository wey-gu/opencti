import React, { FunctionComponent } from 'react';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-mui';
import Button from '@mui/material/Button';
import { useFormatter } from '../../../../components/i18n';
import makeStyles from '@mui/styles/makeStyles';
import { Theme } from '../../../../components/Theme';
import { graphql, useMutation } from 'react-relay';
import * as Yup from 'yup';
import { FormikConfig } from 'formik/dist/types';
import formikFieldToEditInput from '../../../../utils/FormikUtils';
import { CsvMapperAddInput } from '@components/data/csvMapper/__generated__/CsvMapperCreationMutation.graphql';
import {
  CsvMapperEditionContainerFragment_csvMapper$data
} from '@components/data/csvMapper/__generated__/CsvMapperEditionContainerFragment_csvMapper.graphql';

const useStyles = makeStyles<Theme>((theme) => ({
  buttons: {
    marginTop: 20,
    textAlign: 'right',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
}));

const csvMapperEditionPatch = graphql`
  mutation CsvMapperEditionPatchMutation($id: ID!, $input: [EditInput!]!) {
    csvMapperFieldPatch(id: $id, input: $input) {
      ...CsvMapperEditionContainerFragment_csvMapper
    }
  }
`;

const csvMapperValidation = (t: (s: string) => string) => Yup.object().shape({
  name: Yup.string().required(t('This field is required')),
});

interface CsvMapperEditionProps {
  csvMapper: CsvMapperEditionContainerFragment_csvMapper$data;
  onClose?: () => void;
}

const CsvMapperEdition: FunctionComponent<CsvMapperEditionProps> = ({
  csvMapper,
  onClose,
}) => {
  const { t } = useFormatter();
  const classes = useStyles();

  const [commitUpdateMutation] = useMutation(csvMapperEditionPatch);

  const onSubmit: FormikConfig<CsvMapperAddInput>['onSubmit'] = (
    values,
    { setSubmitting },
  ) => {
    const input = formikFieldToEditInput(
      {
        ...values,
      },
      {
        name: csvMapper.name,
      },
    );
    if (input.length > 0) {
      commitUpdateMutation({
        variables: { id: csvMapper.id, input },
        onCompleted: () => {
          setSubmitting(false);
          if (onClose) {
            onClose();
          }
        },
      });
    } else {
      setSubmitting(false);
      if (onClose) {
        onClose();
      }
    }
  };

  const initialValues = {
    name: csvMapper.name,
    has_header: csvMapper.has_header,
    representations: csvMapper.representations,
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      validationSchema={csvMapperValidation(t)}
      onSubmit={onSubmit}
    >
      {({ submitForm, isSubmitting, isValid }) => (
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
              color="primary"
              onClick={submitForm}
              disabled={isSubmitting || !isValid}
              classes={{ root: classes.button }}
            >
              {t('Update')}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default CsvMapperEdition;
