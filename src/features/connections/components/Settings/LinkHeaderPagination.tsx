// LinkHeaderPagination.tsx
import { Input, Space, Typography } from "antd";
const { Text } = Typography;

export default function LinkHeaderPagination() {
  return (
    <div className="p-4 bg-secondary/20 rounded border border-border">
      <Text className="text-xs">
        This strategy automatically parses the <Text code>Link</Text> header from the response.
      </Text>
      <div className="mt-2">
        <Text type="secondary" className="text-[11px]">
          Example: <Text italic>Link: &lt;https://api.com/data?page=2&gt;; rel="next"</Text>
        </Text>
      </div>
    </div>
  );
}