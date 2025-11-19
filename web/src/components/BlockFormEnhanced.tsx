import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Card, Row, Col, Modal, message as antdMessage, App, Table, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { Block, BlockType, BlockTypeCreateDTO, PythonEnvironment, PythonEnvironmentCreateDTO, BlockParameter } from '../types/api';
import { blockTypeApi } from '../api/blockType';
import { pythonEnvApi } from '../api/pythonEnv';

interface BlockFormProps {
  form: any;
  editingBlock: Block | null;
  blockTypes: BlockType[];
  onBlockTypesChange: () => void;
}

export interface BlockFormEnhancedRef {
  getFormValues: () => any;
}

const BlockFormEnhanced = forwardRef<BlockFormEnhancedRef, BlockFormProps>(({
  form,
  editingBlock,
  blockTypes,
  onBlockTypesChange
}, ref) => {
  const { modal } = App.useApp();
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const [showPythonEnvModal, setShowPythonEnvModal] = useState(false);
  const [pythonEnvironments, setPythonEnvironments] = useState<PythonEnvironment[]>([]);
  const [selectedBlockType, setSelectedBlockType] = useState<string | undefined>(undefined);
  const [inputParams, setInputParams] = useState<BlockParameter[]>([]);
  const [outputParams, setOutputParams] = useState<BlockParameter[]>([]);
  const [blockTypeForm] = Form.useForm();
  const [pythonEnvForm] = Form.useForm();

  // 默认脚本模板
  const defaultScript = `# -*- coding: utf-8 -*-
# Block执行脚本模板
#
# 输入参数使用说明:
# - 通过 inputs 字典获取输入参数
# - 示例: name = inputs.get('name', '默认值')
# - 示例: count = inputs.get('count', 0)
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

# 1. 获取输入参数
# 示例:
# param1 = inputs.get('param1', '')
# param2 = inputs.get('param2', 0)

# 2. 执行业务逻辑
# 示例:
# result = f"Hello {param1}, count: {param2}"

# 3. 设置输出结果（必需）
outputs = {
    "success": True,
    "message": "执行成功",
    # "data": result  # 添加您的结果数据
}
`;

  // 加载Python环境列表
  useEffect(() => {
    loadPythonEnvironments();
  }, []);

  // 当editingBlock改变时，重新初始化参数
  useEffect(() => {
    if (editingBlock?.inputs) {
      const params = Object.entries(editingBlock.inputs).map(([name, param]: [string, any]) => ({
        id: `input-${Date.now()}-${Math.random()}`, // 添加唯一ID
        name,
        ...param
      }));
      setInputParams(params);
    } else {
      setInputParams([]);
    }

    if (editingBlock?.outputs) {
      const params = Object.entries(editingBlock.outputs).map(([name, param]: [string, any]) => ({
        id: `output-${Date.now()}-${Math.random()}`, // 添加唯一ID
        name,
        ...param
      }));
      setOutputParams(params);
    } else {
      setOutputParams([]);
    }

    setSelectedBlockType(editingBlock?.typeCode);
  }, [editingBlock]);

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

  //处理块类型变化
  const handleBlockTypeChange = (value: string) => {
    setSelectedBlockType(value);
  };

  // 添加输入参数
  const handleAddInputParam = () => {
    setInputParams([...inputParams, {
      id: `input-${Date.now()}-${Math.random()}`, // 添加唯一ID
      name: '',
      type: 'string',
      description: '',
      required: false,
      defaultValue: undefined
    }]);
  };

  // 添加输出参数
  const handleAddOutputParam = () => {
    setOutputParams([...outputParams, {
      id: `output-${Date.now()}-${Math.random()}`, // 添加唯一ID
      name: '',
      type: 'string',
      description: '',
      required: false,
      defaultValue: undefined
    }]);
  };

  // 更新输入参数
  const handleUpdateInputParam = (index: number, field: keyof BlockParameter, value: any) => {
    const newParams = [...inputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setInputParams(newParams);
  };

  // 更新输出参数
  const handleUpdateOutputParam = (index: number, field: keyof BlockParameter, value: any) => {
    const newParams = [...outputParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setOutputParams(newParams);
  };

  // 删除输入参数
  const handleDeleteInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  // 删除输出参数
  const handleDeleteOutputParam = (index: number) => {
    setOutputParams(outputParams.filter((_, i) => i !== index));
  };

  // 将参数数组转换为对象（供表单使用）
  const convertParamsToObject = (params: BlockParameter[]): Record<string, any> => {
    const obj: Record<string, any> = {};
    params.forEach(param => {
      if (param.name) {
        // 排除 id 字段，只保存实际的参数数据
        const { id, name, ...paramData } = param as any;
        obj[name] = paramData;
      }
    });
    return obj;
  };

  // 获取表单值时,动态添加 inputs 和 outputs
  const getFormValues = () => {
    const values = form.getFieldsValue();
    return {
      ...values,
      inputs: convertParamsToObject(inputParams),
      outputs: convertParamsToObject(outputParams)
    };
  };

  // 暴露 getFormValues 方法给父组件
  useImperativeHandle(ref, () => ({
    getFormValues
  }));

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

        {/* 隐藏字段用于存储inputs和outputs */}
        <Form.Item name="inputs" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="outputs" hidden>
          <Input />
        </Form.Item>

        {/* 输入参数配置 */}
        <Divider>输入参数配置</Divider>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddInputParam}
              style={{ width: '100%' }}
            >
              添加输入参数
            </Button>
            {inputParams.map((param, index) => (
              <Card key={param.id || index} size="small" type="inner">
                <Row gutter={8}>
                  <Col span={6}>
                    <Input
                      placeholder="参数名称"
                      value={param.name}
                      onChange={(e) => handleUpdateInputParam(index, 'name', e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Select
                      value={param.type}
                      onChange={(value) => handleUpdateInputParam(index, 'type', value)}
                      style={{ width: '100%' }}
                    >
                      <Select.Option value="string">字符串</Select.Option>
                      <Select.Option value="number">数字</Select.Option>
                      <Select.Option value="boolean">布尔</Select.Option>
                      <Select.Option value="object">对象</Select.Option>
                      <Select.Option value="array">数组</Select.Option>
                      <Select.Option value="any">任意</Select.Option>
                    </Select>
                  </Col>
                  <Col span={8}>
                    <Input
                      placeholder="描述"
                      value={param.description}
                      onChange={(e) => handleUpdateInputParam(index, 'description', e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Input
                      placeholder="默认值"
                      value={param.defaultValue}
                      onChange={(e) => handleUpdateInputParam(index, 'defaultValue', e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteInputParam(index)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>

        {/* 输出参数配置 */}
        <Divider>输出参数配置</Divider>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddOutputParam}
              style={{ width: '100%' }}
            >
              添加输出参数
            </Button>
            {outputParams.map((param, index) => (
              <Card key={param.id || index} size="small" type="inner">
                <Row gutter={8}>
                  <Col span={6}>
                    <Input
                      placeholder="参数名称"
                      value={param.name}
                      onChange={(e) => handleUpdateOutputParam(index, 'name', e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Select
                      value={param.type}
                      onChange={(value) => handleUpdateOutputParam(index, 'type', value)}
                      style={{ width: '100%' }}
                    >
                      <Select.Option value="string">字符串</Select.Option>
                      <Select.Option value="number">数字</Select.Option>
                      <Select.Option value="boolean">布尔</Select.Option>
                      <Select.Option value="object">对象</Select.Option>
                      <Select.Option value="array">数组</Select.Option>
                      <Select.Option value="any">任意</Select.Option>
                    </Select>
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder="描述"
                      value={param.description}
                      onChange={(e) => handleUpdateOutputParam(index, 'description', e.target.value)}
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteOutputParam(index)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>

        {/* 提示信息 */}
        <Card size="small" type="inner" style={{ backgroundColor: '#f0f0f0' }}>
          <p style={{ margin: 0, color: '#666' }}>
            💡 <strong>提示</strong>:
            <br />- 输入参数：块执行时需要接收的数据
            <br />- 输出参数：块执行完成后产生的数据
            <br />- 参数可为空，流程编排时可根据参数定义进行数据传递
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
});

export default BlockFormEnhanced;
