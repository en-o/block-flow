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
import { Button, Input, Form, Select, message, Modal, Empty, Spin, Popconfirm, Tabs, Upload, Radio, Checkbox, Dropdown, Drawer, Tag, List, Divider } from 'antd';
import { SaveOutlined, PlayCircleOutlined, DownloadOutlined, DeleteOutlined, PlusOutlined, EditOutlined, UploadOutlined, AppstoreOutlined, FolderOutlined, EyeOutlined, EyeInvisibleOutlined, FileTextOutlined, ReloadOutlined, CloseCircleOutlined } from '@ant-design/icons';
import BlockNode, { type BlockNodeData } from '../../components/BlockNode';
import { blockApi } from '../../api/block';
import { workflowApi } from '../../api/workflow';
import { workflowCategoryApi } from '../../api/workflowCategory';
import { executionApi } from '../../api/execution';
import { authUtils } from '../../utils/auth';
import type { Block, Workflow, WorkflowCategory, ExecutionLog } from '../../types/api';
import './index.css';

const nodeTypes: NodeTypes = {
  blockNode: BlockNode as any,
};

const Flow: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BlockNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [copiedNode, setCopiedNode] = useState<Node<BlockNodeData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // 本地输入值缓存，用于输入时避免频繁更新节点状态
  const [inputValuesCache, setInputValuesCache] = useState<Record<string, Record<string, any>>>({});

  // 左侧面板相关状态
  const [leftPanelTab, setLeftPanelTab] = useState<'blocks' | 'workflows'>('blocks');
  const [workflowViewType, setWorkflowViewType] = useState<'public' | 'mine'>('public');
  const [publicWorkflows, setPublicWorkflows] = useState<Workflow[]>([]);
  const [myWorkflows, setMyWorkflows] = useState<Workflow[]>([]);

  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [workflowCategories, setWorkflowCategories] = useState<WorkflowCategory[]>([]);
  const [saveForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 执行日志相关状态
  const [execLogDrawerVisible, setExecLogDrawerVisible] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [logDetail, setLogDetail] = useState<string>('');

  // 加载块库和流程分类
  useEffect(() => {
    loadBlocks();
    loadWorkflowCategories();
    loadPublicWorkflows();
    loadMyWorkflows();
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

      const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

      // Delete 或 Ctrl+X: 删除选中的节点或边
      if (event.key === 'Delete' || ((event.ctrlKey || event.metaKey) && event.key === 'x')) {
        event.preventDefault();
        if (selectedNode) {
          // 如果是 Ctrl+X，先复制再删除
          if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
            setCopiedNode(selectedNode);
            message.success('已剪切节点');
          }
          // 删除节点
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          // 同时删除与该节点相关的所有连接
          setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
          setSelectedNodeId(null);
          if (event.key === 'Delete') {
            message.success('已删除节点');
          }
        } else if (selectedEdge) {
          // 删除边
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
          setSelectedEdge(null);
          message.success('已删除连接');
        }
      }

      // Ctrl+C: 复制选中的节点
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        if (selectedNode) {
          setCopiedNode(selectedNode);
          message.success('已复制节点');
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
          setSelectedNodeId(newNode.id);
          message.success('已粘贴节点');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, selectedEdge, copiedNode, nodes, setNodes, setEdges]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const response = await blockApi.pageFlow({
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

  const loadWorkflowCategories = async () => {
    try {
      const response = await workflowCategoryApi.listAll();
      if (response.code === 200 && response.data) {
        // 按sortOrder排序
        const sortedCategories = response.data.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setWorkflowCategories(sortedCategories);
      }
    } catch (error) {
      console.error('加载流程分类失败', error);
    }
  };

  // 加载公共流程
  const loadPublicWorkflows = async () => {
    try {
      const response = await workflowApi.pagePublic({
        page: { pageNum: 0, pageSize: 50 },
      });
      if (response.code === 200 && response.data?.rows) {
        setPublicWorkflows(response.data.rows);
      }
    } catch (error) {
      console.error('加载公共流程失败', error);
    }
  };

  // 加载我的流程
  const loadMyWorkflows = async () => {
    try {
      const response = await workflowApi.page({
        page: { pageNum: 0, pageSize: 50 },
      });
      if (response.code === 200 && response.data?.rows) {
        setMyWorkflows(response.data.rows);
      }
    } catch (error) {
      console.error('加载我的流程失败', error);
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

      // 检查是否是流程拖拽
      const workflowData = event.dataTransfer.getData('application/workflow');
      if (workflowData && reactFlowBounds) {
        const workflow: Workflow = JSON.parse(workflowData);
        handleUsePublicWorkflow(workflow);
        return;
      }

      // 检查是否是块拖拽
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
            inputValues: {}, // 初始化输入值对象
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes]
  );

  // 选中节点
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdge(null); // 清除边的选择
  }, []);

  // 选中边
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNodeId(null); // 清除节点的选择
  }, []);

  // 点击画布空白处清除选择
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdge(null);
  }, []);

  // 获取当前选中的节点
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // 检测输入是否已连接
  const isInputConnected = useCallback((nodeId: string, inputName: string) => {
    return edges.some(edge =>
      edge.target === nodeId && edge.targetHandle === `input-${inputName}`
    );
  }, [edges]);

  // 更新输入值缓存（输入时）
  const updateInputCache = useCallback((nodeId: string, inputName: string, value: any) => {
    setInputValuesCache(prev => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || {}),
        [inputName]: value,
      },
    }));
  }, []);

  // 提交输入值到节点（失焦时）
  const commitInputValue = useCallback((nodeId: string, inputName: string) => {
    const cachedValue = inputValuesCache[nodeId]?.[inputName];
    if (cachedValue === undefined) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              inputValues: {
                ...(node.data.inputValues || {}),
                [inputName]: cachedValue,
              },
            },
          };
        }
        return node;
      })
    );
  }, [inputValuesCache, setNodes]);

  // 获取输入值（优先从缓存，其次从节点）
  const getInputValue = useCallback((nodeId: string, inputName: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const cachedValue = inputValuesCache[nodeId]?.[inputName];
    return cachedValue !== undefined ? cachedValue : (node?.data.inputValues?.[inputName] || '');
  }, [nodes, inputValuesCache]);

  // 根据分类code获取分类名称
  const getCategoryName = (categoryCode: string | undefined) => {
    if (!categoryCode) return null;
    const category = workflowCategories.find(c => c.code === categoryCode);
    return category ? category.name : categoryCode;
  };

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
        message.success('流程更新成功');
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
    setSelectedNodeId(null);
    message.success('已创建新流程');
  };

  // 编辑流程信息
  const handleEditInfo = () => {
    if (currentWorkflow) {
      editForm.setFieldsValue({
        description: currentWorkflow.description,
        category: currentWorkflow.category,
        isPublic: currentWorkflow.isPublic,
      });
      setEditModalVisible(true);
    } else {
      message.warning('请先加载或创建一个流程');
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
        isPublic: values.isPublic,
        flowDefinition,
      });

      // 更新本地状态
      setCurrentWorkflow({
        ...currentWorkflow,
        description: values.description,
        category: values.category,
        isPublic: values.isPublic,
      });

      message.success('流程信息更新成功');
      setEditModalVisible(false);
      editForm.resetFields();

      // 重新加载流程列表
      loadPublicWorkflows();
      loadMyWorkflows();
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
        message.success('流程保存成功');
      }

      setSaveModalVisible(false);
      saveForm.resetFields();

      // 重新加载流程列表
      loadPublicWorkflows();
      loadMyWorkflows();
    } catch (error) {
      console.error('保存流程失败', error);
    }
  };

  const handleLoadWorkflow = (workflow: Workflow) => {
    const { flowDefinition } = workflow;
    if (flowDefinition && flowDefinition.nodes && flowDefinition.edges) {
      setNodes(flowDefinition.nodes as Node<BlockNodeData>[]);
      setEdges(flowDefinition.edges as Edge[]);
      setCurrentWorkflow(workflow);
      message.success(`已加载流程: ${workflow.name}`);
    }
  };

  // 使用公共流程（创建新流程）
  const handleUsePublicWorkflow = (workflow: Workflow) => {
    const { flowDefinition } = workflow;
    if (flowDefinition && flowDefinition.nodes && flowDefinition.edges) {
      setNodes(flowDefinition.nodes as Node<BlockNodeData>[]);
      setEdges(flowDefinition.edges as Edge[]);
      // 清空当前流程（作为新流程）
      setCurrentWorkflow(null);
      message.success(`已加载公共流程 "${workflow.name}"，请保存为新流程`);
      // 自动打开保存对话框并预填充原流程的分类
      setTimeout(() => {
        saveForm.setFieldsValue({
          category: workflow.category,
        });
        setSaveModalVisible(true);
      }, 100);
    }
  };

  // 拖拽公共流程到画布
  const onDragStartWorkflow = (event: React.DragEvent, workflow: Workflow) => {
    event.dataTransfer.setData('application/workflow', JSON.stringify(workflow));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const onDropWorkflow = useCallback(
    (event: React.DragEvent) => {
      const workflowData = event.dataTransfer.getData('application/workflow');
      if (workflowData) {
        const workflow: Workflow = JSON.parse(workflowData);
        handleUsePublicWorkflow(workflow);
      }
    },
    []
  );

  // 导入流程
  const handleImportWorkflow = (file: File) => {
    console.log('开始导入流程，文件:', file.name);
    const reader = new FileReader();

    reader.onerror = () => {
      console.error('文件读取失败');
      message.error('文件读取失败，请重试');
    };

    reader.onload = (e) => {
      try {
        console.log('文件读取成功');
        const content = e.target?.result as string;
        console.log('文件内容:', content.substring(0, 200));
        const flowData = JSON.parse(content);
        console.log('解析后的数据:', flowData);

        if (!flowData.nodes || !flowData.edges) {
          console.error('流程数据格式不正确:', flowData);
          message.error('导入失败：流程文件格式不正确，必须包含nodes和edges');
          return;
        }

        console.log('流程数据验证通过，准备导入');

        // 直接导入，不使用Modal.confirm
        // 确保节点包含正确的类型
        const importedNodes = flowData.nodes.map((node: any) => ({
          ...node,
          type: node.type || 'blockNode', // 确保有类型
          data: {
            ...node.data,
            // 确保所有必要的字段都存在
            blockId: node.data?.blockId || 0,
            blockName: node.data?.blockName || '未知块',
            blockTypeCode: node.data?.blockTypeCode || 'unknown',
          },
        }));

        console.log('导入节点数量:', importedNodes.length);
        console.log('导入边数量:', flowData.edges.length);

        setNodes(importedNodes as Node<BlockNodeData>[]);
        setEdges(flowData.edges as Edge[]);
        // 清空当前流程（作为新流程）
        setCurrentWorkflow(null);
        message.success(`流程导入成功！包含 ${importedNodes.length} 个节点，请保存为新流程`);

        // 预填充分类（如果有）
        if (flowData.workflow?.category) {
          setTimeout(() => {
            saveForm.setFieldsValue({
              category: flowData.workflow.category,
            });
            setSaveModalVisible(true);
          }, 100);
        } else {
          // 自动打开保存对话框
          setTimeout(() => {
            setSaveModalVisible(true);
          }, 100);
        }
      } catch (error) {
        console.error('导入流程失败，错误详情:', error);
        message.error(`导入失败：${error instanceof Error ? error.message : '文件格式错误'}`);
      }
    };

    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  // 删除流程
  const handleDeleteWorkflow = async (workflowId: number, workflowName: string) => {
    try {
      await workflowApi.delete(workflowId);
      message.success(`流程 "${workflowName}" 删除成功`);

      // 如果删除的是当前加载的流程，清空画布
      if (currentWorkflow && currentWorkflow.id === workflowId) {
        setNodes([]);
        setEdges([]);
        setCurrentWorkflow(null);
      }

      // 重新加载流程列表
      loadPublicWorkflows();
      loadMyWorkflows();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  // 切换流程公开/私有状态
  const handleTogglePublic = async (workflowId: number, currentIsPublic: boolean, workflowName: string) => {
    try {
      await workflowApi.togglePublic(workflowId);
      const newStatus = !currentIsPublic;
      message.success(`流程 "${workflowName}" 已${newStatus ? '公开' : '设为私有'}`);

      // 重新加载我的流程列表
      loadMyWorkflows();

      // 如果当前查看的是公共流程，也刷新公共流程列表（因为状态变化可能影响公共流程列表）
      if (workflowViewType === 'public') {
        loadPublicWorkflows();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  // 执行流程
  const handleExecute = async () => {
    if (!currentWorkflow) {
      message.warning('请先保存流程后再执行');
      return;
    }

    try {
      // 使用 executionApi 执行流程
      await executionApi.execute({
        workflowId: currentWorkflow.id,
        executorUsername: '', // 后端会从JWT token中自动获取
        inputParams: undefined, // 可选的全局输入参数
      });
      message.success('流程已提交执行');
      // 自动打开执行日志抽屉
      setExecLogDrawerVisible(true);
      loadExecutionLogs();
    } catch (error) {
      console.error('执行流程失败', error);
      message.error('执行流程失败，请查看控制台');
    }
  };

  // 加载执行日志列表
  const loadExecutionLogs = async () => {
    if (!currentWorkflow) {
      message.warning('请先加载一个流程');
      return;
    }

    try {
      setLoadingLogs(true);
      const response = await executionApi.page({
        workflowId: currentWorkflow.id,
        page: { pageNum: 0, pageSize: 20 },
      });
      if (response.code === 200 && response.data?.rows) {
        setExecutionLogs(response.data.rows);
      }
    } catch (error) {
      console.error('加载执行日志失败', error);
      message.error('加载执行日志失败');
    } finally {
      setLoadingLogs(false);
    }
  };

  // 查看日志详情
  const handleViewLogDetail = async (logId: number) => {
    try {
      setSelectedLogId(logId);
      const response = await executionApi.getLogs(logId);
      if (response.code === 200 && response.data) {
        setLogDetail(response.data);
      }
    } catch (error) {
      console.error('加载日志详情失败', error);
      message.error('加载日志详情失败');
    }
  };

  // 删除执行记录
  const handleDeleteLog = async (logId: number) => {
    try {
      await executionApi.delete(logId);
      message.success('删除成功');
      loadExecutionLogs();
      if (selectedLogId === logId) {
        setSelectedLogId(null);
        setLogDetail('');
      }
    } catch (error) {
      console.error('删除执行记录失败', error);
      message.error('删除失败');
    }
  };

  // 取消执行
  const handleCancelExecution = async (logId: number) => {
    try {
      await executionApi.cancel(logId);
      message.success('已取消执行');
      loadExecutionLogs();
    } catch (error: any) {
      message.error(error.message || '取消失败');
    }
  };

  // 打开执行日志抽屉
  const handleOpenExecutionLogs = () => {
    if (!currentWorkflow) {
      message.warning('请先加载一个流程');
      return;
    }
    setExecLogDrawerVisible(true);
    loadExecutionLogs();
  };

  // 自动刷新正在运行的执行
  useEffect(() => {
    if (!execLogDrawerVisible) return;

    // 检查是否有正在运行的执行
    const hasRunning = executionLogs.some(log => log.status === 'RUNNING');

    if (hasRunning) {
      const interval = setInterval(() => {
        loadExecutionLogs();
      }, 3000); // 每3秒刷新一次

      return () => clearInterval(interval);
    }
  }, [execLogDrawerVisible, executionLogs]);

  // 根据状态获取标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'processing';
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      default:
        return 'default';
    }
  };

  // 根据状态获取标签文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return '运行中';
      case 'SUCCESS':
        return '成功';
      case 'FAILED':
        return '失败';
      case 'CANCELLED':
        return '已取消';
      default:
        return status;
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
        <p style={{ fontSize: '15px', color: '#fafafa', margin: '4px 0' }}>ctrl+x删除，ctrl+c复制，ctrl+v粘贴，ctrl+s保存</p>
        <div className="flow-actions">
          {/* 只有 ADMIN 和 USER 可以访问管理后台 */}
          {authUtils.canAccessManagement() && (
            <a href="/manage">管理后台</a>
          )}
        </div>
      </div>

      <div className="flow-content">
        {/* 左侧面板 */}
        <div className="flow-toolbox">
          <Tabs
            activeKey={leftPanelTab}
            onChange={(key) => {
              const newTab = key as 'blocks' | 'workflows';
              setLeftPanelTab(newTab);

              // 切换tab时重新加载数据
              if (newTab === 'blocks') {
                loadBlocks(); // 重新加载块库
              } else if (newTab === 'workflows') {
                // 根据当前选择的类型重新加载流程
                if (workflowViewType === 'public') {
                  loadPublicWorkflows();
                } else {
                  loadMyWorkflows();
                }
              }
            }}
            items={[
              {
                key: 'blocks',
                label: (
                  <span>
                    <AppstoreOutlined /> 块库
                  </span>
                ),
                children: (
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
                ),
              },
              {
                key: 'workflows',
                label: (
                  <span>
                    <FolderOutlined /> 流程
                  </span>
                ),
                children: (
                  <div className="toolbox-content">
                    <div style={{ padding: '8px' }}>
                      <Radio.Group
                        value={workflowViewType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setWorkflowViewType(newType);

                          // 切换公共/私有时重新加载数据
                          if (newType === 'public') {
                            loadPublicWorkflows();
                          } else {
                            loadMyWorkflows();
                          }
                        }}
                        style={{ marginBottom: '12px', width: '100%' }}
                      >
                        <Radio.Button value="public" style={{ width: '50%', textAlign: 'center' }}>
                          公共流程
                        </Radio.Button>
                        <Radio.Button value="mine" style={{ width: '50%', textAlign: 'center' }}>
                          我的流程
                        </Radio.Button>
                      </Radio.Group>

                      {workflowViewType === 'public' ? (
                        publicWorkflows.length === 0 ? (
                          <Empty description="暂无公共流程" />
                        ) : (
                          <>
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#8c8c8c', background: '#fafafa', borderRadius: '4px', margin: '0 0 12px 0' }}>
                              💡 双击流程可使用，将作为新流程保存（会保留原分类）
                            </div>
                            <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                              {publicWorkflows.map((workflow) => (
                                <Dropdown
                                  key={workflow.id}
                                  menu={{
                                    items: [
                                      {
                                        key: 'use',
                                        label: '使用此流程',
                                        onClick: () => handleUsePublicWorkflow(workflow),
                                      },
                                    ],
                                  }}
                                  trigger={['contextMenu']}
                                >
                                  <div
                                    className="workflow-item draggable"
                                    draggable
                                    onDragStart={(e) => onDragStartWorkflow(e, workflow)}
                                    onDoubleClick={() => handleUsePublicWorkflow(workflow)}
                                  >
                                    <div className="workflow-item-name">
                                      {workflow.name}
                                    </div>
                                    <div className="workflow-item-description">
                                      {workflow.description || '暂无描述'}
                                    </div>
                                    {workflow.category && (
                                      <div className="workflow-item-category">
                                        分类: {getCategoryName(workflow.category)}
                                      </div>
                                    )}
                                  </div>
                                </Dropdown>
                              ))}
                            </div>
                          </>
                        )
                      ) : (
                        myWorkflows.length === 0 ? (
                          <Empty description="暂无我的流程" />
                        ) : (
                          <>
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#8c8c8c', background: '#fafafa', borderRadius: '4px', margin: '0 0 12px 0' }}>
                              💡 单击打开流程进行编辑
                            </div>
                            <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                              {myWorkflows.map((workflow) => (
                                <div
                                  key={workflow.id}
                                  className="workflow-item"
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  <div
                                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                    onClick={() => handleLoadWorkflow(workflow)}
                                  >
                                    <div className="workflow-item-name">
                                      {workflow.name}
                                    </div>
                                    <div className="workflow-item-description">
                                      {workflow.description || '暂无描述'}
                                    </div>
                                    {workflow.category && (
                                      <div className="workflow-item-category">
                                        分类: {getCategoryName(workflow.category)}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                                    {/* 公开/私有切换按钮 */}
                                    <Button
                                      type="text"
                                      icon={workflow.isPublic ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePublic(workflow.id, workflow.isPublic, workflow.name);
                                      }}
                                      title={workflow.isPublic ? '点击设为私有' : '点击公开'}
                                      style={{
                                        padding: '0 4px',
                                        height: '20px',
                                        fontSize: '12px',
                                        color: workflow.isPublic ? '#52c41a' : '#8c8c8c'
                                      }}
                                    />

                                    {/* 删除按钮 */}
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
                                        style={{
                                          padding: '0 4px',
                                          height: '20px',
                                          fontSize: '12px'
                                        }}
                                      />
                                    </Popconfirm>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
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
                    <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                      {Object.entries(selectedNode.data.inputs).map(([name, param]: [string, any]) => {
                        const connected = isInputConnected(selectedNode.id, name);
                        const currentValue = getInputValue(selectedNode.id, name);

                        return (
                          <div key={name} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '12px' }}>{name}</strong>
                              <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                                {param.type}
                              </span>
                              {connected ? (
                                <span style={{ fontSize: '11px', color: '#52c41a', background: '#f6ffed', padding: '0 6px', borderRadius: '2px' }}>
                                  已连接
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#faad14', background: '#fffbe6', padding: '0 6px', borderRadius: '2px' }}>
                                  未连接
                                </span>
                              )}
                            </div>
                            {param.description && (
                              <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px' }}>
                                {param.description}
                              </div>
                            )}
                            {/* 未连接时显示输入框 */}
                            {!connected && (
                              <div>
                                {param.type === 'boolean' ? (
                                  <Select
                                    size="small"
                                    value={currentValue}
                                    onChange={(value) => {
                                      updateInputCache(selectedNode.id, name, value);
                                      commitInputValue(selectedNode.id, name);
                                    }}
                                    style={{ width: '100%' }}
                                    placeholder="选择布尔值"
                                  >
                                    <Select.Option value={true}>true</Select.Option>
                                    <Select.Option value={false}>false</Select.Option>
                                  </Select>
                                ) : param.type === 'number' ? (
                                  <Input
                                    size="small"
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => updateInputCache(selectedNode.id, name, e.target.value ? Number(e.target.value) : '')}
                                    onBlur={() => commitInputValue(selectedNode.id, name)}
                                    placeholder={`请输入${name}`}
                                    style={{ fontSize: '12px' }}
                                  />
                                ) : param.type === 'object' || param.type === 'array' ? (
                                  <Input.TextArea
                                    size="small"
                                    value={typeof currentValue === 'object' ? JSON.stringify(currentValue, null, 2) : currentValue}
                                    onChange={(e) => {
                                      updateInputCache(selectedNode.id, name, e.target.value);
                                    }}
                                    onBlur={() => {
                                      try {
                                        const parsed = JSON.parse(getInputValue(selectedNode.id, name));
                                        updateInputCache(selectedNode.id, name, parsed);
                                      } catch (err) {
                                        // 保持字符串格式
                                      }
                                      commitInputValue(selectedNode.id, name);
                                    }}
                                    placeholder={`请输入JSON格式的${param.type}`}
                                    rows={3}
                                    style={{ fontSize: '12px', fontFamily: 'monospace' }}
                                  />
                                ) : (
                                  <Input
                                    size="small"
                                    value={currentValue}
                                    onChange={(e) => updateInputCache(selectedNode.id, name, e.target.value)}
                                    onBlur={() => commitInputValue(selectedNode.id, name)}
                                    placeholder={`请输入${name}`}
                                    style={{ fontSize: '12px' }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
        <Button
          icon={<FileTextOutlined />}
          onClick={handleOpenExecutionLogs}
        >
          查看执行日志
        </Button>
        {currentWorkflow && (
          <Button icon={<EditOutlined />} onClick={handleEditInfo}>
            编辑流程信息
          </Button>
        )}
        <Upload
          accept=".json"
          showUploadList={false}
          beforeUpload={handleImportWorkflow}
        >
          <Button icon={<UploadOutlined />}>
            导入流程
          </Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出流程
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
              {workflowCategories.map((category) => (
                <Select.Option key={category.id} value={category.code}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isPublic" valuePropName="checked" initialValue={false}>
            <Checkbox>设为公共流程（其他用户可见并使用）</Checkbox>
          </Form.Item>
        </Form>
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
              {workflowCategories.map((category) => (
                <Select.Option key={category.id} value={category.code}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isPublic" valuePropName="checked">
            <Checkbox>设为公共流程（其他用户可见并使用）</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行日志抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>执行日志 - {currentWorkflow?.name || ''}</span>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={loadExecutionLogs}
              loading={loadingLogs}
            >
              刷新
            </Button>
          </div>
        }
        placement="right"
        width={800}
        open={execLogDrawerVisible}
        onClose={() => {
          setExecLogDrawerVisible(false);
          setSelectedLogId(null);
          setLogDetail('');
        }}
      >
        <Spin spinning={loadingLogs}>
          {executionLogs.length === 0 ? (
            <Empty description="暂无执行记录" />
          ) : (
            <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 140px)' }}>
              {/* 左侧：执行记录列表 */}
              <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
                <List
                  dataSource={executionLogs}
                  renderItem={(log) => (
                    <List.Item
                      key={log.id}
                      style={{
                        cursor: 'pointer',
                        background: selectedLogId === log.id ? '#e6f7ff' : 'transparent',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        border: selectedLogId === log.id ? '1px solid #1890ff' : '1px solid #f0f0f0',
                      }}
                      onClick={() => handleViewLogDetail(log.id)}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag color={getStatusColor(log.status)}>
                              {getStatusText(log.status)}
                            </Tag>
                            <span style={{ fontSize: '13px' }}>
                              执行于 {new Date(log.startTime).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        }
                        description={
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            <div>执行人: {log.executorUsername || '未知'}</div>
                            {log.endTime && (
                              <div>
                                耗时: {log.duration ? `${log.duration}秒` : '计算中...'}
                              </div>
                            )}
                            {log.status === 'FAILED' && log.errorMessage && (
                              <div style={{ color: '#ff4d4f', marginTop: '4px' }}>
                                错误: {log.errorMessage.substring(0, 50)}
                                {log.errorMessage.length > 50 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        }
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {log.status === 'RUNNING' && (
                          <Popconfirm
                            title="确认取消"
                            description="确定要取消此次执行吗?"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleCancelExecution(log.id);
                            }}
                            okText="确认"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<CloseCircleOutlined />}
                              onClick={(e) => e.stopPropagation()}
                              danger
                            >
                              取消
                            </Button>
                          </Popconfirm>
                        )}
                        <Popconfirm
                          title="确认删除"
                          description="确定要删除此执行记录吗？"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteLog(log.id);
                          }}
                          okText="确认"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                            danger
                          />
                        </Popconfirm>
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              {/* 右侧：日志详情 */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedLogId ? (
                  <div>
                    <Divider orientation="left">执行日志详情</Divider>
                    {logDetail ? (
                      <pre
                        style={{
                          background: '#f5f5f5',
                          padding: '16px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: 'calc(100vh - 220px)',
                          overflowY: 'auto',
                        }}
                      >
                        {logDetail}
                      </pre>
                    ) : (
                      <Spin tip="加载日志中..." />
                    )}
                  </div>
                ) : (
                  <Empty
                    description="请选择一条执行记录查看详情"
                    style={{ marginTop: '60px' }}
                  />
                )}
              </div>
            </div>
          )}
        </Spin>
      </Drawer>
    </div>
  );
};

export default Flow;
