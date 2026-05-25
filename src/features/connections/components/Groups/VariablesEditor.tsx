import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { generateId } from '@/lib/generateId';

const { Text } = Typography;

export interface VarRow {
  uiId: string;
  key: string;
  value: string;
}

export function createEmptyVar(): VarRow {
  return { uiId: generateId(), key: '', value: '' };
}

interface VariablesEditorProps {
  variables: VarRow[];
  onChange: (variables: VarRow[]) => void;
}

export default function VariablesEditor({ variables, onChange }: VariablesEditorProps) {
  const update = (uiId: string, field: 'key' | 'value', val: string) =>
    onChange(variables.map((v) => (v.uiId === uiId ? { ...v, [field]: val } : v)));

  const remove = (uiId: string) =>
    onChange(variables.filter((v) => v.uiId !== uiId));

  const add = () => onChange([...variables, createEmptyVar()]);

  return (
    <>
      <Text type="secondary" className="block mb-3 text-xs">
        Shared variables available to all endpoints via {'{{variable_name}}'} syntax.
        Endpoints can override these.
      </Text>
      {variables.map((v) => (
        <div key={v.uiId} className="flex gap-2 mb-2">
          <Input
            placeholder="key"
            value={v.key}
            onChange={(e) => update(v.uiId, 'key', e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="value"
            value={v.value}
            onChange={(e) => update(v.uiId, 'value', e.target.value)}
            className="flex-1"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => remove(v.uiId)}
            disabled={variables.length === 1}
          />
        </div>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={add}
        size="small"
      >
        Add Variable
      </Button>
    </>
  );
}
