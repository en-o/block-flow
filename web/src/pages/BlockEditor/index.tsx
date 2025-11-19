import React, { useState, useEffect, useRef } from 'react';
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
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
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
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

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
  const buildInputsObject = () => {
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
  };

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
  const buildOutputsObject = () => {
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
  };

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
    setTestResult('');
    setTestModalVisible(true);
  };

  // 执行测试
  const handleTest = async () => {
    if (!block) {
      antdMessage.warning('请先保存块后再进行测试');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      const response = await blockApi.test(block.id, { inputs: testInputs });
      if (response.code === 200) {
        setTestResult(response.data || '执行成功，无输出');
      } else {
        setTestResult(`错误: ${response.message || '未知错误'}`);
      }
    } catch (error: any) {
      setTestResult(`执行失败: ${error.message || '未知错误'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
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
          navigate('/manage/blocks');
        }
      } else {
        // 创建块
        const createData: BlockCreateDTO = blockData;
        const response = await blockApi.create(createData);
        if (response.code === 200) {
          antdMessage.success('块创建成功');
          navigate('/manage/blocks');
        }
      }
    } catch (error) {
      console.error('保存块失败', error);
    }
  };

  return (
    <div className="block-editor-container">
      <div className="block-editor-header">
        <h1>{block ? `编辑块: ${block.name}` : '创建新块'}</h1>
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
          <div
            style={{
              background: '#000',
              color: '#0f0',
              padding: 16,
              borderRadius: 4,
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: 13,
              minHeight: 200,
              maxHeight: 400,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {testing ? '正在执行...' : testResult || '点击"运行"按钮执行测试'}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BlockEditor;
