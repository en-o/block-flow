import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Select,
  InputNumber,
  Card,
  Row,
  Col,
  Tabs,
  Radio,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  getBlocklyBlockPage,
  createBlocklyBlock,
  updateBlocklyBlock,
  deleteBlocklyBlock,
  toggleBlocklyBlock,
  getBlocklyCategories,
  validateBlocklyDefinition,
} from '../../api/blocklyBlock';

const { TextArea } = Input;
const { TabPane } = Tabs;

const BlocklyBlocks: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [viewingBlock, setViewingBlock] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [form] = Form.useForm();

  // 新增：创建模式（simple简单/advanced高级/code代码生成）
  const [createMode, setCreateMode] = useState<'simple' | 'advanced' | 'code'>('simple');
  const [pythonCode, setPythonCode] = useState('');

  const [searchParams, setSearchParams] = useState({
    name: '',
    category: '',
    enabled: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [currentPage, pageSize, searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await getBlocklyCategories();
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getBlocklyBlockPage({
        ...searchParams,
        page: {
          page: currentPage - 1,
          size: pageSize,
        },
      });

      if (response.data.code === 200) {
        setData(response.data.data.content || []);
        setTotal(response.data.data.totalElements || 0);
      }
    } catch (error) {
      message.error('获取数据失败');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Python代码反编译为积木块定义
   */
  const parseCodeToBlock = (code: string) => {
    const trimmedCode = code.trim();

    // 1. import xxx 模式
    const importMatch = trimmedCode.match(/^import\s+(\w+)$/);
    if (importMatch) {
      const moduleName = importMatch[1];
      return {
        type: `import_${moduleName}`,
        name: `导入${moduleName}库`,
        category: 'python_imports',
        color: '#52c41a',
        definition: JSON.stringify({
          type: `import_${moduleName}`,
          message0: `import ${moduleName}`,
          previousStatement: null,
          nextStatement: null,
          colour: '#52c41a',
          tooltip: `导入${moduleName}库`,
          helpUrl: ''
        }, null, 2),
        pythonGenerator: `return 'import ${moduleName}\\n';`,
        description: `导入Python的${moduleName}库`,
        example: `import ${moduleName}`
      };
    }

    // 2. from xxx import yyy 模式
    const fromImportMatch = trimmedCode.match(/^from\s+([\w.]+)\s+import\s+(.+)$/);
    if (fromImportMatch) {
      const moduleName = fromImportMatch[1];
      const importItems = fromImportMatch[2].trim();
      return {
        type: `from_${moduleName.replace(/\./g, '_')}_import`,
        name: `从${moduleName}导入`,
        category: 'python_imports',
        color: '#52c41a',
        definition: JSON.stringify({
          type: `from_${moduleName.replace(/\./g, '_')}_import`,
          message0: `from ${moduleName} import %1`,
          args0: [
            {
              type: 'field_input',
              name: 'ITEMS',
              text: importItems
            }
          ],
          previousStatement: null,
          nextStatement: null,
          colour: '#52c41a',
          tooltip: `从${moduleName}导入指定内容`,
          helpUrl: ''
        }, null, 2),
        pythonGenerator: `const items = block.getFieldValue('ITEMS');
return \`from ${moduleName} import \${items}\\n\`;`,
        description: `从${moduleName}模块导入指定的类或函数`,
        example: `from ${moduleName} import ${importItems}`
      };
    }

    // 3. 函数调用模式 func(arg1, arg2)
    const funcCallMatch = trimmedCode.match(/^(\w+)\(([^)]*)\)$/);
    if (funcCallMatch) {
      const funcName = funcCallMatch[1];
      const args = funcCallMatch[2].split(',').map(a => a.trim()).filter(a => a);

      const argsDefinition = args.map((arg, index) => ({
        type: 'input_value',
        name: `ARG${index}`,
        check: arg.startsWith('"') || arg.startsWith("'") ? 'String' : null
      }));

      const message = `${funcName}(${args.map((_, i) => `%${i + 1}`).join(', ')})`;

      return {
        type: `func_${funcName}`,
        name: `${funcName}函数调用`,
        category: 'python_functions',
        color: '#1890ff',
        definition: JSON.stringify({
          type: `func_${funcName}`,
          message0: message,
          args0: argsDefinition,
          output: null,
          colour: '#1890ff',
          tooltip: `调用${funcName}函数`,
          helpUrl: ''
        }, null, 2),
        pythonGenerator: args.map((_, i) =>
          `const arg${i} = generator.valueToCode(block, 'ARG${i}', Order.NONE) || 'None';`
        ).join('\n') + `\nconst code = \`${funcName}(\${${args.map((_, i) => `arg${i}`).join(', \${')}})\`;
return [code, Order.FUNCTION_CALL];`,
        description: `调用${funcName}函数`,
        example: trimmedCode
      };
    }

    // 4. 赋值语句 var = value
    const assignMatch = trimmedCode.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const value = assignMatch[2].trim();

      return {
        type: `assign_${varName}`,
        name: `赋值${varName}`,
        category: 'python_variables',
        color: '#ff7a45',
        definition: JSON.stringify({
          type: `assign_${varName}`,
          message0: `${varName} = %1`,
          args0: [
            {
              type: 'input_value',
              name: 'VALUE'
            }
          ],
          previousStatement: null,
          nextStatement: null,
          colour: '#ff7a45',
          tooltip: `给${varName}赋值`,
          helpUrl: ''
        }, null, 2),
        pythonGenerator: `const value = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
const code = \`${varName} = \${value}\\n\`;
return code;`,
        description: `给变量${varName}赋值`,
        example: trimmedCode
      };
    }

    return null;
  };

  /**
   * 从Python代码生成积木块
   */
  const handleCodeGenerate = () => {
    if (!pythonCode.trim()) {
      message.warning('请输入Python代码');
      return;
    }

    const blockData = parseCodeToBlock(pythonCode);
    if (!blockData) {
      message.error('无法识别的代码模式，支持：import、from...import、函数调用、赋值语句');
      return;
    }

    // 填充表单
    form.setFieldsValue({
      ...blockData,
      enabled: true,
      sortOrder: 0,
      isSystem: false,
    });

    message.success('已生成积木块定义，请检查并保存');
    setCreateMode('advanced');
  };

  const showModal = (record?: any) => {
    if (record) {
      setEditingBlock(record);
      setCreateMode('advanced');
      form.setFieldsValue({
        ...record,
        definition: typeof record.definition === 'string'
          ? JSON.stringify(JSON.parse(record.definition), null, 2)
          : JSON.stringify(record.definition, null, 2),
      });
    } else {
      setEditingBlock(null);
      setCreateMode('simple');
      setPythonCode('');
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        sortOrder: 0,
        isSystem: false,
        color: '#1890ff',
        category: 'custom',
      });
    }
    setModalVisible(true);
  };

  const showViewModal = (record: any) => {
    setViewingBlock(record);
    setViewModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 验证块定义
      const validationResponse = await validateBlocklyDefinition(
        values.definition,
        values.pythonGenerator
      );

      if (validationResponse.data.code !== 200) {
        message.error(validationResponse.data.message || '块定义验证失败');
        return;
      }

      if (editingBlock) {
        await updateBlocklyBlock({
          ...values,
          id: editingBlock.id,
        });
        message.success('更新成功');
      } else {
        await createBlocklyBlock(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
      fetchCategories();
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        message.error('操作失败');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBlocklyBlock(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleToggleEnabled = async (id: number, enabled: boolean) => {
    try {
      await toggleBlocklyBlock(id, enabled);
      message.success(enabled ? '已启用' : '已禁用');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '积木类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '积木名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        color ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: 2,
            }} />
            <code style={{ fontSize: 12 }}>{color}</code>
          </div>
        ) : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: any) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 80,
      render: (isSystem: boolean) => (
        isSystem ? <Tag color="orange">系统</Tag> : <Tag color="green">自定义</Tag>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 60,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as 'right',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除这个积木块吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="积木块管理" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索积木名称"
              value={searchParams.name}
              onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择分类"
              value={searchParams.category || undefined}
              onChange={(value) => setSearchParams({ ...searchParams, category: value || '' })}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map((cat) => (
                <Select.Option key={cat} value={cat}>
                  {cat}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              value={searchParams.enabled}
              onChange={(value) => setSearchParams({ ...searchParams, enabled: value })}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              新增积木块
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingBlock ? '编辑积木块' : '新增积木块'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {!editingBlock && (
            <Form.Item label="创建方式">
              <Radio.Group value={createMode} onChange={(e) => setCreateMode(e.target.value)}>
                <Radio.Button value="simple">
                  <ThunderboltOutlined /> 快速创建
                </Radio.Button>
                <Radio.Button value="code">
                  代码生成
                </Radio.Button>
                <Radio.Button value="advanced">
                  高级模式
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          {createMode === 'code' && !editingBlock && (
            <>
              <Alert
                message="代码生成提示"
                description={
                  <div>
                    支持以下Python代码模式自动生成积木块：
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li><code>import requests</code> - 导入库</li>
                      <li><code>from datetime import datetime</code> - 从模块导入</li>
                      <li><code>print(message)</code> - 函数调用</li>
                      <li><code>result = 100</code> - 变量赋值</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="Python代码">
                <TextArea
                  rows={3}
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  placeholder="例如：import requests"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleCodeGenerate} block>
                  生成积木块定义
                </Button>
              </Form.Item>
            </>
          )}

          {createMode === 'simple' && !editingBlock && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Form.Item
                  name="type"
                  label="积木类型（唯一标识）"
                  rules={[{ required: true, message: '请输入积木类型' }]}
                  extra="例如：my_block, calc_sum"
                >
                  <Input placeholder="my_custom_block" />
                </Form.Item>

                <Form.Item
                  name="name"
                  label="积木名称"
                  rules={[{ required: true, message: '请输入积木名称' }]}
                >
                  <Input placeholder="我的自定义积木" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="category"
                      label="分类"
                      rules={[{ required: true, message: '请选择分类' }]}
                    >
                      <Select
                        placeholder="选择或输入新分类"
                        showSearch
                        allowClear
                        mode="tags"
                        maxTagCount={1}
                      >
                        {categories.map((cat) => (
                          <Select.Option key={cat} value={cat}>
                            {cat}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="color" label="颜色" initialValue="#1890ff">
                      <Input type="color" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="definition"
                  label="积木定义（JSON）"
                  rules={[{ required: true, message: '请输入积木定义' }]}
                  extra="简单示例，更复杂的定义请切换到高级模式"
                >
                  <TextArea
                    rows={8}
                    placeholder={`{"type":"my_block","message0":"我的积木 %1","args0":[{"type":"input_value","name":"INPUT"}],"output":null,"colour":"#1890ff","tooltip":"提示文本"}`}
                  />
                </Form.Item>

                <Form.Item
                  name="pythonGenerator"
                  label="Python生成器"
                  rules={[{ required: true, message: '请输入Python生成器' }]}
                >
                  <TextArea
                    rows={5}
                    placeholder={`const input = generator.valueToCode(block, 'INPUT', Order.NONE);
const code = \`my_function(\${input})\`;
return [code, Order.FUNCTION_CALL];`}
                  />
                </Form.Item>
              </TabPane>
            </Tabs>
          )}

          {(createMode === 'advanced' || editingBlock) && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <Form.Item
                  name="type"
                  label="积木类型"
                  rules={[{ required: true, message: '请输入积木类型' }]}
                >
                  <Input disabled={!!editingBlock} />
                </Form.Item>

                <Form.Item
                  name="name"
                  label="积木名称"
                  rules={[{ required: true, message: '请输入积木名称' }]}
                >
                  <Input />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="category"
                      label="分类"
                      rules={[{ required: true, message: '请输入分类' }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        mode="tags"
                        maxTagCount={1}
                      >
                        {categories.map((cat) => (
                          <Select.Option key={cat} value={cat}>
                            {cat}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="color" label="颜色">
                      <Input placeholder="#1890ff" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="sortOrder" label="排序" initialValue={0}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="isSystem" label="系统块" valuePropName="checked" initialValue={false}>
                      <Switch disabled={!!editingBlock} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="description" label="描述">
                  <TextArea rows={2} />
                </Form.Item>

                <Form.Item name="example" label="示例">
                  <TextArea rows={2} />
                </Form.Item>
              </TabPane>

              <TabPane tab="积木定义" key="2">
                <Form.Item
                  name="definition"
                  label="Blockly定义(JSON)"
                  rules={[{ required: true, message: '请输入定义' }]}
                >
                  <TextArea rows={15} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
              </TabPane>

              <TabPane tab="Python生成器" key="3">
                <Form.Item
                  name="pythonGenerator"
                  label="Python代码生成器"
                  rules={[{ required: true, message: '请输入生成器代码' }]}
                >
                  <TextArea rows={15} style={{ fontFamily: 'monospace' }} />
                </Form.Item>
              </TabPane>
            </Tabs>
          )}
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="积木块详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingBlock && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="基本信息" key="1">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div><strong>积木类型:</strong> <code>{viewingBlock.type}</code></div>
                <div><strong>积木名称:</strong> {viewingBlock.name}</div>
                <div><strong>分类:</strong> <Tag color="blue">{viewingBlock.category}</Tag></div>
                <div><strong>颜色:</strong> {viewingBlock.color || '-'}</div>
                <div>
                  <strong>状态:</strong>{' '}
                  {viewingBlock.enabled ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">启用</Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">禁用</Tag>
                  )}
                </div>
                <div>
                  <strong>类型:</strong>{' '}
                  {viewingBlock.isSystem ? (
                    <Tag color="orange">系统块</Tag>
                  ) : (
                    <Tag color="green">自定义块</Tag>
                  )}
                </div>
                <div><strong>排序:</strong> {viewingBlock.sortOrder}</div>
                <div><strong>版本:</strong> v{viewingBlock.version}</div>
                {viewingBlock.description && (
                  <div>
                    <strong>描述:</strong>
                    <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                      {viewingBlock.description}
                    </div>
                  </div>
                )}
                {viewingBlock.example && (
                  <div>
                    <strong>示例:</strong>
                    <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                      {viewingBlock.example}
                    </div>
                  </div>
                )}
              </Space>
            </TabPane>

            <TabPane tab="积木定义" key="2">
              <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 400,
              }}>
                {typeof viewingBlock.definition === 'string'
                  ? JSON.stringify(JSON.parse(viewingBlock.definition), null, 2)
                  : JSON.stringify(viewingBlock.definition, null, 2)}
              </pre>
            </TabPane>

            <TabPane tab="Python生成器" key="3">
              <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 400,
                fontFamily: 'monospace',
              }}>
                {viewingBlock.pythonGenerator}
              </pre>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default BlocklyBlocks;
