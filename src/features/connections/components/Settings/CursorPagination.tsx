import { Input, Space, Typography } from "antd";
const { Text } = Typography;
// CursorPagination.tsx
export default function CursorPagination() {
  return (
    <Space orientation="vertical" className="w-full" size={16}>
      <div>
        <Text className="text-[10px] font-bold uppercase mb-1 block">Next Cursor Path (in Response)</Text>
        <Input placeholder="e.g. metadata.next_cursor" variant="filled" className="font-mono text-sm" />
      </div>
      <div>
        <Text className="text-[10px] font-bold uppercase mb-1 block">Cursor Request Key</Text>
        <Input placeholder="e.g. cursor" variant="filled" className="font-mono text-sm" />
      </div>
      <Text type="secondary" className="text-[11px]">
        Logic: Extract the token from the response body and inject it into the next request.
      </Text>
    </Space>
  );
}