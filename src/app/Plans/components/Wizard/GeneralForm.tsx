import * as React from 'react';
import { Alert, Form, FormGroup, Spinner, TextArea, Title } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { getFormGroupProps, ValidatedTextInput } from '@konveyor/lib-ui';

import SimpleSelect, { OptionWithValue } from '@app/common/components/SimpleSelect';
import { IOpenShiftProvider, IPlan, IVMwareProvider } from '@app/queries/types';
import { useProvidersQuery } from '@app/queries';
import LoadingEmptyState from '@app/common/components/LoadingEmptyState';
import { PlanWizardFormState } from './PlanWizard';
import { useNamespacesQuery } from '@app/queries/namespaces';

interface IGeneralFormProps {
  form: PlanWizardFormState['general'];
  planBeingEdited: IPlan | null;
}

const GeneralForm: React.FunctionComponent<IGeneralFormProps> = ({
  form,
  planBeingEdited,
}: IGeneralFormProps) => {
  const providersQuery = useProvidersQuery();
  const vmwareProviders = providersQuery.data?.vsphere || [];
  const openshiftProviders = providersQuery.data?.openshift || [];

  const namespacesQuery = useNamespacesQuery(form.values.targetProvider);

  if (providersQuery.isLoading) {
    return <LoadingEmptyState />;
  }
  if (providersQuery.isError) {
    return <Alert variant="danger" isInline title="Error loading providers" />;
  }

  const sourceProvidersOptions = Object.values(vmwareProviders).map((provider) => ({
    toString: () => provider.name,
    value: provider,
  })) as OptionWithValue<IVMwareProvider>[];

  const targetProvidersOptions = Object.values(openshiftProviders).map((provider) => ({
    toString: () => provider.name,
    value: provider,
  })) as OptionWithValue<IOpenShiftProvider>[];

  return (
    <Form className={spacing.pbXl}>
      <Title headingLevel="h2" size="md">
        Give your plan a name and a description
      </Title>
      <ValidatedTextInput
        field={form.fields.planName}
        label="Plan name"
        isRequired
        fieldId="plan-name"
        inputProps={{ isDisabled: !!planBeingEdited }}
      />
      <ValidatedTextInput
        component={TextArea}
        field={form.fields.planDescription}
        label="Plan description"
        fieldId="plan-description"
      />
      <Title headingLevel="h3" size="md">
        Select source and target providers
      </Title>
      <FormGroup
        label="Source provider"
        isRequired
        fieldId="source-provider"
        {...getFormGroupProps(form.fields.sourceProvider)}
      >
        <SimpleSelect
          id="source-provider"
          aria-label="Source provider"
          options={sourceProvidersOptions}
          value={[
            sourceProvidersOptions.find(
              (option) => option.value.name === form.values.sourceProvider?.name
            ),
          ]}
          onChange={(selection) =>
            form.fields.sourceProvider.setValue(
              (selection as OptionWithValue<IVMwareProvider>).value
            )
          }
          placeholderText="Select a provider"
        />
      </FormGroup>
      <FormGroup
        label="Target provider"
        isRequired
        fieldId="target-provider"
        {...getFormGroupProps(form.fields.targetProvider)}
      >
        <SimpleSelect
          id="target-provider"
          aria-label="Target provider"
          options={targetProvidersOptions}
          value={[
            targetProvidersOptions.find(
              (option) => option.value.name === form.values.targetProvider?.name
            ),
          ]}
          onChange={(selection) =>
            form.fields.targetProvider.setValue(
              (selection as OptionWithValue<IOpenShiftProvider>).value
            )
          }
          placeholderText="Select a provider"
        />
      </FormGroup>
      <FormGroup
        label="Target namespace"
        isRequired
        fieldId="target-namespace"
        {...getFormGroupProps(form.fields.targetNamespace)}
      >
        {namespacesQuery.isLoading ? (
          <Spinner size="lg" className={spacing.mXs} />
        ) : namespacesQuery.isError ? (
          <Alert variant="danger" isInline title="Error loading namespaces" />
        ) : (
          <SimpleSelect
            variant="typeahead"
            isCreatable
            id="target-namespace"
            aria-label="Target namespace"
            options={namespacesQuery.data?.map((namespace) => namespace.name) || []}
            value={form.values.targetNamespace}
            onChange={(selection) => form.fields.targetNamespace.setValue(selection as string)}
            placeholderText="Select a namespace"
            isDisabled={!form.values.targetProvider}
          />
        )}
      </FormGroup>
    </Form>
  );
};

export default GeneralForm;
