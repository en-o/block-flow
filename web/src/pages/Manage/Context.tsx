import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Card, Tooltip, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { contextApi } from '../../api/context';
import type { ContextVariable, ContextVariableCreateDTO, ContextVariableUpdateDTO } from '../../types/api';

const Context: React.FC = () => {
  const { modal } = App.useApp();
  const [variables, setVariables] = useState<ContextVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ContextVariable | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filterParams, setFilterParams] = useState<{
    groupName?: string;
    environment?: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD';
  }>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importForm] = Form.useForm();

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async (pageNum: number = 0, pageSize: number = 10) => {
    setLoading(true);
    try {
      const response = await contextApi.page({
        ...filterParams,
        page: {
          pageNum,
          pageSize,
        },
      });

      if (response.code === 200 && response.data) {
        setVariables(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取变量列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVariable(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ContextVariable) => {
    setEditingVariable(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个变量吗？',
      onOk: async () => {
        try {
          await contextApi.deleteContextVariable(id);
          message.success('删除成功');
          fetchVariables(pagination.current - 1, pagination.pageSize);
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

      if (editingVariable) {
        const updateData: ContextVariableUpdateDTO = {
          id: editingVariable.id,
          ...values
        };
        await contextApi.updateContextVariable(updateData);
        message.success('更新成功');
      } else {
        const createData: ContextVariableCreateDTO = values;
        await contextApi.createContextVariable(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchVariables(pagination.current - 1, pagination.pageSize);
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleFilter = async () => {
    const values = await filterForm.validateFields();
    setFilterParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));

    setLoading(true);
    try {
      const response = await contextApi.page({
        ...values,
        page: {
          pageNum: 0,
          pageSize: pagination.pageSize,
        },
      });

      if (response.code === 200 && response.data) {
        setVariables(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('筛选失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilter = () => {
    filterForm.resetFields();
    setFilterParams({});
    setSearchKeyword('');
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchVariables(0, pagination.pageSize);
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    const keyword = values.keyword || '';
    setSearchKeyword(keyword);
    setPagination(prev => ({ ...prev, current: 1 }));

    if (!keyword) {
      fetchVariables(0, pagination.pageSize);
      return;
    }

    setLoading(true);
    try {
      const response = await contextApi.page({
        varKey: keyword, // 使用 varKey 进行模糊搜索
        page: {
          pageNum: 0,
          pageSize: pagination.pageSize,
        },
      });

      if (response.code === 200 && response.data) {
        setVariables(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('搜索失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await contextApi.exportVariables(filterParams);
      if (response.code === 200 && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `context-variables-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('导出成功');
      }
    } catch (error) {
      console.error('导出失败', error);
    }
  };

  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      const variables = JSON.parse(values.jsonData);

      const response = await contextApi.importVariables(variables, {
        groupName: values.groupName,
        environment: values.environment,
      });

      if (response.code === 200) {
        message.success(`成功导入 ${response.data} 个变量`);
        setImportModalVisible(false);
        importForm.resetFields();
        fetchVariables(pagination.current - 1, pagination.pageSize);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查后重试');
      } else {
        console.error('导入失败', error);
      }
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchVariables(pag.current - 1, pag.pageSize);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '变量名',
      dataIndex: 'varKey',
      key: 'varKey',
      width: 200,
    },
    {
      title: '变量值',
      dataIndex: 'varValue',
      key: 'varValue',
      width: 250,
      render: (value: string, record: ContextVariable) => {
        if (record.varType === 'SECRET') {
          return '******';
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    {
      title: '类型',
      dataIndex: 'varType',
      key: 'varType',
      width: 100,
      render: (type: 'TEXT' | 'SECRET' | 'JSON' | 'NUMBER' | 'FILE') => {
        const colorMap: Record<string, string> = {
          TEXT: 'blue',
          SECRET: 'red',
          JSON: 'green',
          NUMBER: 'cyan',
          FILE: 'orange',
        };
        const nameMap: Record<string, string> = {
          TEXT: '文本',
          SECRET: '密钥',
          JSON: 'JSON',
          NUMBER: '数字',
          FILE: '文件',
        };
        return <Tag color={colorMap[type]}>{nameMap[type]}</Tag>;
      },
    },
    {
      title: '分组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 120,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (env: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD') => {
        const nameMap: Record<string, string> = {
          DEFAULT: '默认',
          DEV: '开发',
          TEST: '测试',
          PROD: '生产',
        };
        const colorMap: Record<string, string> = {
          DEFAULT: 'default',
          DEV: 'blue',
          TEST: 'orange',
          PROD: 'red',
        };
        return <Tag color={colorMap[env]}>{nameMap[env]}</Tag>;
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
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ContextVariable) => (
        <Space>
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
      <Card style={{ marginBottom: 16 }} size="small" title="搜索">
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="搜索变量名或值" style={{ width: 250 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={() => {
                searchForm.resetFields();
                setSearchKeyword('');
                fetchVariables(0, pagination.pageSize);
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }} size="small" title="筛选">
        <Form form={filterForm} layout="inline">
          <Form.Item name="groupName" label="分组">
            <Input placeholder="请输入分组名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="environment" label="环境">
            <Select placeholder="请选择环境" style={{ width: 150 }} allowClear>
              <Select.Option value="DEFAULT">默认</Select.Option>
              <Select.Option value="DEV">开发</Select.Option>
              <Select.Option value="TEST">测试</Select.Option>
              <Select.Option value="PROD">生产</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
                筛选
              </Button>
              <Button onClick={handleResetFilter}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建变量
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出变量
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
            导入变量
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={variables}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingVariable ? '编辑变量' : '新建变量'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="变量名"
            name="varKey"
            rules={[{ required: true, message: '请输入变量名' }]}
          >
            <Input placeholder="例如: DB_HOST" disabled={!!editingVariable} />
          </Form.Item>

          <Form.Item
            label="变量值"
            name="varValue"
            rules={[{ required: true, message: '请输入变量值' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入变量值" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="varType"
            initialValue="TEXT"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="TEXT">文本</Select.Option>
              <Select.Option value="SECRET">密钥（加密存储）</Select.Option>
              <Select.Option value="JSON">JSON</Select.Option>
              <Select.Option value="NUMBER">数字</Select.Option>
              <Select.Option value="FILE">文件</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="分组"
            name="groupName"
          >
            <Input placeholder="例如: database" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            label="环境"
            name="environment"
            initialValue="DEFAULT"
          >
            <Select>
              <Select.Option value="DEFAULT">默认</Select.Option>
              <Select.Option value="DEV">开发</Select.Option>
              <Select.Option value="TEST">测试</Select.Option>
              <Select.Option value="PROD">生产</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入变量 Modal */}
      <Modal
        title="导入变量"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false);
          importForm.resetFields();
        }}
        width={700}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item
            label="JSON数据"
            name="jsonData"
            rules={[{ required: true, message: '请输入JSON数据' }]}
            tooltip="格式: { &quot;VAR_NAME&quot;: &quot;value&quot;, ... }"
          >
            <Input.TextArea
              rows={10}
              placeholder='{"DB_HOST": "localhost", "DB_PORT": "3306"}'
            />
          </Form.Item>

          <Form.Item label="分组" name="groupName">
            <Input placeholder="可选：为导入的变量指定分组" />
          </Form.Item>

          <Form.Item label="环境" name="environment">
            <Select placeholder="可选：为导入的变量指定环境" allowClear>
              <Select.Option value="DEFAULT">默认</Select.Option>
              <Select.Option value="DEV">开发</Select.Option>
              <Select.Option value="TEST">测试</Select.Option>
              <Select.Option value="PROD">生产</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Context;
