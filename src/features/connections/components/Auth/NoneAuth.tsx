'use client';

import { Empty } from 'antd';

export default function NoneAuth() {
  return (
    <div className="py-10 border border-dashed border-border rounded-lg bg-secondary/10">
      <Empty 
        description={<span className="text-muted-foreground text-xs font-medium">This request does not use authentication.</span>} 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
}