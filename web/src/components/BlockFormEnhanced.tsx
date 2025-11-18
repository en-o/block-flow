import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Card, Row, Col, Modal, message as antdMessage } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { Block, BlockType, BlockTypeCreateDTO } from '../types/api';
import { blockTypeApi } from '../api/blockType';

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
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const [blockTypeForm] = Form.useForm();

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
              label="Python 环境 ID"
              name="pythonEnvId"
              tooltip="选择执行此块的 Python 环境"
            >
              <InputNumber placeholder="环境 ID (可选)" style={{ width: '100%' }} />
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
    </>
  );
};

export default BlockFormEnhanced;
