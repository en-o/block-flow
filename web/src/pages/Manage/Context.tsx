import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { contextApi } from '../../api/context';
import type { ContextVariable } from '../../types/api';

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
      message.error('获取变量列表失败');
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

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个变量吗？',
      onOk: async () => {
        try {
          await contextApi.deleteContextVariable(key);
          message.success('删除成功');
          fetchVariables();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingVariable) {
        await contextApi.updateContextVariable(editingVariable.varKey, values);
        message.success('更新成功');
      } else {
        await contextApi.createContextVariable(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchVariables();
    } catch (error) {
      message.error('保存失败');
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
    },
    {
      title: '变量值',
      dataIndex: 'varValue',
      key: 'varValue',
      render: (value: string, record: ContextVariable) => {
        if (record.varType === 'secret') {
          return '******';
        }
        return value.length > 50 ? value.substring(0, 50) + '...' : value;
      },
    },
    {
      title: '类型',
      dataIndex: 'varType',
      key: 'varType',
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          text: 'blue',
          secret: 'red',
          json: 'green',
          file: 'orange',
        };
        return <Tag color={colorMap[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: '分组',
      dataIndex: 'groupName',
      key: 'groupName',
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: (env: string) => <Tag>{env}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
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
            onClick={() => handleDelete(record.varKey)}
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
      />

      <Modal
        title={editingVariable ? '编辑变量' : '新建变量'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="变量名"
            name="varKey"
            rules={[{ required: true, message: '请输入变量名' }]}
          >
            <Input disabled={!!editingVariable} />
          </Form.Item>

          <Form.Item
            label="变量值"
            name="varValue"
            rules={[{ required: true, message: '请输入变量值' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="类型"
            name="varType"
            initialValue="text"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="secret">密钥</Select.Option>
              <Select.Option value="json">JSON</Select.Option>
              <Select.Option value="file">文件</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="分组"
            name="groupName"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="环境"
            name="environment"
            initialValue="default"
          >
            <Select>
              <Select.Option value="default">默认</Select.Option>
              <Select.Option value="dev">开发</Select.Option>
              <Select.Option value="test">测试</Select.Option>
              <Select.Option value="prod">生产</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Context;
