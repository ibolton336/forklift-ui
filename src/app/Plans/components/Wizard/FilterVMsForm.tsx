import * as React from 'react';
import {
  TreeView,
  Alert,
  Tabs,
  Tab,
  TabTitleText,
  TextContent,
  Text,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useSelectionState } from '@konveyor/lib-ui';
import { useVMwareTreeQuery, useVMwareVMsQuery } from '@app/queries';
import { IPlan, IVMwareProvider, VMwareTree, VMwareTreeType } from '@app/queries/types';
import {
  filterAndConvertVMwareTree,
  findMatchingNodeAndDescendants,
  findNodesMatchingSelectedVMs,
  flattenVMwareTreeNodes,
  getSelectedVMsFromPlan,
} from './helpers';
import LoadingEmptyState from '@app/common/components/LoadingEmptyState';
import { PlanWizardFormState } from './PlanWizard';

import './FilterVMsForm.css';

interface IFilterVMsFormProps {
  form: PlanWizardFormState['filterVMs'];
  sourceProvider: IVMwareProvider | null;
  planBeingEdited: IPlan | null;
}

const FilterVMsForm: React.FunctionComponent<IFilterVMsFormProps> = ({
  form,
  sourceProvider,
  planBeingEdited,
}: IFilterVMsFormProps) => {
  const [searchText, setSearchText] = React.useState('');

  const vmsQuery = useVMwareVMsQuery(sourceProvider);
  const treeQuery = useVMwareTreeQuery(sourceProvider, form.values.treeType);

  const treeSelection = useSelectionState({
    items: flattenVMwareTreeNodes(treeQuery.data || null),
    externalState: [form.fields.selectedTreeNodes.value, form.fields.selectedTreeNodes.setValue],
    isEqual: (a: VMwareTree, b: VMwareTree) => a.object?.selfLink === b.object?.selfLink,
  });

  const isFirstRender = React.useRef(true);
  const lastTreeType = React.useRef(form.values.treeType);
  React.useEffect(() => {
    // Clear or reset selection when the tree type tab changes
    const treeTypeChanged = form.values.treeType !== lastTreeType.current;
    if (!isFirstRender.current && treeTypeChanged) {
      if (!planBeingEdited || !form.values.isPrefilled) {
        treeSelection.selectAll(false);
        lastTreeType.current = form.values.treeType;
      } else if (vmsQuery.isSuccess && treeQuery.isSuccess) {
        const selectedVMs = getSelectedVMsFromPlan(planBeingEdited, vmsQuery);
        const selectedTreeNodes = findNodesMatchingSelectedVMs(treeQuery.data || null, selectedVMs);
        treeSelection.setSelectedItems(selectedTreeNodes);
        lastTreeType.current = form.values.treeType;
      }
    }
    isFirstRender.current = false;
  }, [
    form.values.treeType,
    form.values.isPrefilled,
    planBeingEdited,
    treeQuery,
    vmsQuery,
    treeSelection,
  ]);

  return (
    <div className="plan-wizard-filter-vms-form">
      <TextContent>
        <Text component="p">Filter the list of VMs that can be selected for migration.</Text>
      </TextContent>
      <Tabs
        activeKey={form.values.treeType}
        onSelect={(_event, tabKey) => form.fields.treeType.setValue(tabKey as VMwareTreeType)}
        className={spacing.mtMd}
      >
        <Tab
          key={VMwareTreeType.Host}
          eventKey={VMwareTreeType.Host}
          title={<TabTitleText>By clusters and hosts</TabTitleText>}
        />
        <Tab
          key={VMwareTreeType.VM}
          eventKey={VMwareTreeType.VM}
          title={<TabTitleText>By folders</TabTitleText>}
        />
      </Tabs>
      {vmsQuery.isLoading || treeQuery.isLoading ? (
        <LoadingEmptyState />
      ) : vmsQuery.isError ? (
        <Alert variant="danger" isInline title="Error loading VMs" />
      ) : treeQuery.isError ? (
        <Alert variant="danger" isInline title="Error loading VMware tree data" />
      ) : (
        <TreeView
          data={filterAndConvertVMwareTree(
            treeQuery.data || null,
            searchText,
            treeSelection.isItemSelected,
            treeSelection.areAllSelected
          )}
          defaultAllExpanded
          hasChecks
          onSearch={(event) => setSearchText(event.target.value)}
          onCheck={(_event, treeViewItem) => {
            if (treeViewItem.id === 'converted-root') {
              treeSelection.selectAll(!treeSelection.areAllSelected);
            } else {
              const nodesToSelect = findMatchingNodeAndDescendants(
                treeQuery.data || null,
                treeViewItem.id || ''
              );
              treeSelection.selectMultiple(
                nodesToSelect,
                !treeSelection.isItemSelected(nodesToSelect[0])
              );
            }
          }}
          searchProps={{
            id: 'inventory-search',
            name: 'search-inventory',
            'aria-label': 'Search inventory',
          }}
        />
      )}
    </div>
  );
};

export default FilterVMsForm;
