import { Handle, Position } from '@xyflow/react';
import { Card, Typography } from 'antd';

const EndNode = () => (
  <div className="end-node">
    {/* Only one handle on the left */}
    <Handle type="target" position={Position.Left} style={{ background: '#f5222d' }} />
    <Card size="small" style={{ width: 80, textAlign: 'center', background: '#fff1f0', border: '1px solid #ffa39e' }}>
      <Typography.Text strong>End</Typography.Text>
    </Card>
  </div>
);

export default EndNode;