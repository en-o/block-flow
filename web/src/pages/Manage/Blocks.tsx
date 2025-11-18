import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, TagsOutlined, SearchOutlined, CodeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import type { Block, BlockType, BlockPage, BlockCreateDTO, BlockUpdateDTO } from '../../types/api';
import BlockFormEnhanced from '../../components/BlockFormEnhanced';

const Blocks: React.FC = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [tagsStatistics, setTagsStatistics] = useState<Record<string, number>>({});
  const [searchParams, setSearchParams] = useState<BlockPage>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchBlocks();
    fetchBlockTypes();
    fetchTagsStatistics();
  }, []);

  const fetchBlocks = async (params?: BlockPage) => {
    setLoading(true);
    try {
      const queryParams: BlockPage = {
        ...searchParams,
        ...params,
        page: {
          pageNum: (params?.page?.pageNum !== undefined ? params.page.pageNum : pagination.current - 1),
          pageSize: (params?.page?.pageSize !== undefined ? params.page.pageSize : pagination.pageSize),
        }
      };

      const response = await blockApi.page(queryParams);
      if (response.code === 200 && response.data) {
        setBlocks(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取块列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockTypes = async () => {
    try {
      const response = await blockTypeApi.listAll();
      if (response.code === 200 && response.data) {
        setBlockTypes(response.data);
      }
    } catch (error) {
      console.error('获取块类型失败', error);
    }
  };

  const fetchTagsStatistics = async () => {
    try {
      const response = await blockApi.getTagsStatistics();
      if (response.code === 200 && response.data) {
        setTagsStatistics(response.data);
      }
    } catch (error) {
      console.error('获取标签统计失败', error);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlocks({ ...values, page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlocks({ page: { pageNum: 0, pageSize: pagination.pageSize } });
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
          await blockApi.delete(id);
          message.success('删除成功');
          fetchBlocks();
          fetchTagsStatistics();
        } catch (error) {
          console.error('删除失败', error);
        }
      },
    });
  };

  const handleClone = async (id: number) => {
    try {
      await blockApi.clone(id);
      message.success('克隆成功');
      fetchBlocks();
    } catch (error) {
      console.error('克隆失败', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingBlock) {
        const updateData: BlockUpdateDTO = {
          id: editingBlock.id,
          ...values
        };
        await blockApi.update(updateData);
        message.success('更新成功');
      } else {
        const createData: BlockCreateDTO = values;
        await blockApi.create(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchBlocks();
      fetchTagsStatistics();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchBlocks({
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
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      fixed: 'right' as const,
      render: (_: any, record: Block) => (
        <Space>
          <Button
            type="link"
            icon={<CodeOutlined />}
            onClick={() => navigate(`/block-editor/${record.id}`)}
          >
            高级编辑
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            快捷编辑
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
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            快捷新建块
          </Button>
          <Button
            icon={<CodeOutlined />}
            onClick={() => navigate('/block-editor')}
          >
            高级编辑器新建
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={blocks}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingBlock ? '编辑块' : '新建块'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        destroyOnClose
      >
        <BlockFormEnhanced
          form={form}
          editingBlock={editingBlock}
          blockTypes={blockTypes}
          onBlockTypesChange={fetchBlockTypes}
        />
      </Modal>
    </div>
  );
};

export default Blocks;
