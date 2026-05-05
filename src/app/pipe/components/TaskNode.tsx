'use client';
import { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, Button, Modal, Input, Avatar, Typography, Flex, Empty } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  SettingOutlined, 
  SwapOutlined,
  CheckCircleFilled 
} from '@ant-design/icons';
import { usePipelineStore } from '@/store/usePipeStore';

const { Text } = Typography;

const CONNECTIONS_DATA = [
  { id: 1, name: 'Weather API', desc: 'Fetch rain data for Sri Lanka', color: '#1890ff' },
  { id: 2, name: 'Binance', desc: 'Get latest BTC/LKR rates', color: '#fadb14' },
  { id: 3, name: 'Postgres DB', desc: 'Read/Write to local database', color: '#3e63dd' },
  { id: 4, name: 'Trino/Hudi', desc: 'Query data lakehouse', color: '#e67e22' },
];

const TaskNode = ({ id, data }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<any>(data.config || null);
const updateNodeData = usePipelineStore((state) => state.updateNodeData);

  useEffect(() => {
    if (data.config) {
      setSelected(data.config);
    }
  }, [data.config]);
  
  const filteredConnections = CONNECTIONS_DATA.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSelect = (item: any) => {
    console.info("Selected Connection:", item);
    setSelected(item);
    setIsModalOpen(false);
    updateNodeData(id, { 
      config: item, 
      connection_id: item.id // Ensure this matches your backend's expected integer/string
    })
  };

  const openModel = () =>{
    console.info("open model");
    setIsModalOpen(true)
  }
  return (
    <div className="custom-node">
<Handle type="target" position={Position.Left} style={{ background: '#1890ff' }} />
      
      <Card 
        size="small" 
        style={{ 
          width: 110,  // Half width
          height: 40,  // Half height
          borderRadius: '4px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: selected ? `1px solid ${selected.color}` : '1px dashed #605858',
          overflow: 'hidden'
        }}
        styles={{ body: { padding: '4px 8px', width: '100%' } }}
        onClick={() => openModel()}
      >
        {!selected ? (
          <Text style={{ fontSize: '10px', color: '#605858' }}>+ Select</Text>
        ) : (
          <Flex align="center" gap={4} style={{ width: '100%' }}>
            <Avatar 
              size={18} 
              shape="square" 
              style={{ backgroundColor: selected.color, flexShrink: 0 }} 
              icon={<SettingOutlined style={{ fontSize: '10px' }} />} 
            />
            <Text strong style={{ fontSize: '10px', flexGrow: 1 }} ellipsis>
              {selected.name}
            </Text>
            {/* Small hidden swap button or just click card to change */}
          </Flex>
        )}
      </Card>

      <Handle type="source" position={Position.Right} style={{ background: '#1890ff' }} />

      <Modal
        title="Choose a Connection"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Input 
          prefix={<SearchOutlined />} 
          placeholder="Search (e.g. Postgres, Weather...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '20px' }}
          allowClear
        />

        <Flex vertical gap="small" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredConnections.length > 0 ? (
            filteredConnections.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  background: selected?.id === item.id ? '#e6f7ff' : '#fff',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = selected?.id === item.id ? '#e6f7ff' : '#fff')}
              >
                <Flex align="center" justify="space-between">
                  <Flex gap="middle" align="center">
                    <Avatar shape="square" style={{ backgroundColor: item.color }} icon={<SettingOutlined />} />
                    <div>
                      <Text strong style={{ display: 'block' }}>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.desc}</Text>
                    </div>
                  </Flex>
                  {selected?.id === item.id && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                </Flex>
              </div>
            ))
          ) : (
            <Empty description="No connections found" />
          )}
        </Flex>
      </Modal>
    </div>
  );
};

export default TaskNode;