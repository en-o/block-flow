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
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
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

  // 新增：创建模式状态
  const [pythonCode, setPythonCode] = useState('');
  const [showDefinitionForm, setShowDefinitionForm] = useState(false); // 是否显示定义表单
  const [testResult, setTestResult] = useState<any>(null); // 测试结果
  const [testing, setTesting] = useState(false); // 是否正在测试
  const [testPassed, setTestPassed] = useState(false); // 测试是否通过

  // 标签页查看状态（用于控制测试按钮显示）
  const [viewedDefinitionTab, setViewedDefinitionTab] = useState(false); // 是否查看过积木定义
  const [viewedGeneratorTab, setViewedGeneratorTab] = useState(false); // 是否查看过Python生成器

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
      const response: any = await getBlocklyCategories();
      if (response.code === 200) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await getBlocklyBlockPage({
        ...searchParams,
        page: {
          pageNum: currentPage - 1,
          pageSize: pageSize,
        },
      });

      if (response.code === 200) {
        // 修复：响应拦截器已经处理过，直接使用 response.data
        setData(response.data.rows || []);
        setTotal(response.data.total || 0);
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

    // 3. 变量赋值（包括方法链式调用）var = obj.method1().method2()
    const assignMatch = trimmedCode.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const rightSide = assignMatch[2].trim();

      // 检查右侧是否是复杂表达式（包含函数调用、链式调用等）
      const isComplexExpression = rightSide.includes('(') || rightSide.includes('.') || rightSide.includes('[');

      // 如果是复杂表达式，智能提取参数
      if (isComplexExpression) {
        // 提取字符串字面量和数字作为参数
        const params: { value: string, placeholder: string, type: string }[] = [];
        let message = `${varName} = ${rightSide}`;
        let generatorCode = `const code = \`${varName} = ${rightSide}`;

        // 提取所有字符串字面量（单引号和双引号）
        const stringMatches = [...rightSide.matchAll(/(['"])(?:(?=(\\?))\2.)*?\1/g)];

        if (stringMatches.length > 0) {
          // 有字符串参数，创建可配置的输入字段
          let paramIndex = 0;
          stringMatches.forEach((match) => {
            const stringValue = match[0];
            const stringContent = stringValue.slice(1, -1); // 去掉引号
            params.push({
              value: stringContent,
              placeholder: `%${paramIndex + 1}`,
              type: 'String'
            });
            // 替换message中的字符串为占位符
            message = message.replace(stringValue, `%${paramIndex + 1}`);
            paramIndex++;
          });

          // 生成args0
          const args0 = params.map((param, idx) => ({
            type: 'input_value',
            name: `PARAM${idx}`,
            check: param.type
          }));

          // 生成Python代码生成器
          const paramGetters = params.map((_, idx) =>
            `const param${idx} = generator.valueToCode(block, 'PARAM${idx}', Order.NONE) || "''";`
          ).join('\n');

          let codeTemplate = rightSide;
          stringMatches.forEach((match, idx) => {
            codeTemplate = codeTemplate.replace(match[0], `\${param${idx}}`);
          });

          generatorCode = `${paramGetters}
const code = \`${varName} = ${codeTemplate}\\n\`;
return code;`;

          return {
            type: `assign_${varName}_params`,
            name: `${varName} = ${rightSide.substring(0, 30)}${rightSide.length > 30 ? '...' : ''}`,
            category: 'python_variables',
            color: '#ff7a45',
            definition: JSON.stringify({
              type: `assign_${varName}_params`,
              message0: message,
              args0: args0,
              previousStatement: null,
              nextStatement: null,
              colour: '#ff7a45',
              tooltip: `给变量${varName}赋值（可配置参数）`,
              helpUrl: '',
              inputsInline: false
            }, null, 2),
            pythonGenerator: generatorCode,
            description: `给变量${varName}赋值（可配置参数）`,
            example: trimmedCode
          };
        } else {
          // 没有字符串参数，创建固定积木
          return {
            type: `assign_${varName}_fixed`,
            name: `${varName} = ${rightSide.substring(0, 30)}${rightSide.length > 30 ? '...' : ''}`,
            category: 'python_variables',
            color: '#ff7a45',
            definition: JSON.stringify({
              type: `assign_${varName}_fixed`,
              message0: `${varName} = ${rightSide}`,
              previousStatement: null,
              nextStatement: null,
              colour: '#ff7a45',
              tooltip: `给变量${varName}赋值：${rightSide}`,
              helpUrl: ''
            }, null, 2),
            pythonGenerator: `const code = \`${trimmedCode}\\n\`;
return code;`,
            description: `给变量${varName}赋值（固定表达式）`,
            example: trimmedCode
          };
        }
      }
      // 简单表达式，创建通用赋值积木（有输入口）
      else {
        return {
          type: `assign_${varName}`,
          name: `${varName} = 表达式`,
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
            tooltip: `给变量${varName}赋值`,
            helpUrl: ''
          }, null, 2),
          pythonGenerator: `const value = generator.valueToCode(block, 'VALUE', Order.NONE) || 'None';
const code = \`${varName} = \${value}\\n\`;
return code;`,
          description: `给变量${varName}赋值（通用）`,
          example: trimmedCode
        };
      }
    }

    // 4. 函数调用模式 func(arg1, arg2) - 注意：这个要放在赋值匹配之后
    const funcCallMatch = trimmedCode.match(/^(\w+)\(([^)]*)\)$/);
    if (funcCallMatch) {
      const funcName = funcCallMatch[1];
      const argsStr = funcCallMatch[2];
      const args = argsStr ? argsStr.split(',').map(a => a.trim()).filter(a => a) : [];

      // print函数特殊处理 - 它是语句块
      if (funcName === 'print') {
        return {
          type: `print_statement`,
          name: `print语句`,
          category: 'python_io',
          color: '#1890ff',
          definition: JSON.stringify({
            type: `print_statement`,
            message0: args.length > 0 ? `print %1` : 'print',
            args0: args.length > 0 ? [
              {
                type: 'input_value',
                name: 'VALUE'
              }
            ] : [],
            previousStatement: null,
            nextStatement: null,
            colour: '#1890ff',
            tooltip: '打印输出',
            helpUrl: ''
          }, null, 2),
          pythonGenerator: args.length > 0
            ? `const value = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
const code = \`print(\${value})\\n\`;
return code;`
            : `return 'print()\\n';`,
          description: `打印输出到控制台`,
          example: trimmedCode
        };
      }

      // 普通函数调用 - 返回值表达式
      const argsDefinition = args.map((arg, index) => ({
        type: 'input_value',
        name: `ARG${index}`,
        check: arg.startsWith('"') || arg.startsWith("'") ? 'String' : null
      }));

      const messageParts = args.map((_, i) => `%${i + 1}`).join(', ');
      const message = args.length > 0 ? `${funcName}(${messageParts})` : `${funcName}()`;

      return {
        type: `func_${funcName}`,
        name: `${funcName}函数`,
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
        pythonGenerator: args.length > 0
          ? args.map((_, i) =>
              `const arg${i} = generator.valueToCode(block, 'ARG${i}', Order.NONE) || 'None';`
            ).join('\n') + `\nconst code = \`${funcName}(\${${args.map((_, i) => `arg${i}`).join(', \${')}})\`;
return [code, Order.FUNCTION_CALL];`
          : `const code = '${funcName}()';
return [code, Order.FUNCTION_CALL];`,
        description: `调用${funcName}函数`,
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

    message.success('已生成积木块定义，请检查并测试');

    // 如果是变量赋值，给出额外提示
    if (blockData.type.startsWith('assign_')) {
      message.info('提示：创建的赋值积木需要配合其他表达式积木使用。要引用这个变量，请使用Blockly内置的"变量"分类中的"获取变量"积木。', 5);
    }

    setShowDefinitionForm(true);
    setTestPassed(false); // 重置测试状态
    setTestResult(null);
  };

  /**
   * 测试积木块定义
   */
  const handleTestBlock = async () => {
    try {
      // 先获取表单所有字段值（不进行验证）
      const values = form.getFieldsValue();

      // 手动检查必填字段
      if (!values.definition || values.definition.trim() === '') {
        message.error('积木定义不能为空，请先生成定义');
        return;
      }

      if (!values.pythonGenerator || values.pythonGenerator.trim() === '') {
        message.error('Python代码生成器不能为空，请先生成定义');
        return;
      }

      // 验证其他必填字段
      await form.validateFields(['type', 'name', 'category']);

      setTesting(true);
      setTestResult(null);

      // 调用验证API
      const response: any = await validateBlocklyDefinition(
        values.definition,
        values.pythonGenerator
      );

      if (response.code === 200) {
        setTestResult({ success: true, message: '✓ 积木块定义验证通过！' });
        setTestPassed(true);
        message.success('测试通过，可以保存了');
      } else {
        setTestResult({ success: false, message: response.message || '验证失败' });
        setTestPassed(false);
        message.error('测试失败：' + response.message);
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段');
      } else {
        setTestResult({ success: false, message: error.message || '测试失败' });
        setTestPassed(false);
        message.error('测试失败：' + (error.message || '未知错误'));
      }
    } finally {
      setTesting(false);
    }
  };

  const showModal = (record?: any) => {
    if (record) {
      setEditingBlock(record);
      setShowDefinitionForm(true); // 编辑模式直接显示表单
      setTestPassed(true); // 已有的块默认测试通过
      setViewedDefinitionTab(true); // 编辑模式默认已查看
      setViewedGeneratorTab(true); // 编辑模式默认已查看
      form.setFieldsValue({
        ...record,
        definition: typeof record.definition === 'string'
          ? JSON.stringify(JSON.parse(record.definition), null, 2)
          : JSON.stringify(record.definition, null, 2),
      });
    } else {
      setEditingBlock(null);
      setShowDefinitionForm(false); // 新建模式从代码生成开始
      setTestPassed(false);
      setTestResult(null);
      setPythonCode('');
      setViewedDefinitionTab(false); // 重置查看状态
      setViewedGeneratorTab(false); // 重置查看状态
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
      // 新建模式下必须先测试通过
      if (!editingBlock && !testPassed) {
        message.warning('请先点击"测试积木块定义"按钮进行测试，测试通过后才能保存');
        return;
      }

      const values = await form.validateFields();

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
          {/* 步骤1：代码生成（仅新建模式） */}
          {!editingBlock && !showDefinitionForm && (
            <>
              <Alert
                message="从Python代码生成积木块"
                description={
                  <div>
                    支持以下Python代码模式自动生成积木块：
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li><code>import requests</code> - 导入库</li>
                      <li><code>from datetime import datetime</code> - 从模块导入</li>
                      <li><code>print(message)</code> - 函数调用</li>
                      <li><code>result = 100</code> - 变量赋值</li>
                    </ul>
                    <p style={{ marginTop: 8, marginBottom: 0, color: '#fa8c16' }}>
                      <strong>⚠️ 注意：</strong>要引用变量，请使用系统内置的"变量与运算"分类中的"获取 变量名"积木，
                      或者在Blockly工作区创建变量后使用。不要为每个变量创建单独的获取积木。
                    </p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="Python代码">
                <TextArea
                  rows={5}
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  placeholder="例如：import requests"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleCodeGenerate} block size="large">
                  生成积木块定义
                </Button>
              </Form.Item>
            </>
          )}

          {/* 步骤2：手动调整定义（代码生成后或编辑模式） */}
          {(editingBlock || showDefinitionForm) && (
            <>
              <Tabs
                defaultActiveKey="1"
                onChange={(activeKey) => {
                  // 记录用户查看过的标签页
                  if (activeKey === '2') {
                    setViewedDefinitionTab(true);
                  } else if (activeKey === '3') {
                    setViewedGeneratorTab(true);
                  }
                }}
              >
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

                <TabPane
                  tab={
                    <span>
                      积木定义
                      <Tooltip title="定义积木块的外观、字段、连接点等可视化属性，使用JSON格式描述Blockly块的结构">
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                      </Tooltip>
                    </span>
                  }
                  key="2"
                >
                  <Alert
                    message="📋 积木定义说明"
                    description={
                      <div>
                        <p style={{ marginBottom: 8 }}>此JSON定义了积木块的可视化外观和连接方式：</p>
                        <ul style={{ marginBottom: 8, paddingLeft: 20 }}>
                          <li><code>type</code> - 积木块唯一标识符（必填）</li>
                          <li><code>message0</code> - 积木块显示文本（必填）</li>
                          <li><code>args0</code> - 输入字段配置（可选）</li>
                          <li><code>colour</code> - 积木块颜色（必填）</li>
                        </ul>
                        <p style={{ marginBottom: 8, fontWeight: 'bold', color: '#fa8c16' }}>⚠️ 重要：选择积木类型</p>
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                          <li><strong>语句块</strong>（赋值、print等）：添加 <code>"previousStatement": null, "nextStatement": null</code></li>
                          <li><strong>表达式块</strong>（返回值的函数）：添加 <code>"output": "String"</code> 或其他类型</li>
                        </ul>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Form.Item
                    name="definition"
                    label="Blockly定义(JSON)"
                    rules={[{ required: true, message: '请输入定义' }]}
                  >
                    <TextArea
                      rows={15}
                      style={{ fontFamily: 'monospace' }}
                      placeholder={`{\n  "type": "my_block",\n  "message0": "我的积木块 %1",\n  "args0": [{\n    "type": "input_value",\n    "name": "VALUE"\n  }],\n  "previousStatement": null,\n  "nextStatement": null,\n  "colour": "#1890ff",\n  "tooltip": "积木块说明",\n  "helpUrl": ""\n}`}
                    />
                  </Form.Item>
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      Python生成器
                      <Tooltip title="定义如何将积木块转换为Python代码，当用户使用此积木块时会调用此生成器函数生成对应的Python代码">
                        <QuestionCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                      </Tooltip>
                    </span>
                  }
                  key="3"
                >
                  <Alert
                    message="🐍 Python代码生成器说明"
                    description={
                      <div>
                        <p style={{ marginBottom: 8 }}>这是一个JavaScript函数，用于将积木块转换为Python代码。</p>
                        <p style={{ marginBottom: 8, fontWeight: 'bold', color: '#fa8c16' }}>⚠️ 关键：根据积木类型选择返回格式</p>

                        <div style={{ marginBottom: 12, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                          <strong>✅ 语句块</strong>（有 previousStatement/nextStatement）
                          <pre style={{ marginTop: 8, marginBottom: 0, background: '#fff', padding: 8, borderRadius: 4 }}>
{`// 示例：赋值语句
const value = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
const code = \`myvar = \${value}\\n\`;
return code;  // 只返回字符串`}
                          </pre>
                        </div>

                        <div style={{ marginBottom: 12, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                          <strong>✅ 表达式块</strong>（有 output）
                          <pre style={{ marginTop: 8, marginBottom: 0, background: '#fff', padding: 8, borderRadius: 4 }}>
{`// 示例：函数调用（返回值）
const value = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";
const code = \`len(\${value})\`;
return [code, Order.FUNCTION_CALL];  // 返回数组`}
                          </pre>
                        </div>

                        <p style={{ marginBottom: 0 }}><strong>常用方法：</strong></p>
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                          <li><code>generator.valueToCode(block, '字段名', Order.NONE)</code> - 获取输入值</li>
                          <li><code>block.getFieldValue('字段名')</code> - 获取文本字段的值</li>
                          <li>代码末尾加 <code>\n</code> - 语句块需要换行</li>
                        </ul>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Form.Item
                    name="pythonGenerator"
                    label="Python代码生成器"
                    rules={[{ required: true, message: '请输入生成器代码' }]}
                  >
                    <TextArea
                      rows={15}
                      style={{ fontFamily: 'monospace' }}
                      placeholder={`// 语句块示例：\nconst value = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";\nconst code = \`myvar = \${value}\\n\`;\nreturn code;\n\n// 表达式块示例：\n// const value = generator.valueToCode(block, 'VALUE', Order.NONE) || "''";\n// const code = \`len(\${value})\`;\n// return [code, Order.FUNCTION_CALL];`}
                    />
                  </Form.Item>
                </TabPane>
              </Tabs>

              {/* 测试功能 */}
              {!editingBlock && (
                <div style={{ marginTop: 16 }}>
                  {/* 提示用户需要查看标签页 */}
                  {(!viewedDefinitionTab || !viewedGeneratorTab) && (
                    <Alert
                      message="请先查看积木定义和Python生成器"
                      description={
                        <div>
                          请依次点击查看以下标签页后，测试按钮才会显示：
                          <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                            <li style={{ color: viewedDefinitionTab ? '#52c41a' : '#ff4d4f' }}>
                              {viewedDefinitionTab ? '✓' : '○'} 积木定义
                            </li>
                            <li style={{ color: viewedGeneratorTab ? '#52c41a' : '#ff4d4f' }}>
                              {viewedGeneratorTab ? '✓' : '○'} Python生成器
                            </li>
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />
                  )}

                  {/* 只有查看过两个标签页后才显示测试按钮 */}
                  {viewedDefinitionTab && viewedGeneratorTab && (
                    <>
                      <Button
                        type="primary"
                        onClick={handleTestBlock}
                        loading={testing}
                        block
                        size="large"
                        icon={<PlayCircleOutlined />}
                      >
                        {testing ? '测试中...' : '测试积木块定义'}
                      </Button>

                      {testResult && (
                        <Alert
                          message={testResult.success ? '测试成功' : '测试失败'}
                          description={testResult.message}
                          type={testResult.success ? 'success' : 'error'}
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      )}

                      {testPassed && (
                        <Alert
                          message="✓ 测试已通过，可以保存了"
                          type="success"
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
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
