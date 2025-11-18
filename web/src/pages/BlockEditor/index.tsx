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
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
        inputs: {},
        outputs: {},
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
              title="输入/输出参数"
              type="inner"
              style={{ marginBottom: '16px' }}
            >
              <p style={{ fontSize: '12px', color: '#8c8c8c' }}>
                参数配置功能将在后续版本中完善
              </p>
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
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
          size="large"
        >
          保存块
        </Button>
        <Button onClick={() => navigate('/manage/blocks')} size="large">
          取消
        </Button>
      </div>
    </div>
  );
};

export default BlockEditor;
