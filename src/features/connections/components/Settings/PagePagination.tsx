import { Input, Space, Typography } from "antd";
const { Text } = Typography;
// PagePagination.tsx
export default function PagePagination() {
  return (
    <Space orientation="vertical" className="w-full" size={16}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Text className="text-[10px] font-bold uppercase mb-1 block">Page Number Key</Text>
          <Input placeholder="e.g. page" variant="filled" className="font-mono text-sm" />
        </div>
        <div>
          <Text className="text-[10px] font-bold uppercase mb-1 block">Initial Page</Text>
          <Input placeholder="1" variant="filled" className="font-mono text-sm" />
        </div>
      </div>
      <Text type="secondary" className="text-[11px]">
        Logic: Increment the page number by 1 until an empty list or 404 is returned.
      </Text>
    </Space>
  );
}