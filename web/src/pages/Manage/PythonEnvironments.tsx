import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Card,
  InputNumber,
  Switch,
  Divider,
  List,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { pythonEnvApi } from '../../api/pythonEnv';
import type { PythonEnvironment, PythonEnvironmentCreateDTO, PythonEnvironmentUpdateDTO, PythonEnvironmentPage } from '../../types/api';

const PythonEnvironments: React.FC = () => {
  const [environments, setEnvironments] = useState<PythonEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnv, setEditingEnv] = useState<PythonEnvironment | null>(null);
  const [searchParams, setSearchParams] = useState<PythonEnvironmentPage>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [packagesModalVisible, setPackagesModalVisible] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<PythonEnvironment | null>(null);
  const [packageForm] = Form.useForm();
  const [requirementsModalVisible, setRequirementsModalVisible] = useState(false);
  const [requirementsForm] = Form.useForm();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async (params?: PythonEnvironmentPage) => {
    setLoading(true);
    try {
      const queryParams: PythonEnvironmentPage = {
        ...searchParams,
        ...params,
        page: {
          pageNum: (params?.page?.pageNum !== undefined ? params.page.pageNum : pagination.current - 1),
          pageSize: (params?.page?.pageSize !== undefined ? params.page.pageSize : pagination.pageSize),
        }
      };

      const response = await pythonEnvApi.page(queryParams);
      if (response.code === 200 && response.data) {
        setEnvironments(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取Python环境列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEnvironments({ ...values, page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEnvironments({ page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleAdd = () => {
    setEditingEnv(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PythonEnvironment) => {
    setEditingEnv(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个Python环境吗？',
      onOk: async () => {
        try {
          await pythonEnvApi.delete(id);
          message.success('删除成功');
          fetchEnvironments();
        } catch (error: any) {
          message.error(error.message || '删除失败');
          throw error; // 抛出错误以保持 Modal 打开
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingEnv) {
        const updateData: PythonEnvironmentUpdateDTO = {
          id: editingEnv.id,
          ...values
        };
        await pythonEnvApi.update(updateData);
        message.success('更新成功');
      } else {
        const createData: PythonEnvironmentCreateDTO = values;
        await pythonEnvApi.create(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchEnvironments();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await pythonEnvApi.setAsDefault(id);
      message.success('设置默认环境成功');
      fetchEnvironments();
    } catch (error) {
      console.error('设置默认环境失败', error);
    }
  };

  const handleManagePackages = (record: PythonEnvironment) => {
    setSelectedEnv(record);
    setPackagesModalVisible(true);
  };

  const handleInstallPackage = async () => {
    if (!selectedEnv) return;

    try {
      const values = await packageForm.validateFields();
      await pythonEnvApi.installPackage(selectedEnv.id, values);
      message.success('安装成功');
      packageForm.resetFields();
      fetchEnvironments();
    } catch (error) {
      console.error('安装包失败', error);
    }
  };

  const handleUninstallPackage = async (packageName: string) => {
    if (!selectedEnv) return;

    try {
      await pythonEnvApi.uninstallPackage(selectedEnv.id, packageName);
      message.success('卸载成功');
      fetchEnvironments();
    } catch (error) {
      console.error('卸载包失败', error);
    }
  };

  const handleExportRequirements = async (env: PythonEnvironment) => {
    try {
      const response = await pythonEnvApi.exportRequirements(env.id);
      if (response.code === 200 && response.data) {
        const blob = new Blob([response.data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `requirements-${env.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('导出成功');
      }
    } catch (error) {
      console.error('导出失败', error);
    }
  };

  const handleImportRequirements = async () => {
    if (!selectedEnv) return;

    try {
      const values = await requirementsForm.validateFields();
      await pythonEnvApi.importRequirements(selectedEnv.id, values.requirementsText);
      message.success('导入成功');
      setRequirementsModalVisible(false);
      requirementsForm.resetFields();
      fetchEnvironments();
    } catch (error) {
      console.error('导入失败', error);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchEnvironments({
      ...searchParams,
      page: {
        pageNum: pag.current - 1,
        pageSize: pag.pageSize
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '环境名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: PythonEnvironment) => (
        <Space>
          {name}
          {record.isDefault && (
            <Tag icon={<StarFilled />} color="gold">
              默认
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Python版本',
      dataIndex: 'pythonVersion',
      key: 'pythonVersion',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: '已安装包',
      dataIndex: 'packages',
      key: 'packages',
      width: 150,
      render: (packages: Record<string, any>) => {
        const count = packages ? Object.keys(packages).length : 0;
        return (
          <Tag color="blue">
            {count} 个包
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 380,
      fixed: 'right' as const,
      render: (_: any, record: PythonEnvironment) => (
        <Space>
          {!record.isDefault && (
            <Button
              type="link"
              icon={<StarOutlined />}
              onClick={() => handleSetDefault(record.id)}
            >
              设为默认
            </Button>
          )}
          <Button
            type="link"
            onClick={() => handleManagePackages(record)}
          >
            管理包
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleExportRequirements(record)}
          >
            导出
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.isDefault}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Form form={searchForm} layout="inline">
          <Form.Item name="name" label="环境名称">
            <Input placeholder="请输入环境名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="pythonVersion" label="Python版本">
            <Input placeholder="例如: 3.9" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleResetSearch}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建Python环境
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={environments}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingEnv ? '编辑Python环境' : '新建Python环境'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="环境名称"
            name="name"
            rules={[{ required: true, message: '请输入环境名称' }]}
          >
            <Input placeholder="例如: python39-prod" />
          </Form.Item>

          <Form.Item
            label="Python版本"
            name="pythonVersion"
            rules={[{ required: true, message: '请输入Python版本' }]}
          >
            <Input placeholder="例如: 3.9.16" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="环境描述" />
          </Form.Item>

          <Form.Item
            label="是否默认"
            name="isDefault"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 管理包 Modal */}
      <Modal
        title={`管理包 - ${selectedEnv?.name}`}
        open={packagesModalVisible}
        onCancel={() => {
          setPackagesModalVisible(false);
          setSelectedEnv(null);
        }}
        width={700}
        footer={[
          <Button
            key="import"
            icon={<UploadOutlined />}
            onClick={() => {
              setPackagesModalVisible(false);
              setRequirementsModalVisible(true);
            }}
          >
            导入 requirements.txt
          </Button>,
          <Button key="close" onClick={() => setPackagesModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Card size="small" title="安装新包" style={{ marginBottom: 16 }}>
          <Form form={packageForm} layout="inline">
            <Form.Item
              name="packageName"
              rules={[{ required: true, message: '请输入包名' }]}
            >
              <Input placeholder="包名，例如: requests" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="version">
              <Input placeholder="版本（可选）" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleInstallPackage}>
                安装
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card size="small" title="已安装包">
          <List
            dataSource={selectedEnv?.packages ? Object.entries(selectedEnv.packages) : []}
            renderItem={([name, version]) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="uninstall"
                    title="确定卸载这个包吗？"
                    onConfirm={() => handleUninstallPackage(name)}
                  >
                    <Button type="link" danger size="small">
                      卸载
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={name}
                  description={`版本: ${version || '未知'}`}
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无已安装的包' }}
          />
        </Card>
      </Modal>

      {/* 导入 requirements.txt Modal */}
      <Modal
        title={`导入 requirements.txt - ${selectedEnv?.name}`}
        open={requirementsModalVisible}
        onOk={handleImportRequirements}
        onCancel={() => {
          setRequirementsModalVisible(false);
          requirementsForm.resetFields();
        }}
        width={700}
      >
        <Form form={requirementsForm} layout="vertical">
          <Form.Item
            label="requirements.txt 内容"
            name="requirementsText"
            rules={[{ required: true, message: '请输入requirements内容' }]}
            tooltip="每行一个包，格式: package==version"
          >
            <Input.TextArea
              rows={15}
              placeholder={'requests==2.28.0\nnumpy==1.24.0\npandas==1.5.0'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PythonEnvironments;
