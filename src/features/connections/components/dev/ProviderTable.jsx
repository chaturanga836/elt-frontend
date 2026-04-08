import React, { useState, useEffect } from "react";
import { Table, Input, Tag, Space, Button, Card, Typography, message } from "antd";
import { SearchOutlined, ReloadOutlined, SettingOutlined, PlusOutlined } from "@ant-design/icons";
import getProviders from "@/services/connection.service"; // The Axios instance with Bearer token
import { useRouter } from "next/navigation";
const { Title } = Typography;

const ProviderTable = () => {
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    // Fetch providers from FastAPI
    const fetchProviders = async () => {
        setLoading(true);
        try {
            const response = await connectionService.getProviders();
            setDataSource(response.data);
        } catch (err) {
            // message.error("Failed to load providers");
            messageApi.open({
                type: "error",
                content: "Failed to load providers",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    // Filter logic for the search bar
    const filteredData = dataSource.filter(
        (item) => item.name.toLowerCase().includes(searchText.toLowerCase()) || item.handler_dag_id.toLowerCase().includes(searchText.toLowerCase()),
    );


    const columns = [
        {
            title: "Provider Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: "Airflow DAG ID",
            dataIndex: "handler_dag_id",
            key: "handler_dag_id",
            render: (dag) => <Tag color="blue">{dag}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "is_active",
            key: "is_active",
            render: (active) => <Tag color={active ? "green" : "volcano"}>{active ? "ACTIVE" : "DISABLED"}</Tag>,
        },
        {
            title: "Actions",
            key: "action",
            render: (_, record) => (
                <Space size="middle">
                    <Button type="link" icon={<SettingOutlined />}>
                        Configure
                    </Button>
                    <Button type="link" danger>
                        Disable
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <Card style={{ margin: "24px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <Title level={3}>Registered Providers</Title>
                    <Space>
                        <Input.Search
                            placeholder="Search providers or DAGs..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="large"
                            onSearch={(value) => setSearchText(value)}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 300 }}
                        />
                        <Button icon={<PlusOutlined />} onClick={() => router.push(`/connections/connection-dev/add`)} loading={loading}></Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchProviders} loading={loading}>
                            Refresh
                        </Button>
                    </Space>
                </div>

                <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
        </>
    );
};

export default ProviderTable;
