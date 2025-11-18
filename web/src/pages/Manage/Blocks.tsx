import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Row, Col, Card, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, TagsOutlined, SearchOutlined } from '@ant-design/icons';
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import type { Block, BlockType } from '../../types/api';
import Editor from '@monaco-editor/react';

const Blocks: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [tagsStatistics, setTagsStatistics] = useState<Record<string, number>>({});
  const [searchParams, setSearchParams] = useState<{
    name?: string;
    typeCode?: string;
    tag?: string;
  }>({});
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchBlocks();
    fetchBlockTypes();
    fetchTagsStatistics();
  }, []);

  const fetchBlocks = async (params?: any) => {
    setLoading(true);
    try {
      const response = await blockApi.getBlockList({
        page: {
          pageNum: 0,
          pageSize: 100
        },
        ...searchParams,
        ...params
      });
      if (response.data) {
        setBlocks(response.data.records || []);
      }
    } catch (error) {
      message.error('获取块列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockTypes = async () => {
    try {
      const response = await blockTypeApi.listAll();
      if (response.data) {
        setBlockTypes(response.data);
      }
    } catch (error) {
      message.error('获取块类型失败');
    }
  };

  const fetchTagsStatistics = async () => {
    try {
      const response = await blockApi.getTagsStatistics();
      if (response.data) {
        setTagsStatistics(response.data);
      }
    } catch (error) {
      console.error('获取标签统计失败', error);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    fetchBlocks(values);
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    fetchBlocks({});
  };

  const handleAdd = () => {
    setEditingBlock(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Block) => {
    setEditingBlock(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个块吗？',
      onOk: async () => {
        try {
          await blockApi.deleteBlock(id);
          message.success('删除成功');
          fetchBlocks();
          fetchTagsStatistics();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleClone = async (id: number) => {
    try {
      await blockApi.cloneBlock(id);
      message.success('克隆成功');
      fetchBlocks();
    } catch (error) {
      message.error('克隆失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBlock) {
        await blockApi.updateBlock(editingBlock.id, values);
        message.success('更新成功');
      } else {
        await blockApi.createBlock(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchBlocks();
      fetchTagsStatistics();
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
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'typeCode',
      key: 'typeCode',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags && tags.map((tag, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ marginBottom: 4, cursor: 'pointer' }}
              onClick={() => {
                searchForm.setFieldsValue({ tag });
                handleSearch();
              }}
            >
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color: string) => (
        <Tag color={color}>{color}</Tag>
      ),
    },
    {
      title: '是否公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (isPublic: boolean) => (
        <Tag color={isPublic ? 'green' : 'orange'}>
          {isPublic ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: Block) => (
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
            icon={<CopyOutlined />}
            onClick={() => handleClone(record.id)}
          >
            克隆
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

  // 获取热门标签（使用次数最多的前10个）
  const topTags = Object.entries(tagsStatistics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div>
      {/* 标签统计卡片 */}
      {topTags.length > 0 && (
        <Card
          title={<><TagsOutlined /> 热门标签</>}
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Space wrap>
            {topTags.map(([tag, count]) => (
              <Tag
                key={tag}
                color="blue"
                style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
                onClick={() => {
                  searchForm.setFieldsValue({ tag });
                  handleSearch();
                }}
              >
                {tag} ({count})
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Form form={searchForm} layout="inline">
          <Form.Item name="name" label="块名称">
            <Input placeholder="请输入块名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="typeCode" label="类型代码">
            <Input placeholder="请输入类型代码" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="tag" label="标签">
            <Input placeholder="请输入标签" prefix={<TagsOutlined />} style={{ width: 200 }} />
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

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建块
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={blocks}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingBlock ? '编辑块' : '新建块'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="块名称"
            name="name"
            rules={[{ required: true, message: '请输入块名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="块类型"
            name="blockTypeId"
            rules={[{ required: true, message: '请选择块类型' }]}
          >
            <Select>
              {blockTypes.map(type => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="类型代码"
            name="typeCode"
            rules={[{ required: true, message: '请输入类型代码' }]}
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
            label="标签"
            name="tags"
            help="输入标签后按回车添加，支持多个标签"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="请输入标签"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            label="颜色"
            name="color"
            initialValue="#5C7CFA"
          >
            <Input type="color" />
          </Form.Item>

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
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Blocks;
