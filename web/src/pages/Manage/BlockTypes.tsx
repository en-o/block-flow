import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, InputNumber, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { blockTypeApi } from '../../api/blockType';
import type { BlockType, BlockTypeCreateDTO, BlockTypeUpdateDTO, BlockTypePage } from '../../types/api';

const BlockTypes: React.FC = () => {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlockType, setEditingBlockType] = useState<BlockType | null>(null);
  const [searchParams, setSearchParams] = useState<BlockTypePage>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchBlockTypes();
  }, []);

  const fetchBlockTypes = async (params?: BlockTypePage) => {
    setLoading(true);
    try {
      const queryParams: BlockTypePage = {
        ...searchParams,
        ...params,
        page: {
          pageNum: (params?.page?.pageNum !== undefined ? params.page.pageNum : pagination.current - 1),
          pageSize: (params?.page?.pageSize !== undefined ? params.page.pageSize : pagination.pageSize),
        }
      };

      const response = await blockTypeApi.page(queryParams);
      if (response.code === 200 && response.data) {
        setBlockTypes(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取块类型列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlockTypes({ ...values, page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlockTypes({ page: { pageNum: 0, pageSize: pagination.pageSize } });
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

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个块类型吗？',
      onOk: async () => {
        try {
          await blockTypeApi.delete(id);
          message.success('删除成功');
          fetchBlockTypes();
        } catch (error: any) {
          message.error(error.message || '删除失败');
          throw error; // 抛出错误以保持 Modal 打开
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBlockType) {
        const updateData: BlockTypeUpdateDTO = {
          id: editingBlockType.id,
          ...values
        };
        await blockTypeApi.update(updateData);
        message.success('更新成功');
      } else {
        const createData: BlockTypeCreateDTO = values;
        await blockTypeApi.create(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchBlockTypes();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchBlockTypes({
      ...searchParams,
      page: {
        pageNum: pag.current - 1,
        pageSize: pag.pageSize
      }
    });
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
      width: 150,
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Form form={searchForm} layout="inline">
          <Form.Item name="name" label="类型名称">
            <Input placeholder="请输入类型名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleResetSearch}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

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
        pagination={pagination}
        onChange={handleTableChange}
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
            <Input placeholder="例如: ssh_upload" />
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
            tooltip="数字越小越靠前"
          >
            <InputNumber placeholder="排序值" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BlockTypes;
