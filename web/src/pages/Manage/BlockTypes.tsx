import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { blockTypeApi } from '../../api/blockType';
import type { BlockType } from '../../types/api';

const BlockTypes: React.FC = () => {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlockType, setEditingBlockType] = useState<BlockType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBlockTypes();
  }, []);

  const fetchBlockTypes = async () => {
    setLoading(true);
    try {
      const response = await blockTypeApi.getBlockTypeList({ pageNo: 1, pageSize: 100 });
      if (response.data) {
        setBlockTypes(response.data.records || []);
      }
    } catch (error) {
      message.error('获取块类型列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBlockType(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: BlockType) => {
    setEditingBlockType(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个块类型吗？',
      onOk: async () => {
        try {
          await blockTypeApi.deleteBlockType(id);
          message.success('删除成功');
          fetchBlockTypes();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBlockType) {
        await blockTypeApi.updateBlockType(editingBlockType.id, values);
        message.success('更新成功');
      } else {
        await blockTypeApi.createBlockType(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchBlockTypes();
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
      title: '类型代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BlockType) => (
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
          新建块类型
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={blockTypes}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingBlockType ? '编辑块类型' : '新建块类型'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="类型代码"
            name="code"
            rules={[{ required: true, message: '请输入类型代码' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="类型名称"
            name="name"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="图标"
            name="icon"
          >
            <Input placeholder="图标名称或Unicode" />
          </Form.Item>

          <Form.Item
            label="排序"
            name="sortOrder"
            initialValue={0}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BlockTypes;
