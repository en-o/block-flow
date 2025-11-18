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
import { Button, Input, Form, Select, message as antdMessage, Modal, Empty, Spin } from 'antd';
import { SaveOutlined, PlayCircleOutlined, DownloadOutlined, FolderOpenOutlined } from '@ant-design/icons';
import BlockNode, { type BlockNodeData } from '../../components/BlockNode';
import { blockApi } from '../../api/block';
import { workflowApi } from '../../api/workflow';
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
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [saveForm] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 加载块库
  useEffect(() => {
    loadBlocks();
  }, []);

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
  }, []);

  // 保存流程
  const handleSave = async () => {
    setSaveModalVisible(true);
    if (currentWorkflow) {
      saveForm.setFieldsValue({
        name: currentWorkflow.name,
        description: currentWorkflow.description,
        category: currentWorkflow.category,
      });
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

      if (currentWorkflow) {
        // 更新现有流程
        await workflowApi.update({
          id: currentWorkflow.id,
          ...values,
          flowDefinition,
        });
        antdMessage.success('流程更新成功');
      } else {
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
          <a href="/manage">管理后台</a>
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
              </Form>
            ) : (
              <Empty description="选择节点查看属性" />
            )}
          </div>
        </div>
      </div>

      <div className="flow-footer">
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
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleLoadWorkflow(workflow)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.background = '#f0f5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.background = 'transparent';
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
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Flow;
