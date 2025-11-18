import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Card, Row, Col, Modal, message as antdMessage, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { Block, BlockType, BlockTypeCreateDTO, PythonEnvironment, PythonEnvironmentCreateDTO } from '../types/api';
import { blockTypeApi } from '../api/blockType';
import { pythonEnvApi } from '../api/pythonEnv';

interface BlockFormProps {
  form: any;
  editingBlock: Block | null;
  blockTypes: BlockType[];
  onBlockTypesChange: () => void;
}

const BlockFormEnhanced: React.FC<BlockFormProps> = ({
  form,
  editingBlock,
  blockTypes,
  onBlockTypesChange
}) => {
  const { modal } = App.useApp();
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const [showPythonEnvModal, setShowPythonEnvModal] = useState(false);
  const [pythonEnvironments, setPythonEnvironments] = useState<PythonEnvironment[]>([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string | undefined>(
    editingBlock?.typeCode || form.getFieldValue('typeCode')
  );
  const [blockTypeForm] = Form.useForm();
  const [pythonEnvForm] = Form.useForm();

  // 加载Python环境列表
  useEffect(() => {
    loadPythonEnvironments();
  }, []);

  // 当块类型改变时，根据块类型筛选Python环境
  useEffect(() => {
    if (selectedBlockType) {
      // 这里可以根据块类型进行筛选，目前显示所有环境
      // 未来可以在Python环境中添加 supportedBlockTypes 字段进行匹配
    }
  }, [selectedBlockType]);

  const loadPythonEnvironments = async () => {
    try {
      const response = await pythonEnvApi.listAll();
      if (response.code === 200 && response.data) {
        setPythonEnvironments(response.data);
      }
    } catch (error) {
      console.error('加载Python环境失败', error);
    }
  };

  // 添加块类型
  const handleAddBlockType = async () => {
    try {
      const values = await blockTypeForm.validateFields();
      const createData: BlockTypeCreateDTO = values;
      await blockTypeApi.create(createData);
      antdMessage.success('块类型创建成功');
      setShowBlockTypeModal(false);
      blockTypeForm.resetFields();
      onBlockTypesChange(); // 刷新块类型列表
    } catch (error) {
      console.error('创建块类型失败', error);
    }
  };

  // 添加Python环境
  const handleAddPythonEnv = async () => {
    try {
      const values = await pythonEnvForm.validateFields();
      const createData: PythonEnvironmentCreateDTO = {
        ...values,
        isDefault: false,
      };
      const response = await pythonEnvApi.create(createData);
      if (response.code === 200) {
        antdMessage.success('Python环境创建成功');
        setShowPythonEnvModal(false);
        pythonEnvForm.resetFields();
        await loadPythonEnvironments(); // 刷新环境列表

        // 自动选择新创建的环境
        if (response.data?.id) {
          form.setFieldsValue({ pythonEnvId: response.data.id });
        }
      }
    } catch (error) {
      console.error('创建Python环境失败', error);
    }
  };

  // 处理块类型变化
  const handleBlockTypeChange = (value: string) => {
    setSelectedBlockType(value);
  };

  return (
    <>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="块名称"
              name="name"
              rules={[{ required: true, message: '请输入块名称' }]}
            >
              <Input placeholder="例如: Maven 构建" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="块类型"
              name="typeCode"
              rules={[{ required: true, message: '请选择块类型' }]}
              extra={blockTypes.length === 0 && <span style={{ color: '#ff4d4f' }}>暂无块类型，请先创建</span>}
            >
              <Select
                placeholder="请选择块类型"
                onChange={handleBlockTypeChange}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => setShowBlockTypeModal(true)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      新增块类型
                    </Button>
                  </>
                )}
              >
                {blockTypes.map((type) => (
                  <Select.Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="描述"
          name="description"
        >
          <Input.TextArea rows={2} placeholder="块的功能描述" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="颜色"
              name="color"
              initialValue="#5C7CFA"
            >
              <Input type="color" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="版本"
              name="version"
              initialValue="1.0.0"
            >
              <Input placeholder="例如: 1.0.0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="是否公开"
              name="isPublic"
              initialValue={true}
            >
              <Select>
                <Select.Option value={true}>公开</Select.Option>
                <Select.Option value={false}>私有</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="定义模式"
              name="definitionMode"
              initialValue="CODE"
              tooltip="BLOCKLY: 可视化定义 | CODE: 代码定义"
            >
              <Select>
                <Select.Option value="BLOCKLY">可视化定义 (Blockly)</Select.Option>
                <Select.Option value="CODE">代码定义</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Python 环境"
              name="pythonEnvId"
              tooltip="选择执行此块的 Python 环境（根据块类型匹配）"
            >
              <Select
                placeholder="请选择Python环境"
                allowClear
                showSearch
                optionFilterProp="children"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Button
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => setShowPythonEnvModal(true)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      新增Python环境
                    </Button>
                  </>
                )}
              >
                {pythonEnvironments.map((env) => (
                  <Select.Option key={env.id} value={env.id}>
                    {env.name} ({env.pythonVersion})
                    {env.isDefault && <span style={{ color: '#faad14' }}> [默认]</span>}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="标签"
          name="tags"
          help="输入标签后按回车添加，支持多个标签"
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="请输入标签，例如: SSH, 部署, 文件传输"
            tokenSeparators={[',']}
          />
        </Form.Item>

        <Form.Item
          label="执行脚本"
          name="script"
          rules={[{ required: true, message: '请输入执行脚本' }]}
        >
          <Editor
            height="300px"
            defaultLanguage="python"
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </Form.Item>

        {/* 提示：inputs 和 outputs 参数配置可在后续版本中添加 */}
        <Card size="small" type="inner" style={{ backgroundColor: '#f0f0f0' }}>
          <p style={{ margin: 0, color: '#666' }}>
            💡 <strong>提示</strong>: 输入/输出参数配置将在块编辑器中完善。
            当前版本请直接在脚本中定义参数使用。
          </p>
        </Card>
      </Form>

      {/* 新增块类型弹窗 */}
      <Modal
        title="新增块类型"
        open={showBlockTypeModal}
        onOk={handleAddBlockType}
        onCancel={() => {
          setShowBlockTypeModal(false);
          blockTypeForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={blockTypeForm} layout="vertical">
          <Form.Item
            label="类型代码"
            name="code"
            rules={[{ required: true, message: '请输入类型代码' }]}
          >
            <Input placeholder="例如: ssh_upload (小写字母+下划线)" />
          </Form.Item>
          <Form.Item
            label="类型名称"
            name="name"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="例如: SSH上传" />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sortOrder"
            initialValue={0}
          >
            <InputNumber placeholder="数字越小越靠前" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增Python环境弹窗 */}
      <Modal
        title="新增Python环境"
        open={showPythonEnvModal}
        onOk={handleAddPythonEnv}
        onCancel={() => {
          setShowPythonEnvModal(false);
          pythonEnvForm.resetFields();
        }}
        destroyOnClose
        width={600}
      >
        <Form form={pythonEnvForm} layout="vertical">
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
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="环境描述" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default BlockFormEnhanced;
