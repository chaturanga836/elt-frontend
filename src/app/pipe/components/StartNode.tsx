import { Handle, Position } from '@xyflow/react';
import { Card, Typography } from 'antd';

const StartNode = () => (
  <div className="start-node">
    <Card size="small" style={{ width: 80, textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
      <Typography.Text strong>Start</Typography.Text>
    </Card>
    {/* Only one handle on the right */}
    <Handle type="source" position={Position.Right} style={{ background: '#52c41a' }} />
  </div>
);

export default StartNode;