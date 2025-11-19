import React, { useState } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Card, Row, Col, Modal, message as antdMessage } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { Block, BlockType, BlockCreateDTO, BlockUpdateDTO, BlockTypeCreateDTO } from '../../types/api';
import { blockTypeApi } from '../../api/blockType';

interface BlockFormProps {
  form: any;
  editingBlock: Block | null;
  blockTypes: BlockType[];
  onBlockTypesChange: () => void;
}

const BlockForm: React.FC<BlockFormProps> = ({
  form,
  editingBlock,
  blockTypes,
  onBlockTypesChange
}) => {
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const [blockTypeForm] = Form.useForm();
  const [inputs, setInputs] = useState<Array<{key: string; config: any}>>([]);
  const [outputs, setOutputs] = useState<Array<{key: string; config: any}>>([]);

  // 默认脚本模板
  const defaultScript = `# -*- coding: utf-8 -*-
# Block执行脚本模板
#
# 输入参数使用说明:
# - 通过 inputs 字典获取输入参数
# - 示例: name = inputs.get('name', '默认值')
# - 示例: count = safe_int(inputs.get('count'), 0)  # 使用安全转换函数
#
# 上下文变量使用说明:
# - 系统自动注入所有上下文变量，格式: ctx.变量名
# - 示例: db_host = inputs.get('ctx.DB_HOST', 'localhost')
# - 示例: db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
# - 上下文变量在"上下文变量管理"配置，测试和执行时自动注入
#
# 输出结果使用说明:
# - 将结果赋值给 outputs 变量(必须是字典类型)
# - 示例: outputs = {"result": "success", "data": result_data}
# - 系统会自动转换为JSON格式返回
#
# 注意事项:
# - 所有异常会被自动捕获并返回错误信息
# - 可以使用已安装在Python环境中的第三方库
# - 执行超时时间为60秒
# - **重要**: inputs中的所有值都是字符串或对象，数字需要转换
# - **重要**: 空字符串会导致类型转换失败，使用安全转换函数

# ========== 安全类型转换函数（处理空值、None、类型错误） ==========

def safe_int(value, default=0):
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

# ========== 获取输入参数 ==========

# 1. 字符串类型（无需转换）
# param1 = inputs.get('param1', '')

# 2. 数字类型（使用安全转换函数）
# param2 = safe_int(inputs.get('param2'), 0)
# param3 = safe_float(inputs.get('param3'), 0.0)

# 3. 布尔类型（使用安全转换函数）
# param4 = safe_bool(inputs.get('param4'), False)

# 4. 上下文变量（自动注入，使用安全转换）
# user_name = inputs.get('ctx.USER_NAME', '默认用户')
# db_host = inputs.get('ctx.DB_HOST', 'localhost')
# db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)

# ========== 执行业务逻辑 ==========

# 示例:
# result = f"Hello {param1}, count: {param2}"

# ========== 设置输出结果（必需） ==========

outputs = {
    "success": True,
    "message": "执行成功",
    # "data": result  # 添加您的结果数据
}
`;

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

  // 添加输入参数
  const handleAddInput = () => {
    setInputs([...inputs, { key: '', config: { type: 'string', required: false, description: '' } }]);
  };

  // 删除输入参数
  const handleRemoveInput = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  // 添加输出参数
  const handleAddOutput = () => {
    setOutputs([...outputs, { key: '', config: { type: 'string', description: '' } }]);
  };

  // 删除输出参数
  const handleRemoveOutput = (index: number) => {
    const newOutputs = outputs.filter((_, i) => i !== index);
    setOutputs(newOutputs);
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
              label="Python 环境"
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

        {/* 输入参数配置 */}
        <Card title="输入参数" size="small" style={{ marginBottom: 16 }}>
          {inputs.map((input, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={6}>
                  <Input
                    placeholder="参数名"
                    value={input.key}
                    onChange={(e) => {
                      const newInputs = [...inputs];
                      newInputs[index].key = e.target.value;
                      setInputs(newInputs);
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="类型"
                    value={input.config.type}
                    onChange={(value) => {
                      const newInputs = [...inputs];
                      newInputs[index].config.type = value;
                      setInputs(newInputs);
                    }}
                  >
                    <Select.Option value="string">字符串</Select.Option>
                    <Select.Option value="number">数字</Select.Option>
                    <Select.Option value="boolean">布尔</Select.Option>
                    <Select.Option value="file">文件</Select.Option>
                    <Select.Option value="json">JSON</Select.Option>
                  </Select>
                </Col>
                <Col span={3}>
                  <Select
                    placeholder="必填"
                    value={input.config.required}
                    onChange={(value) => {
                      const newInputs = [...inputs];
                      newInputs[index].config.required = value;
                      setInputs(newInputs);
                    }}
                  >
                    <Select.Option value={true}>必填</Select.Option>
                    <Select.Option value={false}>可选</Select.Option>
                  </Select>
                </Col>
                <Col span={9}>
                  <Input
                    placeholder="描述"
                    value={input.config.description}
                    onChange={(e) => {
                      const newInputs = [...inputs];
                      newInputs[index].config.description = e.target.value;
                      setInputs(newInputs);
                    }}
                  />
                </Col>
                <Col span={2}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveInput(index)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddInput} block>
            添加输入参数
          </Button>
        </Card>

        {/* 输出参数配置 */}
        <Card title="输出参数" size="small" style={{ marginBottom: 16 }}>
          {outputs.map((output, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={8}>
                <Col span={8}>
                  <Input
                    placeholder="参数名"
                    value={output.key}
                    onChange={(e) => {
                      const newOutputs = [...outputs];
                      newOutputs[index].key = e.target.value;
                      setOutputs(newOutputs);
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Select
                    placeholder="类型"
                    value={output.config.type}
                    onChange={(value) => {
                      const newOutputs = [...outputs];
                      newOutputs[index].config.type = value;
                      setOutputs(newOutputs);
                    }}
                  >
                    <Select.Option value="string">字符串</Select.Option>
                    <Select.Option value="number">数字</Select.Option>
                    <Select.Option value="boolean">布尔</Select.Option>
                    <Select.Option value="file">文件</Select.Option>
                    <Select.Option value="json">JSON</Select.Option>
                  </Select>
                </Col>
                <Col span={8}>
                  <Input
                    placeholder="描述"
                    value={output.config.description}
                    onChange={(e) => {
                      const newOutputs = [...outputs];
                      newOutputs[index].config.description = e.target.value;
                      setOutputs(newOutputs);
                    }}
                  />
                </Col>
                <Col span={2}>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveOutput(index)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddOutput} block>
            添加输出参数
          </Button>
        </Card>

        <Form.Item
          label="执行脚本"
          name="script"
          rules={[{ required: true, message: '请输入执行脚本' }]}
          initialValue={editingBlock ? undefined : defaultScript}
        >
          <Editor
            height="400px"
            defaultLanguage="python"
            theme="vs-dark"
            defaultValue={editingBlock ? undefined : defaultScript}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </Form.Item>
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

export default BlockForm;
