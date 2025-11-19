import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Radio,
  InputNumber,
  Divider,
  message as antdMessage,
  Card,
  Space,
  Modal,
  Tooltip,
  Tag,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined, ThunderboltOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import * as Blockly from 'blockly';
import Editor from '@monaco-editor/react';
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import type { Block, BlockType, BlockCreateDTO, BlockUpdateDTO } from '../../types/api';
import './index.css';

const BlockEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const [block, setBlock] = useState<Block | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [definitionMode, setDefinitionMode] = useState<'BLOCKLY' | 'CODE'>('CODE');
  const [scriptCode, setScriptCode] = useState<string>('# Python 脚本\nprint("Hello World")');
  const [loading, setLoading] = useState(false);
  const [inputParams, setInputParams] = useState<Array<{ name: string; type: string; defaultValue: string; description: string }>>([]);
  const [outputParams, setOutputParams] = useState<Array<{ name: string; type: string; description: string }>>([]);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // 加载块类型
  useEffect(() => {
    loadBlockTypes();
  }, []);

  // 加载块详情（编辑模式）
  useEffect(() => {
    if (id) {
      loadBlock(Number(id));
    }
  }, [id]);

  // 初始化 Blockly 工作区
  useEffect(() => {
    if (definitionMode === 'BLOCKLY' && blocklyDivRef.current && !workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
        toolbox: getBlocklyToolbox(),
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
        trashcan: true,
      });
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [definitionMode]);

  const loadBlockTypes = async () => {
    try {
      const response = await blockTypeApi.page({
        page: { pageNum: 0, pageSize: 100 },
      });
      if (response.code === 200 && response.data?.rows) {
        setBlockTypes(response.data.rows);
      }
    } catch (error) {
      console.error('加载块类型失败', error);
    }
  };

  const loadBlock = async (blockId: number) => {
    try {
      setLoading(true);
      const response = await blockApi.getById(blockId);
      if (response.code === 200 && response.data) {
        const blockData = response.data;
        setBlock(blockData);
        setDefinitionMode(blockData.definitionMode || 'CODE');
        setScriptCode(blockData.script || '');

        // 填充表单
        form.setFieldsValue({
          name: blockData.name,
          typeCode: blockData.typeCode,
          description: blockData.description,
          color: blockData.color,
          icon: blockData.icon,
          version: blockData.version,
          pythonEnvId: blockData.pythonEnvId,
          tags: blockData.tags || [],
          isPublic: blockData.isPublic,
        });

        // 加载输入参数配置
        if (blockData.inputs && typeof blockData.inputs === 'object') {
          const params = Object.entries(blockData.inputs).map(([name, config]: [string, any]) => ({
            name,
            type: config.type || 'string',
            defaultValue: config.defaultValue || '',
            description: config.description || '',
          }));
          setInputParams(params);
        }

        // 加载输出参数配置
        if (blockData.outputs && typeof blockData.outputs === 'object') {
          const params = Object.entries(blockData.outputs).map(([name, config]: [string, any]) => ({
            name,
            type: config.type || 'string',
            description: config.description || '',
          }));
          setOutputParams(params);
        }

        // 如果有 Blockly 定义，加载到工作区
        if (blockData.blocklyDefinition && workspaceRef.current) {
          const xml = Blockly.utils.xml.textToDom(blockData.blocklyDefinition);
          Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
        }
      }
    } catch (error) {
      console.error('加载块详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getBlocklyToolbox = () => {
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '逻辑',
          colour: '#5C7CFA',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_boolean' },
          ],
        },
        {
          kind: 'category',
          name: '循环',
          colour: '#52C41A',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
          ],
        },
        {
          kind: 'category',
          name: '数学',
          colour: '#FA8C16',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
          ],
        },
        {
          kind: 'category',
          name: '文本',
          colour: '#722ED1',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_print' },
          ],
        },
        {
          kind: 'category',
          name: '变量',
          colour: '#13C2C2',
          custom: 'VARIABLE',
        },
      ],
    };
  };

  const handleModeChange = (mode: 'BLOCKLY' | 'CODE') => {
    setDefinitionMode(mode);
  };

  // 添加输入参数
  const handleAddInputParam = () => {
    setInputParams([...inputParams, { name: '', type: 'string', defaultValue: '', description: '' }]);
  };

  // 删除输入参数
  const handleRemoveInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  // 更新输入参数
  const handleUpdateInputParam = (index: number, field: string, value: string) => {
    const newParams = [...inputParams];
    (newParams[index] as any)[field] = value;
    setInputParams(newParams);
  };

  // 将输入参数数组转换为对象格式
  const buildInputsObject = useCallback(() => {
    const inputs: Record<string, any> = {};
    inputParams.forEach(param => {
      if (param.name) {
        inputs[param.name] = {
          type: param.type,
          defaultValue: param.defaultValue,
          description: param.description,
        };
      }
    });
    return inputs;
  }, [inputParams]);

  // 添加输出参数
  const handleAddOutputParam = () => {
    setOutputParams([...outputParams, { name: '', type: 'string', description: '' }]);
  };

  // 删除输出参数
  const handleRemoveOutputParam = (index: number) => {
    setOutputParams(outputParams.filter((_, i) => i !== index));
  };

  // 更新输出参数
  const handleUpdateOutputParam = (index: number, field: string, value: string) => {
    const newParams = [...outputParams];
    (newParams[index] as any)[field] = value;
    setOutputParams(newParams);
  };

  // 将输出参数数组转换为对象格式
  const buildOutputsObject = useCallback(() => {
    const outputs: Record<string, any> = {};
    outputParams.forEach(param => {
      if (param.name) {
        outputs[param.name] = {
          type: param.type,
          description: param.description,
        };
      }
    });
    return outputs;
  }, [outputParams]);

  // 打开测试弹窗
  const handleOpenTest = () => {
    // 初始化测试输入值
    const initialInputs: Record<string, any> = {};
    inputParams.forEach(param => {
      if (param.name) {
        initialInputs[param.name] = param.defaultValue || '';
      }
    });
    setTestInputs(initialInputs);
    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行测试
  const handleTest = async () => {
    if (!block) {
      antdMessage.warning('请先保存块后再进行测试');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await blockApi.test(block.id, { inputs: testInputs });
      if (response.code === 200) {
        // 尝试解析 JSON
        try {
          const resultData = typeof response.data === 'string'
            ? JSON.parse(response.data)
            : response.data;
          setTestResult(resultData);
        } catch (e) {
          // 如果不是 JSON，直接显示
          setTestResult({
            success: true,
            output: response.data || '执行成功，无输出'
          });
        }
      } else {
        setTestResult({
          success: false,
          error: `错误: ${response.message || '未知错误'}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: `执行失败: ${error.message || '未知错误'}`
      });
    } finally {
      setTesting(false);
    }
  };

  // 从脚本解析输入输出参数
  const handleParseScriptParameters = () => {
    if (!scriptCode) {
      antdMessage.warning('请先输入脚本代码');
      return;
    }

    // 移除注释：单行注释 (#) 和多行注释 (''' 或 """)
    let cleanScript = scriptCode
      // 移除多行字符串/注释（三引号）
      .replace(/'''[\s\S]*?'''/g, '')
      .replace(/"""[\s\S]*?"""/g, '')
      // 移除单行注释
      .split('\n')
      .map((line: string) => {
        const commentIndex = line.indexOf('#');
        return commentIndex !== -1 ? line.substring(0, commentIndex) : line;
      })
      .join('\n');

    // 解析输入参数
    const inputMatches = new Set<string>();
    const inputTypes: Record<string, string> = {};

    // 匹配 inputs.get('xxx') 或 inputs.get("xxx")
    const inputRegex = /inputs\.get\(['"]((?!ctx\.)[^'"]+)['"]/g;
    let match;
    while ((match = inputRegex.exec(cleanScript)) !== null) {
      const paramName = match[1];
      if (!paramName.startsWith('ctx.')) {
        inputMatches.add(paramName);
      }
    }

    // 推断类型
    inputMatches.forEach(paramName => {
      // 检查是否有类型转换函数
      const safeIntPattern = new RegExp(`safe_int\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const intPattern = new RegExp(`int\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const safeFloatPattern = new RegExp(`safe_float\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const floatPattern = new RegExp(`float\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const safeBoolPattern = new RegExp(`safe_bool\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);

      if (safeIntPattern.test(cleanScript) || intPattern.test(cleanScript)) {
        inputTypes[paramName] = 'number';
      } else if (safeFloatPattern.test(cleanScript) || floatPattern.test(cleanScript)) {
        inputTypes[paramName] = 'number';
      } else if (safeBoolPattern.test(cleanScript)) {
        inputTypes[paramName] = 'boolean';
      } else {
        inputTypes[paramName] = 'string';
      }
    });

    // 解析输出参数
    const outputMatches = new Set<string>();

    // 匹配 outputs = { "key": value, 'key': value }
    const outputsBlockRegex = /outputs\s*=\s*\{([^}]+)\}/s;
    const outputsBlock = outputsBlockRegex.exec(cleanScript);

    if (outputsBlock) {
      const outputContent = outputsBlock[1];
      // 匹配键名: "xxx" 或 'xxx'
      const keyRegex = /['"]([^'"]+)['"]\s*:/g;
      let keyMatch;
      while ((keyMatch = keyRegex.exec(outputContent)) !== null) {
        const keyName = keyMatch[1];
        if (keyName !== '_console_output') { // 排除内部使用的字段
          outputMatches.add(keyName);
        }
      }
    }

    // 转换为参数数组
    const newInputParams = Array.from(inputMatches).map(name => ({
      name,
      type: inputTypes[name] || 'string',
      defaultValue: '',
      description: ''
    }));

    const newOutputParams = Array.from(outputMatches).map(name => ({
      name,
      type: 'string',
      description: ''
    }));

    // 更新参数列表
    if (newInputParams.length > 0 || newOutputParams.length > 0) {
      setInputParams(newInputParams);
      setOutputParams(newOutputParams);
      antdMessage.success(`已解析 ${newInputParams.length} 个输入参数和 ${newOutputParams.length} 个输出参数`);
    } else {
      antdMessage.info('未从脚本中解析到输入输出参数');
    }
  };

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();

      let blocklyDefinition = '';
      if (definitionMode === 'BLOCKLY' && workspaceRef.current) {
        const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
        blocklyDefinition = Blockly.Xml.domToText(xml);
      }

      const blockData = {
        ...values,
        definitionMode,
        blocklyDefinition: blocklyDefinition || undefined,
        script: scriptCode,
        inputs: buildInputsObject(),
        outputs: buildOutputsObject(),
      };

      if (block) {
        // 更新块
        const updateData: BlockUpdateDTO = {
          id: block.id,
          ...blockData,
        };
        const response = await blockApi.update(updateData);
        if (response.code === 200) {
          antdMessage.success('块更新成功');
          // 重新加载当前块数据，而不是跳转
          await loadBlock(block.id);
        }
      } else {
        // 创建块
        const createData: BlockCreateDTO = blockData;
        const response = await blockApi.create(createData);
        if (response.code === 200) {
          antdMessage.success('块创建成功');
          // 创建后跳转到列表
          navigate('/manage/blocks');
        }
      }
    } catch (error) {
      console.error('保存块失败', error);
    }
  }, [form, definitionMode, scriptCode, block, buildInputsObject, buildOutputsObject, loadBlock, navigate]);

  // 监听Ctrl+S快捷键保存
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否是Ctrl+S或Cmd+S（Mac）
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认保存行为
        handleSave();
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  return (
    <div className="block-editor-container">
      <div className="block-editor-header">
        <h1>
          {block ? `编辑块: ${block.name}` : '创建新块'}
          <Button
            type="text"
            size="small"
            icon={<QuestionCircleOutlined />}
            onClick={() => setHelpModalVisible(true)}
            style={{ marginLeft: 16, color: '#1890ff' }}
          >
            类型转换规则
          </Button>
        </h1>
        <div className="header-actions">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/manage/blocks')}
            style={{ color: '#1890ff' }}
          >
            返回
          </Button>
        </div>
      </div>

      <div className="block-editor-content">
        {/* 左侧配置面板 */}
        <div className="editor-left-panel">
          <Form form={form} layout="vertical">
            <Form.Item
              label="块名称"
              name="name"
              rules={[{ required: true, message: '请输入块名称' }]}
            >
              <Input placeholder="例如: SSH文件上传" />
            </Form.Item>

            <Form.Item
              label="块类型"
              name="typeCode"
              rules={[{ required: true, message: '请选择块类型' }]}
            >
              <Select placeholder="选择块类型">
                {blockTypes.map((type) => (
                  <Select.Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input.TextArea rows={2} placeholder="块功能描述" />
            </Form.Item>

            <Form.Item label="颜色" name="color" initialValue="#5C7CFA">
              <Input type="color" />
            </Form.Item>

            <Form.Item label="图标" name="icon">
              <Input placeholder="例如: 📁 (emoji)" />
            </Form.Item>

            <Form.Item label="版本" name="version" initialValue="1.0.0">
              <Input placeholder="例如: 1.0.0" />
            </Form.Item>

            <Form.Item label="Python 环境 ID" name="pythonEnvId">
              <InputNumber placeholder="环境 ID (可选)" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="标签" name="tags">
              <Select mode="tags" placeholder="添加标签" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="是否公开" name="isPublic" initialValue={true}>
              <Radio.Group>
                <Radio value={true}>公开</Radio>
                <Radio value={false}>私有</Radio>
              </Radio.Group>
            </Form.Item>

            <Divider />

            {/* 参数解析按钮 */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Tooltip title="自动从脚本中提取输入输出参数（不包括描述）">
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={handleParseScriptParameters}
                  type="dashed"
                  block
                >
                  从脚本自动解析参数
                </Button>
              </Tooltip>
            </div>

            <Card
              size="small"
              title="输入参数配置"
              type="inner"
              style={{ marginBottom: '16px' }}
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={handleAddInputParam}
                  size="small"
                >
                  添加参数
                </Button>
              }
            >
              {inputParams.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center', margin: '8px 0' }}>
                  暂无输入参数，点击"添加参数"创建
                </p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {inputParams.map((param, index) => (
                    <div key={index} style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%' }}>
                          <Input
                            placeholder="参数名"
                            value={param.name}
                            onChange={(e) => handleUpdateInputParam(index, 'name', e.target.value)}
                            style={{ width: '120px' }}
                            size="small"
                          />
                          <Select
                            value={param.type}
                            onChange={(value) => handleUpdateInputParam(index, 'type', value)}
                            style={{ width: '80px' }}
                            size="small"
                          >
                            <Select.Option value="string">字符串</Select.Option>
                            <Select.Option value="number">数字</Select.Option>
                            <Select.Option value="boolean">布尔</Select.Option>
                            <Select.Option value="object">对象</Select.Option>
                          </Select>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveInputParam(index)}
                            size="small"
                          />
                        </Space>
                        <Input
                          placeholder="默认值"
                          value={param.defaultValue}
                          onChange={(e) => handleUpdateInputParam(index, 'defaultValue', e.target.value)}
                          size="small"
                        />
                        <Input
                          placeholder="描述"
                          value={param.description}
                          onChange={(e) => handleUpdateInputParam(index, 'description', e.target.value)}
                          size="small"
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              size="small"
              title="输出参数配置"
              type="inner"
              style={{ marginBottom: '16px' }}
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={handleAddOutputParam}
                  size="small"
                >
                  添加参数
                </Button>
              }
            >
              {outputParams.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center', margin: '8px 0' }}>
                  暂无输出参数，点击"添加参数"创建
                </p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {outputParams.map((param, index) => (
                    <div key={index} style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%' }}>
                          <Input
                            placeholder="参数名"
                            value={param.name}
                            onChange={(e) => handleUpdateOutputParam(index, 'name', e.target.value)}
                            style={{ width: '120px' }}
                            size="small"
                          />
                          <Select
                            value={param.type}
                            onChange={(value) => handleUpdateOutputParam(index, 'type', value)}
                            style={{ width: '80px' }}
                            size="small"
                          >
                            <Select.Option value="string">字符串</Select.Option>
                            <Select.Option value="number">数字</Select.Option>
                            <Select.Option value="boolean">布尔</Select.Option>
                            <Select.Option value="object">对象</Select.Option>
                          </Select>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveOutputParam(index)}
                            size="small"
                          />
                        </Space>
                        <Input
                          placeholder="描述"
                          value={param.description}
                          onChange={(e) => handleUpdateOutputParam(index, 'description', e.target.value)}
                          size="small"
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Form>
        </div>

        {/* 右侧编辑器工作区 */}
        <div className="editor-workspace">
          <div className="mode-toggle">
            <span>定义模式:</span>
            <Radio.Group value={definitionMode} onChange={(e) => handleModeChange(e.target.value)}>
              <Radio.Button value="CODE">代码模式</Radio.Button>
              <Radio.Button value="BLOCKLY">可视化模式</Radio.Button>
            </Radio.Group>
          </div>

          <div className="workspace-content">
            {definitionMode === 'BLOCKLY' ? (
              <div ref={blocklyDivRef} className="blockly-editor" />
            ) : (
              <div className="code-editor">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={scriptCode}
                  onChange={(value) => setScriptCode(value || '')}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="block-editor-footer">
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
          >
            保存块
          </Button>
          <Tag color="blue" style={{ fontSize: 12 }}>Ctrl+S 快捷保存</Tag>
          {block && (
            <Tooltip title="测试运行当前块">
              <Button
                icon={<PlayCircleOutlined />}
                onClick={handleOpenTest}
                size="large"
              >
                测试运行
              </Button>
            </Tooltip>
          )}
          <Button onClick={() => navigate('/manage/blocks')} size="large">
            取消
          </Button>
        </Space>
      </div>

      {/* 测试运行弹窗 */}
      <Modal
        title="测试运行"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setTestModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="run"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleTest}
            loading={testing}
          >
            运行
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>输入参数</h4>
          {inputParams.length === 0 ? (
            <p style={{ color: '#999' }}>该块没有配置输入参数</p>
          ) : (
            <div>
              {inputParams.map((param) => (
                <div key={param.name} style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{param.name}</strong>
                    <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                      ({param.type})
                    </span>
                    {param.description && (
                      <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                        - {param.description}
                      </span>
                    )}
                  </div>
                  <Input
                    value={testInputs[param.name] || ''}
                    onChange={(e) => setTestInputs({ ...testInputs, [param.name]: e.target.value })}
                    placeholder={`请输入 ${param.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <div>
          <h4>执行结果</h4>
          {testing ? (
            <div
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                textAlign: 'center',
                color: '#666',
                minHeight: 200,
              }}
            >
              正在执行...
            </div>
          ) : !testResult ? (
            <div
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                textAlign: 'center',
                color: '#999',
                minHeight: 200,
              }}
            >
              点击"运行"按钮执行测试
            </div>
          ) : (
            <Card
              size="small"
              style={{
                background: testResult.success ? '#f6ffed' : '#fff2e8',
                borderColor: testResult.success ? '#b7eb8f' : '#ffbb96',
              }}
            >
              {/* 状态和执行时间 */}
              <Space style={{ marginBottom: 12 }}>
                <Tag color={testResult.success ? 'success' : 'error'}>
                  {testResult.success ? '✓ 执行成功' : '✗ 执行失败'}
                </Tag>
                {testResult.executionTime !== undefined && (
                  <Tag color="blue">耗时: {testResult.executionTime}ms</Tag>
                )}
              </Space>

              {/* 成功输出 */}
              {testResult.success && testResult.output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#52c41a' }}>
                    📤 输出结果：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 300,
                      overflowY: 'auto',
                      fontSize: 13,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {(() => {
                      // 提取 _console_output 并显示剩余内容
                      if (typeof testResult.output === 'object') {
                        const { _console_output, ...restOutput } = testResult.output;
                        return JSON.stringify(restOutput, null, 2);
                      }
                      return testResult.output;
                    })()}
                  </pre>
                </div>
              )}

              {/* 控制台输出 (print) */}
              {testResult.success && testResult.output && typeof testResult.output === 'object' && testResult.output._console_output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                    🖥️ 控制台输出 (print)：
                  </div>
                  <pre
                    style={{
                      background: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#1890ff',
                    }}
                  >
                    {testResult.output._console_output}
                  </pre>
                </div>
              )}

              {/* 错误信息 */}
              {!testResult.success && (testResult.error || testResult.errorMessage) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
                    ❌ 错误信息：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #ffccc7',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 13,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#ff4d4f',
                    }}
                  >
                    {testResult.errorMessage || testResult.error}
                  </pre>
                </div>
              )}

              {/* 错误时的控制台输出 */}
              {!testResult.success && testResult.output && typeof testResult.output === 'object' && testResult.output._console_output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                    🖥️ 控制台输出 (print)：
                  </div>
                  <pre
                    style={{
                      background: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#1890ff',
                    }}
                  >
                    {testResult.output._console_output}
                  </pre>
                </div>
              )}

              {/* 标准错误输出 */}
              {testResult.stderr && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#fa8c16' }}>
                    ⚠️ 错误输出 (stderr)：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #ffd591',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#fa8c16',
                    }}
                  >
                    {testResult.stderr}
                  </pre>
                </div>
              )}

              {/* 退出代码 */}
              {testResult.exitCode !== undefined && testResult.exitCode !== 0 && (
                <div style={{ marginTop: 12 }}>
                  <Tag color="warning">退出代码: {testResult.exitCode}</Tag>
                </div>
              )}
            </Card>
          )}
        </div>
      </Modal>

      {/* 类型转换规则帮助 Modal */}
      <Modal
        title="Python 参数类型转换规则"
        open={helpModalVisible}
        onCancel={() => setHelpModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" type="primary" onClick={() => setHelpModalVisible(false)}>
            知道了
          </Button>,
        ]}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h3>⚠️ 重要提示</h3>
          <p>JSON传输时，所有参数都可能是字符串类型。即使前端传入数字，后端序列化后Python读取时也可能是字符串。</p>

          <Divider />

          <h3>❌ 错误的写法</h3>
          <pre style={{ background: '#fff2e8', padding: 12, borderRadius: 4, border: '1px solid #ffbb96' }}>
{`a = inputs.get('a', 0)  # ❌ 如果inputs['a']存在且是字符串，a就是字符串
b = inputs.get('b', 0)  # ❌ 默认值0不会被使用
product = a * b         # ❌ 错误：can't multiply sequence by non-int

# 空字符串问题：
a = int(inputs.get('a', 2))  # ❌ 如果a=""，会报错
# 原因：inputs.get('a', 2) 当 a 存在时返回 ""，不会使用默认值 2
# int("") 会抛出 ValueError`}
          </pre>

          <Divider />

          <h3>✅ 正确的写法（推荐使用安全转换函数）</h3>
          <pre style={{ background: '#f6ffed', padding: 12, borderRadius: 4, border: '1px solid #b7eb8f' }}>
{`def safe_int(value, default=0):
    """安全地转换为整数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """安全地转换为浮点数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# 使用示例：
a = safe_int(inputs.get('a'), 2)      # ✅ 空字符串返回默认值
b = safe_int(inputs.get('b'), 0)      # ✅ 无论输入是什么，都能正确处理
product = a * b                        # ✅ 正确：两个整数相乘`}
          </pre>

          <Divider />

          <h3>📖 类型转换快速参考</h3>

          <h4>1. 字符串类型（无需转换）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`name = inputs.get('name', '')`}
          </pre>

          <h4>2. 数字类型（使用安全转换函数）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`count = safe_int(inputs.get('count'), 0)
price = safe_float(inputs.get('price'), 0.0)`}
          </pre>

          <h4>3. 布尔类型（使用安全转换函数）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`enabled = safe_bool(inputs.get('enabled'), False)`}
          </pre>

          <h4>4. 上下文变量（自动注入，使用安全转换）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`user_name = inputs.get('ctx.USER_NAME', '默认用户')
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)`}
          </pre>

          <Divider />

          <h3>🐛 常见错误和解决方案</h3>

          <Card size="small" style={{ marginBottom: 8 }}>
            <strong>TypeError: can't multiply sequence by non-int</strong>
            <br />
            <span style={{ color: '#ff4d4f' }}>原因：</span> 参数是字符串，未转换
            <br />
            <span style={{ color: '#52c41a' }}>解决：</span> 使用 <code>safe_int(inputs.get('num'), 0)</code>
          </Card>

          <Card size="small" style={{ marginBottom: 8 }}>
            <strong>ValueError: invalid literal for int() with base 10</strong>
            <br />
            <span style={{ color: '#ff4d4f' }}>原因：</span> 字符串无法转换为整数或为空字符串
            <br />
            <span style={{ color: '#52c41a' }}>解决：</span> 使用 safe_int/safe_float 函数处理
          </Card>

          <Divider />

          <h3>📝 Python 代码编辑注意事项</h3>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>1. 缩进规范</strong>
            <br />
            • Python 使用缩进表示代码块，必须保持一致（推荐 4 个空格）
            <br />
            • 不要混用 Tab 和空格，会导致 IndentationError
            <br />
            • 函数、类、循环、条件语句内部都需要缩进
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>2. 编码声明</strong>
            <br />
            • 文件首行建议添加：<code># -*- coding: utf-8 -*-</code>
            <br />
            • 确保中文和特殊字符正确显示（系统已自动处理 UTF-8 编码）
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>3. 必须定义 outputs</strong>
            <br />
            • 脚本最后必须赋值 <code>outputs</code> 变量（字典类型）
            <br />
            • 示例：<code>outputs = {`{"result": "success", "data": 123}`}</code>
            <br />
            • 如果没有输出，至少返回：<code>outputs = {`{"success": True}`}</code>
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>4. 使用 print() 调试</strong>
            <br />
            • print() 输出会单独显示在"控制台输出"区域
            <br />
            • 不会影响 outputs 的 JSON 格式化
            <br />
            • 适合输出调试信息和中间结果
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>5. 导入第三方库</strong>
            <br />
            • 只能使用已安装在 Python 环境中的库
            <br />
            • 需要先在"Python 环境管理"中安装离线包
            <br />
            • 内置库（如 os、sys、json）可直接使用
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>6. 异常处理</strong>
            <br />
            • 系统会自动捕获未处理的异常
            <br />
            • 建议对关键操作使用 try-except 进行错误处理
            <br />
            • 异常信息会在测试结果中显示
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>7. 执行时间限制</strong>
            <br />
            • 默认超时时间为 60 秒
            <br />
            • 避免死循环和耗时过长的操作
            <br />
            • 超时会自动终止并返回错误
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>8. 输出数据类型</strong>
            <br />
            • outputs 必须是可 JSON 序列化的类型
            <br />
            • 支持：字符串、数字、布尔、列表、字典、None
            <br />
            • 不支持：函数、类实例、文件对象等复杂类型
          </Card>

          <Divider />

          <h3>💡 最佳实践示例</h3>
          <pre style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, border: '1px solid #91d5ff' }}>
{`# -*- coding: utf-8 -*-
import json

# 1. 使用安全转换函数获取输入
count = safe_int(inputs.get('count'), 0)
name = inputs.get('name', 'Unknown')

# 2. 添加输入验证
if count <= 0:
    outputs = {
        "success": False,
        "error": "count 必须大于 0"
    }
else:
    # 3. 执行业务逻辑
    try:
        result = process_data(count, name)

        # 4. 使用 print 输出调试信息
        print(f"处理完成：count={count}, name={name}")

        # 5. 设置成功的输出
        outputs = {
            "success": True,
            "result": result,
            "message": f"成功处理 {count} 条数据"
        }
    except Exception as e:
        # 6. 错误处理
        print(f"错误：{str(e)}")
        outputs = {
            "success": False,
            "error": str(e)
        }
`}
          </pre>
        </div>
      </Modal>
    </div>
  );
};

export default BlockEditor;
