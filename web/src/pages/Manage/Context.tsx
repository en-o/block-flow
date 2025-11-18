import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { contextApi } from '../../api/context';
import type { ContextVariable, ContextVariableCreateDTO, ContextVariableUpdateDTO } from '../../types/api';

const Context: React.FC = () => {
  const [variables, setVariables] = useState<ContextVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState<ContextVariable | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    setLoading(true);
    try {
      const response = await contextApi.getContextVariables();
      if (response.data) {
        setVariables(response.data);
      }
    } catch (error) {
      console.error('获取变量列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVariable(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ContextVariable) => {
    setEditingVariable(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个变量吗？',
      onOk: async () => {
        try {
          await contextApi.deleteContextVariable(id);
          message.success('删除成功');
          fetchVariables();
        } catch (error) {
          console.error('删除失败', error);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingVariable) {
        const updateData: ContextVariableUpdateDTO = {
          id: editingVariable.id,
          ...values
        };
        await contextApi.updateContextVariable(updateData);
        message.success('更新成功');
      } else {
        const createData: ContextVariableCreateDTO = values;
        await contextApi.createContextVariable(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchVariables();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '变量名',
      dataIndex: 'varKey',
      key: 'varKey',
      width: 200,
    },
    {
      title: '变量值',
      dataIndex: 'varValue',
      key: 'varValue',
      width: 250,
      render: (value: string, record: ContextVariable) => {
        if (record.varType === 'SECRET') {
          return '******';
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    {
      title: '类型',
      dataIndex: 'varType',
      key: 'varType',
      width: 100,
      render: (type: 'TEXT' | 'SECRET' | 'JSON' | 'NUMBER' | 'FILE') => {
        const colorMap: Record<string, string> = {
          TEXT: 'blue',
          SECRET: 'red',
          JSON: 'green',
          NUMBER: 'cyan',
          FILE: 'orange',
        };
        const nameMap: Record<string, string> = {
          TEXT: '文本',
          SECRET: '密钥',
          JSON: 'JSON',
          NUMBER: '数字',
          FILE: '文件',
        };
        return <Tag color={colorMap[type]}>{nameMap[type]}</Tag>;
      },
    },
    {
      title: '分组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 120,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (env: 'DEFAULT' | 'DEV' | 'TEST' | 'PROD') => {
        const nameMap: Record<string, string> = {
          DEFAULT: '默认',
          DEV: '开发',
          TEST: '测试',
          PROD: '生产',
        };
        const colorMap: Record<string, string> = {
          DEFAULT: 'default',
          DEV: 'blue',
          TEST: 'orange',
          PROD: 'red',
        };
        return <Tag color={colorMap[env]}>{nameMap[env]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ContextVariable) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建变量
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={variables}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingVariable ? '编辑变量' : '新建变量'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="变量名"
            name="varKey"
            rules={[{ required: true, message: '请输入变量名' }]}
          >
            <Input placeholder="例如: DB_HOST" disabled={!!editingVariable} />
          </Form.Item>

          <Form.Item
            label="变量值"
            name="varValue"
            rules={[{ required: true, message: '请输入变量值' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入变量值" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="varType"
            initialValue="TEXT"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="TEXT">文本</Select.Option>
              <Select.Option value="SECRET">密钥（加密存储）</Select.Option>
              <Select.Option value="JSON">JSON</Select.Option>
              <Select.Option value="NUMBER">数字</Select.Option>
              <Select.Option value="FILE">文件</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="分组"
            name="groupName"
          >
            <Input placeholder="例如: database" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            label="环境"
            name="environment"
            initialValue="DEFAULT"
          >
            <Select>
              <Select.Option value="DEFAULT">默认</Select.Option>
              <Select.Option value="DEV">开发</Select.Option>
              <Select.Option value="TEST">测试</Select.Option>
              <Select.Option value="PROD">生产</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Context;
