
import { EnvVariable, KeyValuePair } from "@/types/restForm";
import { X, Variable } from "lucide-react";
import KeyValueTable from "./KeyValueTable";
import { Drawer } from "antd";


interface VariablesDrawerProps {
  open: boolean;
  onClose: () => void;
  variables: KeyValuePair[];
  onVariablesChange: (vars: KeyValuePair[]) => void;
}

export function VariablesDrawer({ open, onClose, variables, onVariablesChange }: VariablesDrawerProps) {
  if (!open) return null;

  return (
    <>
          <Drawer
            title="Connection Variables"
            open={open}
            onClose={onClose}
            closable={{ 'aria-label': 'Close Button' }}
          >
                      <KeyValueTable
            keyPlaceholder="Variable Name"
            valuePlaceholder="Variable Value"
          />
      {/* <div className="fixed inset-0 bg-background/60 z-40 animate-fade-in" onClick={onClose} /> */}
      {/* <div className="fixed right-0 top-0 bottom-0 w-120 max-w-full bg-card border-l border-border z-50 flex flex-col animate-slide-in-right shadow-2xl"> */}
        {/* <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Variable size={18} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Environment Variables</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div> */}
        {/* <div className="flex-1 overflow-auto p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Define variables to use in your requests. Reference them using <code className="text-primary font-mono">{"{{variable_name}}"}</code> syntax.
          </p>

        </div> */}
      {/* </div> */}
      </Drawer>
    </>
  );
}
