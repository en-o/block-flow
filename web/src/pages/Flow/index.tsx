import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type OnConnect,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Input, Form, Select, message as antdMessage, Modal, Empty, Spin, Popconfirm } from 'antd';
import { SaveOutlined, PlayCircleOutlined, DownloadOutlined, FolderOpenOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import BlockNode, { type BlockNodeData } from '../../components/BlockNode';
import { blockApi } from '../../api/block';
import { workflowApi } from '../../api/workflow';
import { authUtils } from '../../utils/auth';
import type { Block, Workflow } from '../../types/api';
import './index.css';

const nodeTypes: NodeTypes = {
  blockNode: BlockNode,
};

const Flow: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<BlockNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [copiedNode, setCopiedNode] = useState<Node<BlockNodeData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saveForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 加载块库
  useEffect(() => {
    loadBlocks();
  }, []);

  // 监听 Ctrl+S 快捷键保存流程
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认的保存行为
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentWorkflow, nodes, edges]);

  // 监听 Delete/Ctrl+X/Ctrl+C/Ctrl+V 快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Delete 或 Ctrl+X: 删除选中的节点或边
      if (event.key === 'Delete' || ((event.ctrlKey || event.metaKey) && event.key === 'x')) {
        event.preventDefault();
        if (selectedNode) {
          // 如果是 Ctrl+X，先复制再删除
          if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
            setCopiedNode(selectedNode);
            antdMessage.success('已剪切节点');
          }
          // 删除节点
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          // 同时删除与该节点相关的所有连接
          setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
          setSelectedNode(null);
          if (event.key === 'Delete') {
            antdMessage.success('已删除节点');
          }
        } else if (selectedEdge) {
          // 删除边
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
          setSelectedEdge(null);
          antdMessage.success('已删除连接');
        }
      }

      // Ctrl+C: 复制选中的节点
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        if (selectedNode) {
          setCopiedNode(selectedNode);
          antdMessage.success('已复制节点');
        }
      }

      // Ctrl+V: 粘贴节点
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        if (copiedNode) {
          const newNode: Node<BlockNodeData> = {
            ...copiedNode,
            id: `node-${Date.now()}-${Math.random()}`,
            position: {
              x: copiedNode.position.x + 50,
              y: copiedNode.position.y + 50,
            },
          };
          setNodes((nds) => nds.concat(newNode));
          setSelectedNode(newNode);
          antdMessage.success('已粘贴节点');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedEdge, copiedNode, setNodes, setEdges]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const response = await blockApi.page({
        page: { pageNum: 0, pageSize: 100 },
      });
      if (response.code === 200 && response.data?.rows) {
        setBlocks(response.data.rows);
      }
    } catch (error) {
      console.error('加载块库失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 连接节点
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#1890ff', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // 拖拽块到画布
  const onDragStart = (event: React.DragEvent, block: Block) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(block));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const blockData = event.dataTransfer.getData('application/reactflow');

      if (blockData && reactFlowBounds) {
        const block: Block = JSON.parse(blockData);
        const position = {
          x: event.clientX - reactFlowBounds.left - 100,
          y: event.clientY - reactFlowBounds.top - 50,
        };

        const newNode: Node<BlockNodeData> = {
          id: `node-${Date.now()}-${Math.random()}`,
          type: 'blockNode',
          position,
          data: {
            blockId: block.id,
            blockName: block.name,
            blockTypeCode: block.typeCode,
            color: block.color,
            description: block.description,
            inputs: block.inputs || {},
            outputs: block.outputs || {},
            icon: block.icon,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes]
  );

  // 选中节点
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<BlockNodeData>);
    setSelectedEdge(null); // 清除边的选择
  }, []);

  // 选中边
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // 清除节点的选择
  }, []);

  // 点击画布空白处清除选择
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // 保存流程
  const handleSave = async () => {
    // 如果有当前流程，直接更新（不弹窗）
    if (currentWorkflow) {
      const flowDefinition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      try {
        await workflowApi.update({
          id: currentWorkflow.id,
          name: currentWorkflow.name,
          description: currentWorkflow.description,
          category: currentWorkflow.category,
          flowDefinition,
        });
        antdMessage.success('流程更新成功');
      } catch (error) {
        console.error('更新流程失败', error);
      }
    } else {
      // 没有当前流程，打开新建流程对话框
      setSaveModalVisible(true);
    }
  };

  // 新建流程
  const handleNew = () => {
    // 清空画布
    setNodes([]);
    setEdges([]);
    setCurrentWorkflow(null);
    setSelectedNode(null);
    antdMessage.success('已创建新流程');
  };

  // 编辑流程信息
  const handleEditInfo = () => {
    if (currentWorkflow) {
      editForm.setFieldsValue({
        description: currentWorkflow.description,
        category: currentWorkflow.category,
      });
      setEditModalVisible(true);
    } else {
      antdMessage.warning('请先加载或创建一个流程');
    }
  };

  // 确认编辑流程信息
  const handleEditInfoConfirm = async () => {
    if (!currentWorkflow) return;

    try {
      const values = await editForm.validateFields();
      const flowDefinition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      await workflowApi.update({
        id: currentWorkflow.id,
        name: currentWorkflow.name, // 名称不变
        description: values.description,
        category: values.category,
        flowDefinition,
      });

      // 更新本地状态
      setCurrentWorkflow({
        ...currentWorkflow,
        description: values.description,
        category: values.category,
      });

      antdMessage.success('流程信息更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
    } catch (error) {
      console.error('更新流程信息失败', error);
    }
  };

  const handleSaveConfirm = async () => {
    try {
      const values = await saveForm.validateFields();
      const flowDefinition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      // 创建新流程
      const response = await workflowApi.create({
        ...values,
        flowDefinition,
        version: '1.0.0',
        isActive: true,
      });
      if (response.code === 200) {
        setCurrentWorkflow(response.data);
        antdMessage.success('流程保存成功');
      }

      setSaveModalVisible(false);
      saveForm.resetFields();
    } catch (error) {
      console.error('保存流程失败', error);
    }
  };

  // 加载流程
  const handleLoad = async () => {
    try {
      const response = await workflowApi.page({
        page: { pageNum: 0, pageSize: 50 },
      });
      if (response.code === 200 && response.data?.rows) {
        setWorkflows(response.data.rows);
        setLoadModalVisible(true);
      }
    } catch (error) {
      console.error('加载流程列表失败', error);
    }
  };

  const handleLoadWorkflow = (workflow: Workflow) => {
    const { flowDefinition } = workflow;
    if (flowDefinition && flowDefinition.nodes && flowDefinition.edges) {
      setNodes(flowDefinition.nodes as Node[]);
      setEdges(flowDefinition.edges as Edge[]);
      setCurrentWorkflow(workflow);
      antdMessage.success(`已加载流程: ${workflow.name}`);
      setLoadModalVisible(false);
    }
  };

  // 删除流程
  const handleDeleteWorkflow = async (workflowId: number, workflowName: string) => {
    try {
      await workflowApi.delete(workflowId);
      antdMessage.success(`流程 "${workflowName}" 删除成功`);

      // 如果删除的是当前加载的流程，清空画布
      if (currentWorkflow && currentWorkflow.id === workflowId) {
        setNodes([]);
        setEdges([]);
        setCurrentWorkflow(null);
      }

      // 重新加载流程列表
      const response = await workflowApi.page({
        page: { pageNum: 0, pageSize: 50 },
      });
      if (response.code === 200 && response.data?.rows) {
        setWorkflows(response.data.rows);
      }
    } catch (error: any) {
      antdMessage.error(error.message || '删除失败');
    }
  };

  // 执行流程
  const handleExecute = async () => {
    if (!currentWorkflow) {
      antdMessage.warning('请先保存流程后再执行');
      return;
    }

    try {
      await workflowApi.execute(currentWorkflow.id);
      antdMessage.success('流程已提交执行');
    } catch (error) {
      console.error('执行流程失败', error);
    }
  };

  // 导出流程
  const handleExport = () => {
    const flowData = {
      nodes,
      edges,
      workflow: currentWorkflow,
    };

    const blob = new Blob([JSON.stringify(flowData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${currentWorkflow?.name || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flow-container">
      <div className="flow-header">
        <h1>BlockFlow - 流程编排</h1>
        <div className="flow-actions">
          {/* 只有 ADMIN 和 USER 可以访问管理后台 */}
          {authUtils.canAccessManagement() && (
            <a href="/manage">管理后台</a>
          )}
        </div>
      </div>

      <div className="flow-content">
        {/* 左侧块库 */}
        <div className="flow-toolbox">
          <h3>块库</h3>
          <div className="toolbox-content">
            {loading ? (
              <Spin />
            ) : blocks.length === 0 ? (
              <Empty description="暂无可用块" />
            ) : (
              blocks.map((block) => (
                <div
                  key={block.id}
                  className="block-library-item"
                  draggable
                  onDragStart={(e) => onDragStart(e, block)}
                  style={{ borderLeft: `3px solid ${block.color}` }}
                >
                  <div className="block-header">
                    <span style={{ fontSize: '16px' }}>{block.icon || '📦'}</span>
                    <div style={{ flex: 1 }}>
                      <div className="block-name">{block.name}</div>
                      <div className="block-type">{block.typeCode}</div>
                    </div>
                  </div>
                  {block.description && (
                    <div className="block-description">{block.description}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 中间工作区 */}
        <div
          className="flow-workspace"
          ref={reactFlowWrapper}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-center">
              {currentWorkflow && (
                <div
                  style={{
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  当前流程: <strong>{currentWorkflow.name}</strong>
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>

        {/* 右侧属性面板 */}
        <div className="flow-properties">
          <h3>属性配置</h3>
          <div className="properties-content">
            {selectedNode ? (
              <Form layout="vertical">
                <Form.Item label="节点 ID">
                  <Input value={selectedNode.id} disabled />
                </Form.Item>
                <Form.Item label="块名称">
                  <Input value={selectedNode.data.blockName} disabled />
                </Form.Item>
                <Form.Item label="块类型">
                  <Input value={selectedNode.data.blockTypeCode} disabled />
                </Form.Item>
                <Form.Item label="描述">
                  <Input.TextArea
                    value={selectedNode.data.description}
                    rows={3}
                    disabled
                  />
                </Form.Item>
                {/* 显示输入参数 */}
                {selectedNode.data.inputs && Object.keys(selectedNode.data.inputs).length > 0 && (
                  <Form.Item label="输入参数">
                    <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {Object.entries(selectedNode.data.inputs).map(([name, param]: [string, any]) => (
                        <div key={name} style={{ marginBottom: '4px', fontSize: '12px' }}>
                          <strong>{name}</strong>: {param.type} {param.description && `- ${param.description}`}
                        </div>
                      ))}
                    </div>
                  </Form.Item>
                )}
                {/* 显示输出参数 */}
                {selectedNode.data.outputs && Object.keys(selectedNode.data.outputs).length > 0 && (
                  <Form.Item label="输出参数">
                    <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                      {Object.entries(selectedNode.data.outputs).map(([name, param]: [string, any]) => (
                        <div key={name} style={{ marginBottom: '4px', fontSize: '12px' }}>
                          <strong>{name}</strong>: {param.type} {param.description && `- ${param.description}`}
                        </div>
                      ))}
                    </div>
                  </Form.Item>
                )}
              </Form>
            ) : selectedEdge ? (
              <Form layout="vertical">
                <Form.Item label="连接 ID">
                  <Input value={selectedEdge.id} disabled />
                </Form.Item>
                <Form.Item label="源节点">
                  <Input value={nodes.find(n => n.id === selectedEdge.source)?.data?.blockName || selectedEdge.source} disabled />
                </Form.Item>
                <Form.Item label="源输出">
                  <Input value={selectedEdge.sourceHandle ? selectedEdge.sourceHandle.replace('output-', '') : '默认输出'} disabled />
                </Form.Item>
                <Form.Item label="目标节点">
                  <Input value={nodes.find(n => n.id === selectedEdge.target)?.data?.blockName || selectedEdge.target} disabled />
                </Form.Item>
                <Form.Item label="目标输入">
                  <Input value={selectedEdge.targetHandle ? selectedEdge.targetHandle.replace('input-', '') : '默认输入'} disabled />
                </Form.Item>
                {/* 显示连接详情 */}
                {selectedEdge.sourceHandle && selectedEdge.targetHandle && (
                  <Form.Item label="数据流向">
                    <div style={{ background: '#f0f5ff', padding: '12px', borderRadius: '4px', border: '1px solid #adc6ff' }}>
                      <div style={{ fontSize: '13px', lineHeight: '20px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>从:</strong> {nodes.find(n => n.id === selectedEdge.source)?.data?.blockName}
                        </div>
                        <div style={{ marginLeft: '12px', marginBottom: '8px', color: '#1890ff' }}>
                          ↓ 输出: <strong>{selectedEdge.sourceHandle.replace('output-', '')}</strong>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>到:</strong> {nodes.find(n => n.id === selectedEdge.target)?.data?.blockName}
                        </div>
                        <div style={{ marginLeft: '12px', color: '#52c41a' }}>
                          ↓ 输入: <strong>{selectedEdge.targetHandle.replace('input-', '')}</strong>
                        </div>
                      </div>
                    </div>
                  </Form.Item>
                )}
              </Form>
            ) : (
              <Empty description="选择节点或连接查看属性" />
            )}
          </div>
        </div>
      </div>

      <div className="flow-footer">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleNew}
        >
          新建流程
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
        >
          保存流程
        </Button>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleExecute}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          执行流程
        </Button>
        <Button icon={<FolderOpenOutlined />} onClick={handleLoad}>
          加载流程
        </Button>
        {currentWorkflow && (
          <Button icon={<EditOutlined />} onClick={handleEditInfo}>
            编辑流程信息
          </Button>
        )}
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出
        </Button>
      </div>

      {/* 保存流程弹窗 */}
      <Modal
        title="保存流程"
        open={saveModalVisible}
        onOk={handleSaveConfirm}
        onCancel={() => {
          setSaveModalVisible(false);
          saveForm.resetFields();
        }}
      >
        <Form form={saveForm} layout="vertical">
          <Form.Item
            label="流程名称"
            name="name"
            rules={[{ required: true, message: '请输入流程名称' }]}
          >
            <Input placeholder="例如: Maven构建+SSH部署" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="流程功能描述" />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select placeholder="选择流程分类">
              <Select.Option value="build">构建</Select.Option>
              <Select.Option value="deploy">部署</Select.Option>
              <Select.Option value="test">测试</Select.Option>
              <Select.Option value="notification">通知</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 加载流程弹窗 */}
      <Modal
        title="加载流程"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
        width={600}
      >
        {workflows.length === 0 ? (
          <Empty description="暂无已保存的流程" />
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                  onClick={() => handleLoadWorkflow(workflow)}
                  onMouseEnter={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.style.borderColor = '#1890ff';
                      parent.style.background = '#f0f5ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.style.borderColor = '#d9d9d9';
                      parent.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {workflow.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {workflow.description || '暂无描述'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#bfbfbf', marginTop: '4px' }}>
                    更新时间: {new Date(workflow.updateTime).toLocaleString()}
                  </div>
                </div>
                <Popconfirm
                  title="确认删除"
                  description={`确定要删除流程 "${workflow.name}" 吗？`}
                  onConfirm={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 编辑流程信息弹窗 */}
      <Modal
        title={`编辑流程信息 - ${currentWorkflow?.name || ''}`}
        open={editModalVisible}
        onOk={handleEditInfoConfirm}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="流程名称">
            <Input value={currentWorkflow?.name} disabled />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="流程功能描述" />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select placeholder="选择流程分类">
              <Select.Option value="build">构建</Select.Option>
              <Select.Option value="deploy">部署</Select.Option>
              <Select.Option value="test">测试</Select.Option>
              <Select.Option value="notification">通知</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Flow;
