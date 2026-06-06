
import { KeyValuePair } from "@/types/restForm";
import KeyValueTable from "./KeyValueTable";
import { Drawer } from "antd";


interface VariablesDrawerProps {
  open: boolean;
  onClose: () => void;
  variables: KeyValuePair[];
  onVariablesChange: (vars: KeyValuePair[]) => void;
}

export function VariablesDrawer({ open, onClose, variables, onVariablesChange }: VariablesDrawerProps) {
  return (
    <Drawer
      title="Connection Variables"
      open={open}
      onClose={onClose}
      closable={{ 'aria-label': 'Close Button' }}
      getContainer={() => document.body}
      zIndex={11000}
      destroyOnHidden
    >
      <KeyValueTable
        initialPairs={variables}
        keyPlaceholder="Variable Name"
        valuePlaceholder="Variable Value"
        onChange={onVariablesChange}
        useVariableInput={false}
      />
    </Drawer>
  );
}
