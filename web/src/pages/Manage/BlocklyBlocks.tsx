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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
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

  const [searchParams, setSearchParams] = useState({
    name: '',
    category: '',
    enabled: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [currentPage, pageSize, searchParams]);

  /**
   * 获取分类列表
   */
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

  /**
   * 获取Blockly块列表
   */
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
   * 显示新增/编辑弹窗
   */
  const showModal = (record?: any) => {
    if (record) {
      setEditingBlock(record);
      form.setFieldsValue({
        ...record,
        // 格式化JSON用于显示
        definition: typeof record.definition === 'string'
          ? JSON.stringify(JSON.parse(record.definition), null, 2)
          : JSON.stringify(record.definition, null, 2),
      });
    } else {
      setEditingBlock(null);
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        enabled: true,
        sortOrder: 0,
        isSystem: false,
      });
    }
    setModalVisible(true);
  };

  /**
   * 显示详情弹窗
   */
  const showViewModal = (record: any) => {
    setViewingBlock(record);
    setViewModalVisible(true);
  };

  /**
   * 提交表单
   */
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

      // 提交数据
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
      fetchCategories(); // 刷新分类列表
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

  /**
   * 删除块
   */
  const handleDelete = async (id: number) => {
    try {
      await deleteBlocklyBlock(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  /**
   * 切换启用状态
   */
  const handleToggleEnabled = async (id: number, enabled: boolean) => {
    try {
      await toggleBlocklyBlock(id, enabled);
      message.success(enabled ? '已启用' : '已禁用');
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '块类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: '块名称',
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
                title="确定要删除这个块吗？"
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
      <Card title="Blockly块管理" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索块名称"
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
              新增Blockly块
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
        title={editingBlock ? '编辑Blockly块' : '新增Blockly块'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Tabs defaultActiveKey="1">
            <TabPane tab="基本信息" key="1">
              <Form.Item
                name="type"
                label="块类型（唯一标识）"
                rules={[{ required: true, message: '请输入块类型' }]}
                extra="例如：calculation_add, http_request"
              >
                <Input placeholder="例如：my_custom_block" disabled={!!editingBlock} />
              </Form.Item>

              <Form.Item
                name="name"
                label="块名称"
                rules={[{ required: true, message: '请输入块名称' }]}
              >
                <Input placeholder="例如：我的自定义块" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="块分类"
                    rules={[{ required: true, message: '请输入分类' }]}
                    extra="用于在工具箱中分组"
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
                  <Form.Item
                    name="color"
                    label="块颜色"
                    extra="16进制色值，例如：#5B80A5"
                  >
                    <Input placeholder="#5B80A5" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="sortOrder" label="排序顺序" initialValue={0}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="enabled" label="是否启用" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isSystem" label="系统块" valuePropName="checked" initialValue={false}>
                    <Switch checkedChildren="是" unCheckedChildren="否" disabled={!!editingBlock} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="块描述">
                <TextArea rows={3} placeholder="详细说明此块的功能、用途等" />
              </Form.Item>

              <Form.Item name="example" label="使用示例">
                <TextArea rows={3} placeholder="展示如何使用此块的示例" />
              </Form.Item>
            </TabPane>

            <TabPane tab="块定义(JSON)" key="2">
              <Form.Item
                name="definition"
                label="Blockly块定义"
                rules={[{ required: true, message: '请输入块定义' }]}
                extra={
                  <div>
                    <p>JSON格式的Blockly块定义，必需字段：</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>type: 块类型</li>
                      <li>message0/message: 显示文本（支持%1, %2等占位符）</li>
                      <li>args0: 输入参数定义数组</li>
                      <li>colour: 块颜色（数字或字符串）</li>
                      <li>output/previousStatement/nextStatement: 块连接类型</li>
                    </ul>
                  </div>
                }
              >
                <TextArea
                  rows={12}
                  placeholder={`示例：
{
  "type": "calculation_add",
  "message0": "计算 %1 + %2",
  "args0": [
    {"type": "input_value", "name": "A", "check": "Number"},
    {"type": "input_value", "name": "B", "check": "Number"}
  ],
  "output": "Number",
  "colour": 230,
  "tooltip": "返回两数之和",
  "helpUrl": ""
}`}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </TabPane>

            <TabPane tab="Python生成器" key="3">
              <Form.Item
                name="pythonGenerator"
                label="Python代码生成器"
                rules={[{ required: true, message: '请输入Python生成器代码' }]}
                extra={
                  <div>
                    <p>JavaScript函数体代码，用于生成Python代码：</p>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>使用 Blockly.Python.valueToCode(block, 'NAME', order) 获取输入值</li>
                      <li>使用 Blockly.Python.statementToCode(block, 'NAME') 获取语句</li>
                      <li>返回 [code, order] 数组或 code 字符串</li>
                      <li>order 使用 Blockly.Python.ORDER_* 常量</li>
                    </ul>
                  </div>
                }
              >
                <TextArea
                  rows={12}
                  placeholder={`示例：
const value_a = Blockly.Python.valueToCode(block, 'A', Blockly.Python.ORDER_ATOMIC);
const value_b = Blockly.Python.valueToCode(block, 'B', Blockly.Python.ORDER_ATOMIC);
const code = \`(\${value_a} + \${value_b})\`;
return [code, Blockly.Python.ORDER_ADDITION];`}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>

      {/* 查看详情弹窗 */}
      <Modal
        title="Blockly块详情"
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
                <div><strong>块类型:</strong> <code>{viewingBlock.type}</code></div>
                <div><strong>块名称:</strong> {viewingBlock.name}</div>
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
                <div><strong>排序顺序:</strong> {viewingBlock.sortOrder}</div>
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

            <TabPane tab="块定义" key="2">
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
