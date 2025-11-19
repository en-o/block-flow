import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Card, App, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, TagsOutlined, SearchOutlined, CodeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import type { Block, BlockType, BlockPage, BlockCreateDTO, BlockUpdateDTO } from '../../types/api';
import BlockFormEnhanced, { type BlockFormEnhancedRef } from '../../components/BlockFormEnhanced';

const Blocks: React.FC = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
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
  const blockFormRef = useRef<BlockFormEnhancedRef>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

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
    // 不设置 inputs 和 outputs，由 BlockFormEnhanced 通过 editingBlock 处理
    const { inputs, outputs, ...otherFields } = record;
    form.setFieldsValue(otherFields);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>确定要删除这个块吗？</p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            ⚠️ 注意：如果此块正在被流程使用，删除后可能导致流程无法正常执行。
          </p>
        </div>
      ),
      onOk: async () => {
        try {
          await blockApi.delete(id);
          message.success('删除成功');
          fetchBlocks();
          fetchTagsStatistics();
        } catch (error: any) {
          message.error(error.message || '删除失败');
          throw error; // 抛出错误以保持 Modal 打开
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

  const handleSubmit = useCallback(async () => {
    try {
      // 先验证表单字段
      await form.validateFields();

      // 从 BlockFormEnhanced 获取完整的表单数据（包括 inputs 和 outputs）
      const values = blockFormRef.current?.getFormValues();

      if (!values) {
        message.error('获取表单数据失败');
        return;
      }

      if (editingBlock) {
        const updateData: BlockUpdateDTO = {
          id: editingBlock.id,
          ...values
        };
        await blockApi.update(updateData);
        message.success('更新成功');
        // 重新加载块列表和当前块数据
        fetchBlocks();
        fetchTagsStatistics();
        // 重新加载当前编辑的块数据
        const response = await blockApi.getById(editingBlock.id);
        if (response.code === 200 && response.data) {
          setEditingBlock(response.data);
        }
      } else {
        const createData: BlockCreateDTO = values;
        const response = await blockApi.create(createData);
        message.success('创建成功');
        setModalVisible(false);
        fetchBlocks();
        fetchTagsStatistics();
      }
    } catch (error) {
      console.error('保存失败', error);
    }
  }, [editingBlock, form, fetchBlocks, fetchTagsStatistics]);

  // 监听Ctrl+S快捷键保存（必须放在handleSubmit定义之后）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否是Ctrl+S或Cmd+S（Mac）
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认保存行为
        // 只在Modal打开时才执行保存
        if (modalVisible) {
          handleSubmit();
        }
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalVisible, handleSubmit]); // 添加handleSubmit到依赖

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

  // 打开测试弹窗
  const handleOpenTest = () => {
    if (!editingBlock) {
      message.warning('请先保存块后再进行测试');
      return;
    }

    // 初始化测试输入值
    const initialInputs: Record<string, any> = {};
    if (editingBlock.inputs && typeof editingBlock.inputs === 'object') {
      Object.entries(editingBlock.inputs).forEach(([name, config]: [string, any]) => {
        initialInputs[name] = config.defaultValue || '';
      });
    }
    setTestInputs(initialInputs);
    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行测试
  const handleTest = async () => {
    if (!editingBlock) {
      message.warning('请先保存块后再进行测试');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await blockApi.test(editingBlock.id, { inputs: testInputs });
      if (response.code === 200) {
        // 尝试解析 JSON
        try {
          const resultData = typeof response.data === 'string'
            ? JSON.parse(response.data)
            : response.data;
          setTestResult(resultData);
        } catch (e) {
          // 如果不是 JSON，直接显示
          setTestResult({
            success: true,
            output: response.data || '执行成功，无输出'
          });
        }
      } else {
        setTestResult({
          success: false,
          error: `错误: ${response.message || '未知错误'}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: `执行失败: ${error.message || '未知错误'}`
      });
    } finally {
      setTesting(false);
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
        title={
          <Space>
            <span>{editingBlock ? '编辑块' : '新建块'}</span>
            <Tag color="blue" style={{ fontSize: 12 }}>Ctrl+S 保存</Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={900}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          editingBlock && (
            <Button
              key="test"
              icon={<PlayCircleOutlined />}
              onClick={handleOpenTest}
            >
              测试运行
            </Button>
          ),
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {editingBlock ? '更新' : '创建'}
          </Button>,
        ]}
      >
        <BlockFormEnhanced
          ref={blockFormRef}
          form={form}
          editingBlock={editingBlock}
          blockTypes={blockTypes}
          onBlockTypesChange={fetchBlockTypes}
        />
      </Modal>

      {/* 测试运行弹窗 */}
      <Modal
        title="测试运行"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setTestModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="run"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleTest}
            loading={testing}
          >
            运行
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>输入参数</h4>
          {!editingBlock?.inputs || Object.keys(editingBlock.inputs).length === 0 ? (
            <p style={{ color: '#999' }}>该块没有配置输入参数</p>
          ) : (
            <div>
              {Object.entries(editingBlock.inputs).map(([name, config]: [string, any]) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{name}</strong>
                    <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                      ({config.type || 'string'})
                    </span>
                    {config.description && (
                      <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                        - {config.description}
                      </span>
                    )}
                  </div>
                  <Input
                    value={testInputs[name] || ''}
                    onChange={(e) => setTestInputs({ ...testInputs, [name]: e.target.value })}
                    placeholder={`请输入 ${name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <div>
          <h4>执行结果</h4>
          {testing ? (
            <div
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                textAlign: 'center',
                color: '#666',
                minHeight: 200,
              }}
            >
              正在执行...
            </div>
          ) : !testResult ? (
            <div
              style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                textAlign: 'center',
                color: '#999',
                minHeight: 200,
              }}
            >
              点击"运行"按钮执行测试
            </div>
          ) : (
            <Card
              size="small"
              style={{
                background: testResult.success ? '#f6ffed' : '#fff2e8',
                borderColor: testResult.success ? '#b7eb8f' : '#ffbb96',
              }}
            >
              {/* 状态和执行时间 */}
              <Space style={{ marginBottom: 12 }}>
                <Tag color={testResult.success ? 'success' : 'error'}>
                  {testResult.success ? '✓ 执行成功' : '✗ 执行失败'}
                </Tag>
                {testResult.executionTime !== undefined && (
                  <Tag color="blue">耗时: {testResult.executionTime}ms</Tag>
                )}
              </Space>

              {/* 成功输出 */}
              {testResult.success && testResult.output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#52c41a' }}>
                    📤 输出结果：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 300,
                      overflowY: 'auto',
                      fontSize: 13,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {(() => {
                      // 提取 _console_output 并显示剩余内容
                      if (typeof testResult.output === 'object') {
                        const { _console_output, ...restOutput } = testResult.output;
                        return JSON.stringify(restOutput, null, 2);
                      }
                      return testResult.output;
                    })()}
                  </pre>
                </div>
              )}

              {/* 控制台输出 (print) */}
              {testResult.success && testResult.output && typeof testResult.output === 'object' && testResult.output._console_output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                    🖥️ 控制台输出 (print)：
                  </div>
                  <pre
                    style={{
                      background: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#1890ff',
                    }}
                  >
                    {testResult.output._console_output}
                  </pre>
                </div>
              )}

              {/* 错误信息 */}
              {!testResult.success && (testResult.error || testResult.errorMessage) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>
                    ❌ 错误信息：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #ffccc7',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 13,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#ff4d4f',
                    }}
                  >
                    {testResult.errorMessage || testResult.error}
                  </pre>
                </div>
              )}

              {/* 错误时的控制台输出 */}
              {!testResult.success && testResult.output && typeof testResult.output === 'object' && testResult.output._console_output && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                    🖥️ 控制台输出 (print)：
                  </div>
                  <pre
                    style={{
                      background: '#f0f5ff',
                      border: '1px solid #adc6ff',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#1890ff',
                    }}
                  >
                    {testResult.output._console_output}
                  </pre>
                </div>
              )}

              {/* 标准错误输出 */}
              {testResult.stderr && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#fa8c16' }}>
                    ⚠️ 错误输出 (stderr)：
                  </div>
                  <pre
                    style={{
                      background: '#fff',
                      border: '1px solid #ffd591',
                      borderRadius: 4,
                      padding: 12,
                      margin: 0,
                      maxHeight: 200,
                      overflowY: 'auto',
                      fontSize: 12,
                      fontFamily: 'Consolas, Monaco, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#fa8c16',
                    }}
                  >
                    {testResult.stderr}
                  </pre>
                </div>
              )}

              {/* 退出代码 */}
              {testResult.exitCode !== undefined && testResult.exitCode !== 0 && (
                <div style={{ marginTop: 12 }}>
                  <Tag color="warning">退出代码: {testResult.exitCode}</Tag>
                </div>
              )}
            </Card>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Blocks;
