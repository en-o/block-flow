import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Card, Tooltip, App, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, UploadOutlined, DownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { contextApi } from '../../api/context';
import type { ContextVariable, ContextVariableCreateDTO, ContextVariableUpdateDTO } from '../../types/api';

const Context: React.FC = () => {
  const { modal } = App.useApp();
  const [variables, setVariables] = useState<ContextVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ContextVariable | null>(null);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<ContextVariable | null>(null);
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

  const handleShowUsage = (record: ContextVariable) => {
    setSelectedVariable(record);
    setUsageModalVisible(true);
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
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: ContextVariable) => (
        <Space>
          <Tooltip title="查看使用方式">
            <Button
              type="link"
              icon={<QuestionCircleOutlined />}
              onClick={() => handleShowUsage(record)}
            >
              使用方式
            </Button>
          </Tooltip>
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
      {/* 搜索、筛选和使用说明 - 合并为一个紧凑的区域 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {/* 搜索和筛选 */}
          <Space wrap style={{ width: '100%' }}>
            <Form form={searchForm} layout="inline" style={{ marginBottom: 0 }}>
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input placeholder="搜索变量名" style={{ width: 180 }} />
              </Form.Item>
            </Form>
            <Form form={filterForm} layout="inline" style={{ marginBottom: 0 }}>
              <Form.Item name="groupName" style={{ marginBottom: 0 }}>
                <Input placeholder="分组" style={{ width: 120 }} />
              </Form.Item>
            </Form>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="small">
              搜索
            </Button>
            <Button icon={<FilterOutlined />} onClick={handleFilter} size="small">
              筛选
            </Button>
            <Button onClick={handleResetFilter} size="small">
              重置
            </Button>
          </Space>

          {/* 使用说明 - 可折叠 */}
          <Alert
            message={
              <span>
                <strong>使用说明：</strong>
                通过 <code>inputs.get('ctx.变量名')</code> 获取，
                如 <code>inputs.get('ctx.DB_HOST', '默认值')</code>，
                详细用法点击表格中的"使用方式"
              </span>
            }
            type="info"
            showIcon
            closable
            style={{ marginBottom: 0 }}
          />
        </Space>
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

          {/* 环境字段隐藏，默认为DEFAULT */}
          <Form.Item
            name="environment"
            initialValue="DEFAULT"
            hidden
          >
            <Input />
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

          {/* 环境字段隐藏 */}
        </Form>
      </Modal>

      {/* 使用方式详情 Modal */}
      <Modal
        title={`变量使用方式：${selectedVariable?.varKey || ''}`}
        open={usageModalVisible}
        onCancel={() => {
          setUsageModalVisible(false);
          setSelectedVariable(null);
        }}
        width={800}
        footer={[
          <Button key="close" type="primary" onClick={() => setUsageModalVisible(false)}>
            知道了
          </Button>,
        ]}
      >
        {selectedVariable && (
          <div>
            <Card size="small" title="变量信息" style={{ marginBottom: 16 }}>
              <p><strong>变量名：</strong>{selectedVariable.varKey}</p>
              <p><strong>类型：</strong>
                <Tag color={
                  selectedVariable.varType === 'TEXT' ? 'blue' :
                  selectedVariable.varType === 'SECRET' ? 'red' :
                  selectedVariable.varType === 'JSON' ? 'green' :
                  selectedVariable.varType === 'NUMBER' ? 'cyan' : 'orange'
                }>
                  {selectedVariable.varType === 'TEXT' ? '文本' :
                   selectedVariable.varType === 'SECRET' ? '密钥' :
                   selectedVariable.varType === 'JSON' ? 'JSON' :
                   selectedVariable.varType === 'NUMBER' ? '数字' : '文件'}
                </Tag>
              </p>
              {selectedVariable.groupName && (
                <p><strong>分组：</strong>{selectedVariable.groupName}</p>
              )}
              {selectedVariable.description && (
                <p><strong>描述：</strong>{selectedVariable.description}</p>
              )}
            </Card>

            <Card size="small" title="在Python脚本中使用" style={{ marginBottom: 16 }}>
              <h4>1. 基本用法</h4>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取变量值
${selectedVariable.varKey.toLowerCase()} = inputs.get('ctx.${selectedVariable.varKey}')

# 带默认值
${selectedVariable.varKey.toLowerCase()} = inputs.get('ctx.${selectedVariable.varKey}', '默认值')`}
              </pre>

              <h4>2. 实际示例</h4>
              {selectedVariable.varType === 'TEXT' && (
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取文本类型的变量
${selectedVariable.varKey.toLowerCase()} = inputs.get('ctx.${selectedVariable.varKey}', '')
print(f"变量值: {${selectedVariable.varKey.toLowerCase()}}")

outputs = {
    "value": ${selectedVariable.varKey.toLowerCase()},
    "message": "成功获取变量"
}`}
                </pre>
              )}

              {selectedVariable.varType === 'SECRET' && (
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取密钥类型的变量（已加密存储）
${selectedVariable.varKey.toLowerCase()} = inputs.get('ctx.${selectedVariable.varKey}')

# 使用密钥进行认证
import requests
response = requests.get(
    'https://api.example.com/data',
    headers={'Authorization': f'Bearer {${selectedVariable.varKey.toLowerCase()}}'}
)

outputs = {"status": response.status_code}`}
                </pre>
              )}

              {selectedVariable.varType === 'JSON' && (
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取JSON类型的变量
import json
${selectedVariable.varKey.toLowerCase()}_json = inputs.get('ctx.${selectedVariable.varKey}', '{}')

# 解析JSON
${selectedVariable.varKey.toLowerCase()} = json.loads(${selectedVariable.varKey.toLowerCase()}_json)

# 访问JSON字段
field_value = ${selectedVariable.varKey.toLowerCase()}.get('field_name')

outputs = {
    "data": ${selectedVariable.varKey.toLowerCase()},
    "field": field_value
}`}
                </pre>
              )}

              {selectedVariable.varType === 'NUMBER' && (
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取数字类型的变量
${selectedVariable.varKey.toLowerCase()}_str = inputs.get('ctx.${selectedVariable.varKey}', '0')

# 转换为数字
${selectedVariable.varKey.toLowerCase()} = int(${selectedVariable.varKey.toLowerCase()}_str)
# 或者使用 float()
# ${selectedVariable.varKey.toLowerCase()} = float(${selectedVariable.varKey.toLowerCase()}_str)

# 使用数字进行计算
result = ${selectedVariable.varKey.toLowerCase()} * 2

outputs = {
    "original": ${selectedVariable.varKey.toLowerCase()},
    "result": result
}`}
                </pre>
              )}

              {selectedVariable.varType === 'FILE' && (
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
{`# 获取文件路径
file_path = inputs.get('ctx.${selectedVariable.varKey}')

# 读取文件内容
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

outputs = {
    "file_path": file_path,
    "content_length": len(content)
}`}
                </pre>
              )}
            </Card>

            <Card size="small" title="重要说明">
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>变量名前必须加 <code>ctx.</code> 前缀</li>
                <li>推荐使用 <code>inputs.get()</code> 方法并提供默认值，避免变量不存在时报错</li>
                <li>SECRET类型的变量在存储时已加密，使用时会自动解密</li>
                <li>JSON类型的变量需要使用 <code>json.loads()</code> 解析后使用</li>
                <li>NUMBER类型的变量获取后是字符串，需要转换为 <code>int</code> 或 <code>float</code></li>
              </ul>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Context;
