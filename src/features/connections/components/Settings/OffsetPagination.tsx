// OffsetPagination.tsx
import { Input, Space, Typography } from 'antd';
const { Text } = Typography;

export default function OffsetPagination() {
  return (
    <Space orientation="vertical" className="w-full" size={16}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Text className="text-[10px] font-bold uppercase mb-1 block">Offset Param Key</Text>
          <Input placeholder="e.g. offset" variant="filled" className="font-mono text-sm" />
        </div>
        <div>
          <Text className="text-[10px] font-bold uppercase mb-1 block">Limit Param Key</Text>
          <Input placeholder="e.g. limit" variant="filled" className="font-mono text-sm" />
        </div>
      </div>
      <Text type="secondary" className="text-[11px]">
        Logic: Increment the offset by the number of records received in each batch.
      </Text>
    </Space>
  );
}