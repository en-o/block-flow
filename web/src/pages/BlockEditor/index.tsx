import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Radio,
  InputNumber,
  Divider,
  message,
  Card,
  Space,
  Modal,
  Tooltip,
  Tag,
  Alert,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined, ThunderboltOutlined, QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import Editor from '@monaco-editor/react';
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import { pythonEnvApi } from '../../api/pythonEnv';
import type { Block, BlockType, BlockCreateDTO, BlockUpdateDTO, PythonEnvironment } from '../../types/api';
import { initCustomBlocks } from '../../utils/blocklyCustomBlocks';
import './index.css';

const BlockEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const [block, setBlock] = useState<Block | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [pythonEnvs, setPythonEnvs] = useState<PythonEnvironment[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [topTags, setTopTags] = useState<string[]>([]);
  const [definitionMode, setDefinitionMode] = useState<'BLOCKLY' | 'CODE'>('CODE');
  const [scriptCode, setScriptCode] = useState<string>(`# -*- coding: utf-8 -*-
# Block执行脚本模板
#
# 输入参数使用说明:
# - 通过 inputs 字典获取输入参数
# - 示例: name = inputs.get('name', '默认值')
# - 示例: count = safe_int(inputs.get('count'), 0)  # 使用安全转换函数
#
# 上下文变量使用说明:
# - 系统自动注入所有上下文变量，格式: ctx.变量名
# - 示例: db_host = inputs.get('ctx.DB_HOST', 'localhost')
# - 示例: db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
# - 上下文变量在"上下文变量管理"配置，测试和执行时自动注入
#
# 输出结果使用说明:
# - 将结果赋值给 outputs 变量(必须是字典类型)
# - 示例: outputs = {"result": "success", "data": result_data}
# - 系统会自动转换为JSON格式返回
#
# 注意事项:
# - 所有异常会被自动捕获并返回错误信息
# - 可以使用已安装在Python环境中的第三方库
# - 执行超时时间为60秒
# - **重要**: inputs中的所有值都是字符串或对象，数字需要转换
# - **重要**: 空字符串会导致类型转换失败，使用安全转换函数

# ========== 安全类型转换函数（处理空值、None、类型错误） ==========

def safe_int(value, default=0):
    """安全地转换为整数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """安全地转换为浮点数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# ========== 获取输入参数 ==========

# 1. 字符串类型（无需转换）
# param1 = inputs.get('param1', '')

# 2. 数字类型（使用安全转换函数）
# param2 = safe_int(inputs.get('param2'), 0)
# param3 = safe_float(inputs.get('param3'), 0.0)

# 3. 布尔类型（使用安全转换函数）
# param4 = safe_bool(inputs.get('param4'), False)

# 4. 上下文变量（自动注入，使用安全转换）
# user_name = inputs.get('ctx.USER_NAME', '默认用户')
# db_host = inputs.get('ctx.DB_HOST', 'localhost')
# db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)

# ========== 执行业务逻辑 ==========

# 示例:
# result = f"Hello {param1}, count: {param2}"

# ========== 设置输出结果（必需） ==========

outputs = {
    "success": True,
    "message": "执行成功",
    # "data": result  # 添加您的结果数据
}
`);
  const [loading, setLoading] = useState(false);
  const [inputParams, setInputParams] = useState<Array<{ name: string; type: string; defaultValue: string; description: string }>>([]);
  const [outputParams, setOutputParams] = useState<Array<{ name: string; type: string; description: string }>>([]);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  // 使用 ref 存储最新的参数，解决闭包问题
  const inputParamsRef = useRef<Array<{ name: string; type: string; defaultValue: string; description: string }>>([]);
  const outputParamsRef = useRef<Array<{ name: string; type: string; description: string }>>([]);

  // 同步 inputParams 到 ref
  useEffect(() => {
    inputParamsRef.current = inputParams;
  }, [inputParams]);

  // 同步 outputParams 到 ref
  useEffect(() => {
    outputParamsRef.current = outputParams;
  }, [outputParams]);

  // 保存切换到可视化模式前的原始代码（用于恢复）
  const [originalScriptCode, setOriginalScriptCode] = useState<string>('');

  // Monaco Editor 挂载时的处理函数
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 注册代码提示提供器
    monaco.languages.registerCompletionItemProvider('python', {
      triggerCharacters: ['(', '.', "'", '"', '_'],  // 触发字符
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const line = model.getLineContent(position.lineNumber);
        const textBeforeCursor = line.substring(0, position.column - 1);

        const suggestions: any[] = [];

        // 1. 检测 inputs.get( - 提示输入参数
        if (textBeforeCursor.endsWith('inputs.get(')) {
          inputParamsRef.current.forEach((param) => {
            suggestions.push({
              label: `'${param.name}'`,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: `'${param.name}', ${getDefaultValueForType(param.type, param.defaultValue)}`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: `输入参数 (${param.type})`,
              documentation: param.description || `${param.name} - ${param.type}类型`,
              range: range,
            });
          });
        }

        // 2. 检测 outputs = { 或 outputs[""] - 提示输出参数
        if (textBeforeCursor.match(/outputs\s*=\s*\{/) || textBeforeCursor.match(/outputs\[['"]$/)) {
          outputParamsRef.current.forEach((param) => {
            suggestions.push({
              label: param.name,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: `"${param.name}": `,
              detail: `输出参数 (${param.type})`,
              documentation: param.description || `${param.name} - ${param.type}类型`,
              range: range,
            });
          });
        }

        // 3. 检测 inputs.get('ctx. - 提示上下文变量
        if (textBeforeCursor.match(/inputs\.get\(\s*['"]ctx\.$/)) {
          // 这里可以添加从后端获取的上下文变量列表
          // 目前提供常见的上下文变量示例
          const contextVarExamples = [
            { name: 'DB_HOST', type: 'string', desc: '数据库主机' },
            { name: 'DB_PORT', type: 'number', desc: '数据库端口' },
            { name: 'API_KEY', type: 'string', desc: 'API密钥' },
            { name: 'USER_NAME', type: 'string', desc: '用户名' },
          ];

          contextVarExamples.forEach((ctx) => {
            suggestions.push({
              label: `ctx.${ctx.name}`,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: `ctx.${ctx.name}', ${ctx.type === 'number' ? '0' : "''"}`,
              detail: `上下文变量 (${ctx.type})`,
              documentation: ctx.desc,
              range: range,
            });
          });
        }

        // 4. 提供安全转换函数的代码片段
        if (textBeforeCursor.match(/\bsafe_\w*$/)) {
          suggestions.push(
            {
              label: 'safe_int',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'safe_int(inputs.get(\'${1:param_name}\'), ${2:0})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: '安全转换为整数',
              documentation: '安全地将输入转换为整数，处理空值和无效值',
              range: range,
            },
            {
              label: 'safe_float',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'safe_float(inputs.get(\'${1:param_name}\'), ${2:0.0})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: '安全转换为浮点数',
              documentation: '安全地将输入转换为浮点数，处理空值和无效值',
              range: range,
            },
            {
              label: 'safe_bool',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'safe_bool(inputs.get(\'${1:param_name}\'), ${2:False})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: '安全转换为布尔值',
              documentation: '安全地将输入转换为布尔值',
              range: range,
            }
          );
        }

        // 5. 提供 inputs. 的智能提示
        if (textBeforeCursor.endsWith('inputs.')) {
          suggestions.push({
            label: 'get',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'get(\'${1:param_name}\', ${2:\'\'})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: '获取输入参数',
            documentation: '从inputs字典中获取参数值，支持默认值',
            range: range,
          });
        }

        // 6. 提供 outputs 的智能提示 - 快速创建输出字典
        if (word.word === 'outputs' || textBeforeCursor.endsWith('output')) {
          const outputSnippet = outputParamsRef.current.length > 0
            ? `outputs = {\n\t${outputParamsRef.current.map((p, i) => `"${p.name}": \${${i + 1}:value}`).join(',\n\t')}\n}`
            : 'outputs = {\n\t"success": ${1:True},\n\t"${2:result}": ${3:None}\n}';

          suggestions.push({
            label: 'outputs (完整)',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: outputSnippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: '输出字典（根据配置的输出参数生成）',
            documentation: '自动生成包含所有配置的输出参数的outputs字典',
            range: range,
          });
        }

        return { suggestions };
      },
    });
  };

  // 根据参数类型返回合适的默认值
  const getDefaultValueForType = (type: string, defaultValue: string) => {
    if (defaultValue) {
      return type === 'string' ? `'${defaultValue}'` : defaultValue;
    }
    switch (type) {
      case 'number':
        return '0';
      case 'boolean':
        return 'False';
      case 'object':
        return '{}';
      default:
        return "''";
    }
  };


  // 加载块类型和Python环境
  useEffect(() => {
    loadBlockTypes();
    loadPythonEnvs();
    loadTagsStatistics();
    // 初始化自定义Blockly块
    initCustomBlocks();
  }, []);

  // 加载块详情（编辑模式）
  useEffect(() => {
    if (id) {
      loadBlock(Number(id));
    }
  }, [id]);

  // 初始化 Blockly 工作区
  useEffect(() => {
    // 清理旧的workspace
    if (workspaceRef.current) {
      try {
        workspaceRef.current.dispose();
      } catch (error) {
        console.error('清理Blockly workspace失败', error);
      }
      workspaceRef.current = null;
    }

    // 如果是BLOCKLY模式，创建新的workspace
    if (definitionMode === 'BLOCKLY') {
      // 使用setTimeout确保DOM已渲染
      const timer = setTimeout(() => {
        if (blocklyDivRef.current && !workspaceRef.current) {
          try {
            console.log('🔧 初始化Blockly workspace...');
            workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
              toolbox: getBlocklyToolbox(),
              grid: {
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true,
              },
              zoom: {
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
              },
              trashcan: true,
            });
            console.log('✅ Blockly workspace初始化成功');

            // 如果有已保存的Blockly定义，加载它
            if (block?.blocklyDefinition) {
              try {
                const xml = Blockly.utils.xml.textToDom(block.blocklyDefinition);
                Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
                console.log('✅ 已加载Blockly定义');
              } catch (error) {
                console.error('❌ 加载Blockly定义失败', error);
              }
            } else {
              console.log('💡 显示空白工作区（当前块没有blocklyDefinition）');
            }
          } catch (error) {
            console.error('初始化Blockly失败', error);
            message.error('初始化可视化编辑器失败，请查看控制台');
          }
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (workspaceRef.current) {
          try {
            workspaceRef.current.dispose();
          } catch (error) {
            console.error('清理Blockly workspace失败', error);
          }
          workspaceRef.current = null;
        }
      };
    }
  }, [definitionMode, block?.blocklyDefinition]);

  const loadBlockTypes = async () => {
    try {
      const response = await blockTypeApi.page({
        page: { pageNum: 0, pageSize: 100 },
      });
      if (response.code === 200 && response.data?.rows) {
        setBlockTypes(response.data.rows);
      }
    } catch (error) {
      console.error('加载块类型失败', error);
    }
  };

  const loadPythonEnvs = async () => {
    try {
      const response = await pythonEnvApi.listAll();
      if (response.code === 200 && response.data) {
        setPythonEnvs(response.data);
      }
    } catch (error) {
      console.error('加载Python环境失败', error);
    }
  };

  const loadTagsStatistics = async () => {
    try {
      const response = await blockApi.getTagsStatistics();
      if (response.code === 200 && response.data) {
        // 转换为数组并按使用次数排序
        const tagEntries = Object.entries(response.data).sort((a, b) => b[1] - a[1]);
        const tags = tagEntries.map(([tag]) => tag);
        setAllTags(tags);
        // 取前3个最常用的标签
        setTopTags(tags.slice(0, 3));
      }
    } catch (error) {
      console.error('加载标签统计失败', error);
    }
  };

  const loadBlock = async (blockId: number) => {
    try {
      setLoading(true);
      const response = await blockApi.getById(blockId);
      if (response.code === 200 && response.data) {
        const blockData = response.data;
        setBlock(blockData);
        setDefinitionMode(blockData.definitionMode || 'CODE');
        setScriptCode(blockData.script || '');

        // 填充表单
        form.setFieldsValue({
          name: blockData.name,
          typeCode: blockData.typeCode,
          description: blockData.description,
          color: blockData.color,
          icon: blockData.icon,
          version: blockData.version,
          pythonEnvId: blockData.pythonEnvId,
          tags: blockData.tags || [],
          isPublic: blockData.isPublic,
        });

        // 加载输入参数配置
        if (blockData.inputs && typeof blockData.inputs === 'object') {
          const params = Object.entries(blockData.inputs).map(([name, config]: [string, any]) => ({
            name,
            type: config.type || 'string',
            defaultValue: config.defaultValue || '',
            description: config.description || '',
          }));
          setInputParams(params);
        }

        // 加载输出参数配置
        if (blockData.outputs && typeof blockData.outputs === 'object') {
          const params = Object.entries(blockData.outputs).map(([name, config]: [string, any]) => ({
            name,
            type: config.type || 'string',
            description: config.description || '',
          }));
          setOutputParams(params);
        }

        // 如果有 Blockly 定义，加载到工作区
        if (blockData.blocklyDefinition && workspaceRef.current) {
          const xml = Blockly.utils.xml.textToDom(blockData.blocklyDefinition);
          Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
        }
      }
    } catch (error) {
      console.error('加载块详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getBlocklyToolbox = () => {
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Python输入/输出',
          colour: '#1890ff',
          contents: [
            { kind: 'block', type: 'python_input_get' },
            { kind: 'block', type: 'python_output_set' },
            { kind: 'block', type: 'python_print' },
            { kind: 'block', type: 'safe_int' },
            { kind: 'block', type: 'safe_float' },
            { kind: 'block', type: 'safe_bool' },
          ],
        },
        {
          kind: 'category',
          name: '字典操作',
          colour: '#722ED1',
          contents: [
            { kind: 'block', type: 'dict_create' },
            { kind: 'block', type: 'dict_set' },
            { kind: 'block', type: 'dict_get' },
          ],
        },
        {
          kind: 'category',
          name: '列表操作',
          colour: '#52C41A',
          contents: [
            { kind: 'block', type: 'lists_create_with' },
            { kind: 'block', type: 'lists_create_empty' },
            { kind: 'block', type: 'list_append' },
            { kind: 'block', type: 'lists_getIndex' },
            { kind: 'block', type: 'lists_setIndex' },
            { kind: 'block', type: 'lists_length' },
          ],
        },
        {
          kind: 'category',
          name: '文件操作',
          colour: '#13C2C2',
          contents: [
            { kind: 'block', type: 'file_read' },
            { kind: 'block', type: 'file_write' },
          ],
        },
        {
          kind: 'category',
          name: 'HTTP请求',
          colour: '#FA8C16',
          contents: [
            { kind: 'block', type: 'http_request' },
            { kind: 'block', type: 'json_parse' },
            { kind: 'block', type: 'json_stringify' },
          ],
        },
        {
          kind: 'category',
          name: '逻辑',
          colour: '#5C7CFA',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
            { kind: 'block', type: 'logic_null' },
          ],
        },
        {
          kind: 'category',
          name: '循环',
          colour: '#52C41A',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
            { kind: 'block', type: 'controls_forEach' },
            { kind: 'block', type: 'controls_flow_statements' },
          ],
        },
        {
          kind: 'category',
          name: '数学',
          colour: '#FA8C16',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
            { kind: 'block', type: 'math_trig' },
            { kind: 'block', type: 'math_constant' },
            { kind: 'block', type: 'math_round' },
            { kind: 'block', type: 'math_modulo' },
          ],
        },
        {
          kind: 'category',
          name: '文本',
          colour: '#722ED1',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_append' },
            { kind: 'block', type: 'text_length' },
            { kind: 'block', type: 'text_isEmpty' },
            { kind: 'block', type: 'text_indexOf' },
            { kind: 'block', type: 'text_charAt' },
            { kind: 'block', type: 'text_print' },
          ],
        },
        {
          kind: 'category',
          name: '变量',
          colour: '#A0522D',
          custom: 'VARIABLE',
        },
        {
          kind: 'category',
          name: '函数',
          colour: '#9966FF',
          custom: 'PROCEDURE',
        },
      ],
    };
  };

  const handleModeChange = (mode: 'BLOCKLY' | 'CODE') => {
    if (mode === 'CODE' && definitionMode === 'BLOCKLY') {
      // 从Blockly切换回代码模式：恢复原始代码
      console.log('从可视化模式切换回代码模式，恢复原始代码');

      if (originalScriptCode) {
        setScriptCode(originalScriptCode);
        message.info('已恢复原始代码（可视化编辑未保存）');
      }

      setDefinitionMode(mode);
    } else if (mode === 'BLOCKLY' && definitionMode === 'CODE') {
      // 从代码模式切换到可视化模式：保存原始代码
      console.log('切换到可视化模式（预览功能，不保存）');

      // 保存当前代码
      setOriginalScriptCode(scriptCode);

      // 切换模式
      setDefinitionMode(mode);

      // 如果有代码，尝试转换
      if (scriptCode && scriptCode.trim().length > 0) {
        message.info('🧪 正在尝试将代码转换为可视化块（预览模式，不保存）...', 2);
        // 延迟调用转换，等待Blockly初始化
        setTimeout(() => {
          handleConvertCodeToBlockly();
        }, 400);
      }
    } else {
      setDefinitionMode(mode);
    }
  };

  // 尝试将Python代码转换为Blockly块（实验性功能）
  const handleConvertCodeToBlockly = () => {
    console.log('🧪 开始尝试转换Python代码到Blockly');
    console.log('当前代码:', scriptCode);

    try {
      if (!workspaceRef.current) {
        console.error('❌ Blockly workspace未初始化');
        message.error('可视化编辑器未就绪，请重试');
        return;
      }

      const workspace = workspaceRef.current;
      workspace.clear(); // 清空工作区

      // 解析代码并转换为块
      const lines = scriptCode.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      let convertedCount = 0;
      let skippedCount = 0;
      let yPosition = 50; // 初始Y坐标

      console.log('📝 准备转换', lines.length, '行代码');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`处理第 ${i + 1} 行:`, line);

        let block = null;

        // 1. inputs.get() with safe_int/int conversion: a = safe_int(inputs.get('a'), 0)
        const safeIntInputMatch = line.match(/^(\w+)\s*=\s*(?:safe_int|int)\s*\(\s*inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*[^)]+)?\s*\)\s*(?:,\s*([^)]+))?\s*\)$/);
        if (safeIntInputMatch) {
          console.log('✅ 识别为 safe_int/int(inputs.get(...))');
          block = workspace.newBlock('variables_set');
          block.setFieldValue(safeIntInputMatch[1], 'VAR');

          // Create safe_int block
          const safeIntBlock = workspace.newBlock('safe_int');

          // Create python_input_get block
          const inputGetBlock = workspace.newBlock('python_input_get');
          const paramNameBlock = workspace.newBlock('text');
          paramNameBlock.setFieldValue(safeIntInputMatch[2], 'TEXT');
          inputGetBlock.getInput('PARAM_NAME')?.connection?.connect(paramNameBlock.outputConnection!);

          // Connect input_get to safe_int
          safeIntBlock.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

          // Connect safe_int to variable
          block.getInput('VALUE')?.connection?.connect(safeIntBlock.outputConnection!);

          paramNameBlock.initSvg();
          paramNameBlock.render();
          inputGetBlock.initSvg();
          inputGetBlock.render();
          safeIntBlock.initSvg();
          safeIntBlock.render();
          convertedCount++;
        }
        // 2. Simple inputs.get(): variable = inputs.get('param', 'default')
        else if (line.match(/^(\w+)\s*=\s*inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)$/)) {
          const match = line.match(/^(\w+)\s*=\s*inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)$/);
          if (match) {
            console.log('✅ 识别为 inputs.get(...)');
            block = workspace.newBlock('variables_set');
            block.setFieldValue(match[1], 'VAR');

            const inputGetBlock = workspace.newBlock('python_input_get');
            const paramNameBlock = workspace.newBlock('text');
            paramNameBlock.setFieldValue(match[2], 'TEXT');
            inputGetBlock.getInput('PARAM_NAME')?.connection?.connect(paramNameBlock.outputConnection!);

            block.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

            paramNameBlock.initSvg();
            paramNameBlock.render();
            inputGetBlock.initSvg();
            inputGetBlock.render();
            convertedCount++;
          }
        }
        // 3. Math operations: result = a + b, result = a * b, etc.
        else if (line.match(/^(\w+)\s*=\s*(\w+)\s*([\+\-\*\/])\s*(\w+)$/)) {
          const match = line.match(/^(\w+)\s*=\s*(\w+)\s*([\+\-\*\/])\s*(\w+)$/);
          if (match) {
            const opMap: Record<string, string> = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
            console.log(`✅ 识别为数学运算 (${match[3]})`);

            block = workspace.newBlock('variables_set');
            block.setFieldValue(match[1], 'VAR');

            const mathBlock = workspace.newBlock('math_arithmetic');
            mathBlock.setFieldValue(opMap[match[3]], 'OP');

            // Create variable blocks for operands
            const varA = workspace.newBlock('variables_get');
            varA.setFieldValue(match[2], 'VAR');
            const varB = workspace.newBlock('variables_get');
            varB.setFieldValue(match[4], 'VAR');

            mathBlock.getInput('A')?.connection?.connect(varA.outputConnection!);
            mathBlock.getInput('B')?.connection?.connect(varB.outputConnection!);
            block.getInput('VALUE')?.connection?.connect(mathBlock.outputConnection!);

            varA.initSvg();
            varA.render();
            varB.initSvg();
            varB.render();
            mathBlock.initSvg();
            mathBlock.render();
            convertedCount++;
          }
        }
        // 4. Dictionary creation: outputs = { "key": value, ... }
        else if (line.match(/^(\w+)\s*=\s*\{[^}]*\}$/)) {
          const match = line.match(/^(\w+)\s*=\s*\{/);
          if (match) {
            console.log('✅ 识别为字典创建');
            block = workspace.newBlock('variables_set');
            block.setFieldValue(match[1], 'VAR');

            const dictBlock = workspace.newBlock('dict_create');
            block.getInput('VALUE')?.connection?.connect(dictBlock.outputConnection!);

            dictBlock.initSvg();
            dictBlock.render();
            convertedCount++;
          }
        }
        // 5. Multi-argument print with f-string or concatenation (simplified)
        else if (line.match(/^print\s*\([^)]+\)$/)) {
          console.log('✅ 识别为 print 语句（多参数或复杂）');
          block = workspace.newBlock('python_print');

          // Extract content between print( and )
          const content = line.match(/^print\s*\((.+)\)$/)?.[1];
          if (content) {
            // Create a text block with the content (simplified)
            const textBlock = workspace.newBlock('text');
            // Remove quotes if it's a simple string
            const cleanContent = content.replace(/^['"]|['"]$/g, '');
            textBlock.setFieldValue(cleanContent, 'TEXT');
            block.getInput('TEXT')?.connection?.connect(textBlock.outputConnection!);
            textBlock.initSvg();
            textBlock.render();
          }
          convertedCount++;
        }
        // 6. 匹配变量赋值（字符串）
        else if (line.match(/^(\w+)\s*=\s*['"](.+?)['"]$/)) {
          const match = line.match(/^(\w+)\s*=\s*['"](.+?)['"]$/);
          if (match) {
            console.log('✅ 识别为字符串变量赋值');
            block = workspace.newBlock('variables_set');
            block.setFieldValue(match[1], 'VAR');
            const valueBlock = workspace.newBlock('text');
            valueBlock.setFieldValue(match[2], 'TEXT');
            block.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);
            valueBlock.initSvg();
            valueBlock.render();
            convertedCount++;
          }
        }
        // 7. 匹配变量赋值（数字）
        else if (line.match(/^(\w+)\s*=\s*(\d+(?:\.\d+)?)$/)) {
          const match = line.match(/^(\w+)\s*=\s*(\d+(?:\.\d+)?)$/);
          if (match) {
            console.log('✅ 识别为数字变量赋值');
            block = workspace.newBlock('variables_set');
            block.setFieldValue(match[1], 'VAR');
            const valueBlock = workspace.newBlock('math_number');
            valueBlock.setFieldValue(match[2], 'NUM');
            block.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);
            valueBlock.initSvg();
            valueBlock.render();
            convertedCount++;
          }
        }
        // 8. 匹配简单的if语句（仅识别开始）
        else if (line.match(/^if\s+.+:\s*$/)) {
          console.log('⚠️ 识别为 if 语句（但转换有限）');
          skippedCount++;
          console.log('  提示：if语句转换功能有限，建议手动构建');
        }
        // 9. 匹配简单的for循环
        else if (line.match(/^for\s+\w+\s+in\s+range\((\d+)\):\s*$/)) {
          const match = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\):\s*$/);
          if (match) {
            console.log('✅ 识别为 for 循环');
            block = workspace.newBlock('controls_repeat_ext');
            const timesBlock = workspace.newBlock('math_number');
            timesBlock.setFieldValue(match[2], 'NUM');
            block.getInput('TIMES')?.connection?.connect(timesBlock.outputConnection!);
            timesBlock.initSvg();
            timesBlock.render();
            convertedCount++;
          }
        }
        // 无法识别的语句
        else {
          console.log('❌ 无法转换此行代码');
          skippedCount++;
        }

        // 如果成功创建了块，初始化并放置
        if (block) {
          block.initSvg();
          block.render();
          block.moveBy(50, yPosition);
          yPosition += 80; // 下一个块的Y坐标
        }
      }

      console.log(`🎉 转换完成: ${convertedCount} 成功, ${skippedCount} 跳过`);

      if (convertedCount > 0) {
        message.success(`转换完成：成功 ${convertedCount} 条语句${skippedCount > 0 ? `，跳过 ${skippedCount} 条` : ''}`);
        if (skippedCount > 0) {
          message.warning('部分语句无法转换，请手动添加或调整', 5);
        }
      } else if (skippedCount > 0) {
        message.warning('未能转换任何语句，代码可能过于复杂。你可以手动添加可视化块。', 6);
      }

    } catch (error) {
      console.error('❌ 转换失败:', error);
      message.error('代码转换失败，但你可以手动添加可视化块');
    }
  };

  // 添加输入参数
  const handleAddInputParam = () => {
    setInputParams([...inputParams, { name: '', type: 'string', defaultValue: '', description: '' }]);
  };

  // 删除输入参数
  const handleRemoveInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  // 更新输入参数
  const handleUpdateInputParam = (index: number, field: string, value: string) => {
    const newParams = [...inputParams];
    (newParams[index] as any)[field] = value;
    setInputParams(newParams);
  };

  // 将输入参数数组转换为对象格式
  const buildInputsObject = useCallback(() => {
    const inputs: Record<string, any> = {};
    inputParams.forEach(param => {
      if (param.name) {
        inputs[param.name] = {
          type: param.type,
          defaultValue: param.defaultValue,
          description: param.description,
        };
      }
    });
    return inputs;
  }, [inputParams]);

  // 添加输出参数
  const handleAddOutputParam = () => {
    setOutputParams([...outputParams, { name: '', type: 'string', description: '' }]);
  };

  // 删除输出参数
  const handleRemoveOutputParam = (index: number) => {
    setOutputParams(outputParams.filter((_, i) => i !== index));
  };

  // 更新输出参数
  const handleUpdateOutputParam = (index: number, field: string, value: string) => {
    const newParams = [...outputParams];
    (newParams[index] as any)[field] = value;
    setOutputParams(newParams);
  };

  // 将输出参数数组转换为对象格式
  const buildOutputsObject = useCallback(() => {
    const outputs: Record<string, any> = {};
    outputParams.forEach(param => {
      if (param.name) {
        outputs[param.name] = {
          type: param.type,
          description: param.description,
        };
      }
    });
    return outputs;
  }, [outputParams]);

  // 打开测试弹窗
  const handleOpenTest = () => {
    // 初始化测试输入值
    const initialInputs: Record<string, any> = {};
    inputParams.forEach(param => {
      if (param.name) {
        initialInputs[param.name] = param.defaultValue || '';
      }
    });
    setTestInputs(initialInputs);
    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行测试
  const handleTest = async () => {
    if (!block) {
      message.warning('请先保存块后再进行测试');
      return;
    }

    // 在可视化模式下，需要先生成代码
    let codeToTest = scriptCode;
    if (definitionMode === 'BLOCKLY') {
      if (workspaceRef.current) {
        try {
          const pythonCode = pythonGenerator.workspaceToCode(workspaceRef.current);
          if (!pythonCode || pythonCode.trim().length === 0) {
            message.warning('可视化工作区为空，请先添加块');
            return;
          }
          codeToTest = pythonCode;
          console.log('🧪 可视化模式测试，生成的代码:', pythonCode);
          message.info('正在测试可视化模式构建的代码...', 2);
        } catch (error) {
          console.error('生成代码失败', error);
          message.error('生成代码失败，请检查可视化块是否正确');
          return;
        }
      } else {
        message.error('可视化编辑器未初始化');
        return;
      }
    }

    setTesting(true);
    setTestResult(null);

    try {
      // 使用临时代码测试（不保存块）
      const response = await blockApi.test(block.id, {
        inputs: testInputs,
        tempScript: codeToTest, // 传入临时代码用于测试
      });

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

  // 从脚本解析输入输出参数
  const handleParseScriptParameters = () => {
    if (!scriptCode) {
      message.warning('请先输入脚本代码');
      return;
    }

    // 移除注释：单行注释 (#) 和多行注释 (''' 或 """)
    let cleanScript = scriptCode
      // 移除多行字符串/注释（三引号）
      .replace(/'''[\s\S]*?'''/g, '')
      .replace(/"""[\s\S]*?"""/g, '')
      // 移除单行注释
      .split('\n')
      .map((line: string) => {
        const commentIndex = line.indexOf('#');
        return commentIndex !== -1 ? line.substring(0, commentIndex) : line;
      })
      .join('\n');

    // 解析输入参数
    const inputMatches = new Set<string>();
    const inputTypes: Record<string, string> = {};

    // 匹配 inputs.get('xxx') 或 inputs.get("xxx")
    const inputRegex = /inputs\.get\(['"]((?!ctx\.)[^'"]+)['"]/g;
    let match;
    while ((match = inputRegex.exec(cleanScript)) !== null) {
      const paramName = match[1];
      if (!paramName.startsWith('ctx.')) {
        inputMatches.add(paramName);
      }
    }

    // 推断类型
    inputMatches.forEach(paramName => {
      // 检查是否有类型转换函数
      const safeIntPattern = new RegExp(`safe_int\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const intPattern = new RegExp(`int\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const safeFloatPattern = new RegExp(`safe_float\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const floatPattern = new RegExp(`float\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);
      const safeBoolPattern = new RegExp(`safe_bool\\s*\\(\\s*inputs\\.get\\(['"](${paramName})['"]`);

      if (safeIntPattern.test(cleanScript) || intPattern.test(cleanScript)) {
        inputTypes[paramName] = 'number';
      } else if (safeFloatPattern.test(cleanScript) || floatPattern.test(cleanScript)) {
        inputTypes[paramName] = 'number';
      } else if (safeBoolPattern.test(cleanScript)) {
        inputTypes[paramName] = 'boolean';
      } else {
        inputTypes[paramName] = 'string';
      }
    });

    // 解析输出参数
    const outputMatches = new Set<string>();

    // 匹配 outputs = { "key": value, 'key': value }
    const outputsBlockRegex = /outputs\s*=\s*\{([^}]+)\}/s;
    const outputsBlock = outputsBlockRegex.exec(cleanScript);

    if (outputsBlock) {
      const outputContent = outputsBlock[1];
      // 匹配键名: "xxx" 或 'xxx'
      const keyRegex = /['"]([^'"]+)['"]\s*:/g;
      let keyMatch;
      while ((keyMatch = keyRegex.exec(outputContent)) !== null) {
        const keyName = keyMatch[1];
        if (keyName !== '_console_output') { // 排除内部使用的字段
          outputMatches.add(keyName);
        }
      }
    }

    // 转换为参数数组
    const newInputParams = Array.from(inputMatches).map(name => ({
      name,
      type: inputTypes[name] || 'string',
      defaultValue: '',
      description: ''
    }));

    const newOutputParams = Array.from(outputMatches).map(name => ({
      name,
      type: 'string',
      description: ''
    }));

    // 更新参数列表
    if (newInputParams.length > 0 || newOutputParams.length > 0) {
      setInputParams(newInputParams);
      setOutputParams(newOutputParams);
      message.success(`已解析 ${newInputParams.length} 个输入参数和 ${newOutputParams.length} 个输出参数`);
    } else {
      message.info('未从脚本中解析到输入输出参数');
    }
  };

  const handleSave = useCallback(async () => {
    try {
      // 检查是否在可视化模式
      if (definitionMode === 'BLOCKLY') {
        Modal.warning({
          title: '提示',
          content: '可视化模式仅用于预览，不能保存。请先切换回"代码模式"，然后再保存。',
          okText: '知道了',
        });
        return;
      }

      const values = await form.validateFields();

      // 验证是否有有效的脚本代码
      if (!scriptCode || scriptCode.trim().length === 0) {
        message.warning('脚本代码为空，请先编写代码');
        return;
      }

      const blockData = {
        ...values,
        definitionMode: 'CODE', // 强制使用代码模式
        blocklyDefinition: undefined, // 不保存blocklyDefinition（可视化只是预览）
        script: scriptCode, // 保存代码模式的代码
        inputs: buildInputsObject(),
        outputs: buildOutputsObject(),
      };

      console.log('准备保存的数据:', {
        definitionMode: 'CODE',
        scriptLength: scriptCode.length,
      });

      if (block) {
        // 更新块
        const updateData: BlockUpdateDTO = {
          id: block.id,
          ...blockData,
        };
        const response = await blockApi.update(updateData);
        if (response.code === 200) {
          message.success('块更新成功');
          // 重新加载当前块数据，而不是跳转
          await loadBlock(block.id);
        }
      } else {
        // 创建块
        const createData: BlockCreateDTO = blockData;
        const response = await blockApi.create(createData);
        if (response.code === 200) {
          message.success('块创建成功');
          // 创建后跳转到列表
          navigate('/manage/blocks');
        }
      }
    } catch (error) {
      console.error('保存块失败', error);
    }
  }, [form, definitionMode, scriptCode, block, buildInputsObject, buildOutputsObject, loadBlock, navigate]);

  // 监听Ctrl+S快捷键保存
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否是Ctrl+S或Cmd+S（Mac）
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认保存行为
        handleSave();
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  return (
    <div className="block-editor-container">
      <div className="block-editor-header">
        <h1>
          {block ? `编辑块: ${block.name}` : '创建新块'}
          <Button
            type="text"
            size="small"
            icon={<QuestionCircleOutlined />}
            onClick={() => setHelpModalVisible(true)}
            style={{ marginLeft: 16, color: '#1890ff' }}
          >
            类型转换规则
          </Button>
        </h1>
        <div className="header-actions">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/manage/blocks')}
            style={{ color: '#1890ff' }}
          >
            返回
          </Button>
        </div>
      </div>

      <div className="block-editor-content">
        {/* 左侧配置面板 */}
        <div className="editor-left-panel">
          <Form form={form} layout="vertical">
            <Form.Item
              label="块名称"
              name="name"
              rules={[{ required: true, message: '请输入块名称' }]}
            >
              <Input placeholder="例如: SSH文件上传" />
            </Form.Item>

            <Form.Item
              label="块类型"
              name="typeCode"
              rules={[{ required: true, message: '请选择块类型' }]}
            >
              <Select placeholder="选择块类型">
                {blockTypes.map((type) => (
                  <Select.Option key={type.code} value={type.code}>
                    {type.name} ({type.code})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input.TextArea rows={2} placeholder="块功能描述" />
            </Form.Item>

            <Form.Item label="颜色" name="color" initialValue="#5C7CFA">
              <Input type="color" />
            </Form.Item>

            <Form.Item label="图标" name="icon">
              <Input placeholder="例如: 📁 (emoji)" />
            </Form.Item>

            <Form.Item label="版本" name="version" initialValue="1.0.0">
              <Input placeholder="例如: 1.0.0" />
            </Form.Item>

            <Form.Item label="Python 环境" name="pythonEnvId" tooltip="选择运行此块的Python环境">
              <Select
                placeholder="选择Python环境 (可选)"
                allowClear
                showSearch
                optionFilterProp="label"
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ padding: '8px', cursor: 'pointer' }} onClick={() => {
                      window.open('/manage/python-envs', '_blank');
                    }}>
                      <PlusOutlined /> 管理Python环境
                    </div>
                  </>
                )}
              >
                {pythonEnvs.map((env) => (
                  <Select.Option key={env.id} value={env.id} label={`${env.name} (${env.pythonVersion})`}>
                    {env.name} <span style={{ color: '#999', fontSize: 12 }}>({env.pythonVersion})</span>
                    {env.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="标签" name="tags" tooltip="输入标签名回车添加，支持选择常用标签">
              <Select
                mode="tags"
                placeholder="添加标签或选择常用标签"
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={[
                  ...topTags.map((tag) => ({
                    label: `${tag} (推荐)`,
                    value: tag,
                  })),
                  ...allTags.filter(tag => !topTags.includes(tag)).map((tag) => ({
                    label: tag,
                    value: tag,
                  })),
                ]}
              />
            </Form.Item>

            <Form.Item label="是否公开" name="isPublic" initialValue={true}>
              <Radio.Group>
                <Radio value={true}>公开</Radio>
                <Radio value={false}>私有</Radio>
              </Radio.Group>
            </Form.Item>

            <Divider />

            {/* 参数解析按钮 */}
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <Tooltip title="自动从脚本中提取输入输出参数（不包括描述）">
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={handleParseScriptParameters}
                  type="dashed"
                  block
                >
                  从脚本自动解析参数
                </Button>
              </Tooltip>
            </div>

            <Card
              size="small"
              title="输入参数配置"
              type="inner"
              style={{ marginBottom: '16px' }}
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={handleAddInputParam}
                  size="small"
                >
                  添加参数
                </Button>
              }
            >
              {inputParams.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center', margin: '8px 0' }}>
                  暂无输入参数，点击"添加参数"创建
                </p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {inputParams.map((param, index) => (
                    <div key={index} style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%' }}>
                          <Input
                            placeholder="参数名"
                            value={param.name}
                            onChange={(e) => handleUpdateInputParam(index, 'name', e.target.value)}
                            style={{ width: '120px' }}
                            size="small"
                          />
                          <Select
                            value={param.type}
                            onChange={(value) => handleUpdateInputParam(index, 'type', value)}
                            style={{ width: '80px' }}
                            size="small"
                          >
                            <Select.Option value="string">字符串</Select.Option>
                            <Select.Option value="number">数字</Select.Option>
                            <Select.Option value="boolean">布尔</Select.Option>
                            <Select.Option value="object">对象</Select.Option>
                          </Select>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveInputParam(index)}
                            size="small"
                          />
                        </Space>
                        <Input
                          placeholder="默认值"
                          value={param.defaultValue}
                          onChange={(e) => handleUpdateInputParam(index, 'defaultValue', e.target.value)}
                          size="small"
                        />
                        <Input
                          placeholder="描述"
                          value={param.description}
                          onChange={(e) => handleUpdateInputParam(index, 'description', e.target.value)}
                          size="small"
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card
              size="small"
              title="输出参数配置"
              type="inner"
              style={{ marginBottom: '16px' }}
              extra={
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={handleAddOutputParam}
                  size="small"
                >
                  添加参数
                </Button>
              }
            >
              {outputParams.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center', margin: '8px 0' }}>
                  暂无输出参数，点击"添加参数"创建
                </p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {outputParams.map((param, index) => (
                    <div key={index} style={{ marginBottom: '12px', padding: '8px', background: '#fafafa', borderRadius: '4px' }}>
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%' }}>
                          <Input
                            placeholder="参数名"
                            value={param.name}
                            onChange={(e) => handleUpdateOutputParam(index, 'name', e.target.value)}
                            style={{ width: '120px' }}
                            size="small"
                          />
                          <Select
                            value={param.type}
                            onChange={(value) => handleUpdateOutputParam(index, 'type', value)}
                            style={{ width: '80px' }}
                            size="small"
                          >
                            <Select.Option value="string">字符串</Select.Option>
                            <Select.Option value="number">数字</Select.Option>
                            <Select.Option value="boolean">布尔</Select.Option>
                            <Select.Option value="object">对象</Select.Option>
                          </Select>
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveOutputParam(index)}
                            size="small"
                          />
                        </Space>
                        <Input
                          placeholder="描述"
                          value={param.description}
                          onChange={(e) => handleUpdateOutputParam(index, 'description', e.target.value)}
                          size="small"
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Form>
        </div>

        {/* 右侧编辑器工作区 */}
        <div className="editor-workspace">
          <div className="mode-toggle">
            <span>定义模式:</span>
            <Radio.Group
              value={definitionMode}
              onChange={(e) => handleModeChange(e.target.value)}
            >
              <Radio.Button value="CODE">代码模式</Radio.Button>
              <Radio.Button value="BLOCKLY">
                可视化模式
                <Tooltip title="预览模式：尝试将代码转换为可视化块进行查看，仅供参考，不保存">
                  <WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} />
                </Tooltip>
              </Radio.Button>
            </Radio.Group>
            {definitionMode === 'BLOCKLY' && (
              <Tooltip title="可视化模式仅用于预览测试，不保存。切换回代码模式时会恢复原始代码。">
                <Tag color="orange" icon={<WarningOutlined />} style={{ marginLeft: 8 }}>
                  预览模式 - 不保存
                </Tag>
              </Tooltip>
            )}
          </div>

          <div className="workspace-content">
            {definitionMode === 'BLOCKLY' ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 预览模式提示 */}
                <div style={{
                  background: '#fff7e6',
                  border: '1px solid #ffd591',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  margin: '0 0 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <WarningOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
                  <span style={{ fontSize: '13px', color: '#595959' }}>
                    <strong>预览模式：</strong>可视化编辑仅用于预览测试，不会保存。切换回代码模式时会自动恢复原始代码。
                  </span>
                </div>
                <div ref={blocklyDivRef} className="blockly-editor" style={{ flex: 1 }} />
              </div>
            ) : (
              <div className="code-editor">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  value={scriptCode}
                  onChange={(value) => setScriptCode(value || '')}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: {
                      other: true,
                      comments: false,
                      strings: true,
                    },
                    parameterHints: {
                      enabled: true,
                    },
                    suggest: {
                      showWords: false,
                      showSnippets: true,
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="block-editor-footer">
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
          >
            保存块
          </Button>
          <Tag color="blue" style={{ fontSize: 12 }}>Ctrl+S 快捷保存</Tag>
          {block && (
            <Tooltip title="测试运行当前块">
              <Button
                icon={<PlayCircleOutlined />}
                onClick={handleOpenTest}
                size="large"
              >
                测试运行
              </Button>
            </Tooltip>
          )}
          <Button onClick={() => navigate('/manage/blocks')} size="large">
            取消
          </Button>
        </Space>
      </div>

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
          {inputParams.length === 0 ? (
            <p style={{ color: '#999' }}>该块没有配置输入参数</p>
          ) : (
            <div>
              {inputParams.map((param) => (
                <div key={param.name} style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{param.name}</strong>
                    <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                      ({param.type})
                    </span>
                    {param.description && (
                      <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                        - {param.description}
                      </span>
                    )}
                  </div>
                  <Input
                    value={testInputs[param.name] || ''}
                    onChange={(e) => setTestInputs({ ...testInputs, [param.name]: e.target.value })}
                    placeholder={`请输入 ${param.name}`}
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
              {!testResult.success && (
                <>
                  {/* 友好错误提示 */}
                  {testResult.friendlyMessage && (
                    <div style={{ marginTop: 12 }}>
                      <Alert
                        message={testResult.friendlyMessage}
                        description={
                          testResult.suggestion ? (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>💡 解决建议：</div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{testResult.suggestion}</div>

                              {/* 如果是依赖缺失，提供快捷操作按钮 */}
                              {testResult.errorType === 'MODULE_NOT_FOUND' && testResult.pythonEnvId && (
                                <div style={{ marginTop: 12 }}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => {
                                      // 在线安装
                                      window.open(`/manage/python-envs?openOnlineInstall=true`, '_blank');
                                      // 离线安装
                                      // window.open(`/manage/python-envs?openPackageManagement=true`, '_blank');
                                    }}
                                  >
                                    前往Python环境管理
                                  </Button>
                                  <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: '12px' }}>
                                    或在块信息的"Python环境"字段中更换环境
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null
                        }
                        type="error"
                        showIcon
                      />
                    </div>
                  )}

                  {/* 原始错误信息（可折叠） */}
                  {(testResult.error || testResult.errorMessage) && (
                    <div style={{ marginTop: 12 }}>
                      <details>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                          🔍 查看详细错误信息
                        </summary>
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
                      </details>
                    </div>
                  )}

                  {/* stdout输出（错误时） */}
                  {testResult.stdout && (
                    <div style={{ marginTop: 12 }}>
                      <details>
                        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#fa8c16', marginBottom: 8 }}>
                          📋 查看标准输出 (stdout)
                        </summary>
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
                          {testResult.stdout}
                        </pre>
                      </details>
                    </div>
                  )}
                </>
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
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#fa8c16', marginBottom: 8 }}>
                      ⚠️ 查看错误输出 (stderr)
                    </summary>
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
                  </details>
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

      {/* 类型转换规则帮助 Modal */}
      <Modal
        title="Python 参数类型转换规则与代码提示"
        open={helpModalVisible}
        onCancel={() => setHelpModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" type="primary" onClick={() => setHelpModalVisible(false)}>
            知道了
          </Button>,
        ]}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h3>💡 智能代码提示功能</h3>
          <Card size="small" style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}>
            <strong>编辑器已启用智能代码提示！</strong>
            <br />
            <br />
            <strong>1. 输入参数提示</strong>
            <br />
            • 输入 <code>inputs.get(</code> 后按 <code>Ctrl+Space</code> 会自动提示已配置的输入参数
            <br />
            • 选择参数后会自动填充参数名和默认值
            <br />
            <br />
            <strong>2. 输出参数提示</strong>
            <br />
            • 输入 <code>outputs = {`{`}</code> 后会自动提示已配置的输出参数
            <br />
            • 输入 <code>output</code> 并按 <code>Ctrl+Space</code> 可快速生成完整的 outputs 字典
            <br />
            <br />
            <strong>3. 上下文变量提示</strong>
            <br />
            • 输入 <code>inputs.get('ctx.</code> 后会提示可用的上下文变量
            <br />
            <br />
            <strong>4. 安全转换函数</strong>
            <br />
            • 输入 <code>safe_</code> 后会提示 safe_int, safe_float, safe_bool 函数
            <br />
            • 选择后会自动生成函数调用模板
            <br />
            <br />
            <strong>快捷键：</strong>
            <br />
            • <code>Ctrl + Space</code> - 手动触发代码提示
            <br />
            • <code>Tab</code> 或 <code>Enter</code> - 选择提示项
            <br />
            • <code>Esc</code> - 关闭提示面板
          </Card>

          <Divider />

          <h3>⚠️ 重要提示</h3>
          <p>JSON传输时，所有参数都可能是字符串类型。即使前端传入数字，后端序列化后Python读取时也可能是字符串。</p>

          <Divider />

          <h3>❌ 错误的写法</h3>
          <pre style={{ background: '#fff2e8', padding: 12, borderRadius: 4, border: '1px solid #ffbb96' }}>
{`a = inputs.get('a', 0)  # ❌ 如果inputs['a']存在且是字符串，a就是字符串
b = inputs.get('b', 0)  # ❌ 默认值0不会被使用
product = a * b         # ❌ 错误：can't multiply sequence by non-int

# 空字符串问题：
a = int(inputs.get('a', 2))  # ❌ 如果a=""，会报错
# 原因：inputs.get('a', 2) 当 a 存在时返回 ""，不会使用默认值 2
# int("") 会抛出 ValueError`}
          </pre>

          <Divider />

          <h3>✅ 正确的写法（推荐使用安全转换函数）</h3>
          <pre style={{ background: '#f6ffed', padding: 12, borderRadius: 4, border: '1px solid #b7eb8f' }}>
{`def safe_int(value, default=0):
    """安全地转换为整数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    """安全地转换为浮点数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

# 使用示例：
a = safe_int(inputs.get('a'), 2)      # ✅ 空字符串返回默认值
b = safe_int(inputs.get('b'), 0)      # ✅ 无论输入是什么，都能正确处理
product = a * b                        # ✅ 正确：两个整数相乘`}
          </pre>

          <Divider />

          <h3>📖 类型转换快速参考</h3>

          <h4>1. 字符串类型（无需转换）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`name = inputs.get('name', '')`}
          </pre>

          <h4>2. 数字类型（使用安全转换函数）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`count = safe_int(inputs.get('count'), 0)
price = safe_float(inputs.get('price'), 0.0)`}
          </pre>

          <h4>3. 布尔类型（使用安全转换函数）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`enabled = safe_bool(inputs.get('enabled'), False)`}
          </pre>

          <h4>4. 上下文变量（自动注入，使用安全转换）</h4>
          <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
{`user_name = inputs.get('ctx.USER_NAME', '默认用户')
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)`}
          </pre>

          <Divider />

          <h3>🐛 常见错误和解决方案</h3>

          <Card size="small" style={{ marginBottom: 8 }}>
            <strong>TypeError: can't multiply sequence by non-int</strong>
            <br />
            <span style={{ color: '#ff4d4f' }}>原因：</span> 参数是字符串，未转换
            <br />
            <span style={{ color: '#52c41a' }}>解决：</span> 使用 <code>safe_int(inputs.get('num'), 0)</code>
          </Card>

          <Card size="small" style={{ marginBottom: 8 }}>
            <strong>ValueError: invalid literal for int() with base 10</strong>
            <br />
            <span style={{ color: '#ff4d4f' }}>原因：</span> 字符串无法转换为整数或为空字符串
            <br />
            <span style={{ color: '#52c41a' }}>解决：</span> 使用 safe_int/safe_float 函数处理
          </Card>

          <Divider />

          <h3>📝 Python 代码编辑注意事项</h3>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>1. 缩进规范</strong>
            <br />
            • Python 使用缩进表示代码块，必须保持一致（推荐 4 个空格）
            <br />
            • 不要混用 Tab 和空格，会导致 IndentationError
            <br />
            • 函数、类、循环、条件语句内部都需要缩进
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>2. 编码声明</strong>
            <br />
            • 文件首行建议添加：<code># -*- coding: utf-8 -*-</code>
            <br />
            • 确保中文和特殊字符正确显示（系统已自动处理 UTF-8 编码）
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>3. 必须定义 outputs</strong>
            <br />
            • 脚本最后必须赋值 <code>outputs</code> 变量（字典类型）
            <br />
            • 示例：<code>outputs = {`{"result": "success", "data": 123}`}</code>
            <br />
            • 如果没有输出，至少返回：<code>outputs = {`{"success": True}`}</code>
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>4. 使用 print() 调试</strong>
            <br />
            • print() 输出会单独显示在"控制台输出"区域
            <br />
            • 不会影响 outputs 的 JSON 格式化
            <br />
            • 适合输出调试信息和中间结果
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>5. 导入第三方库</strong>
            <br />
            • 只能使用已安装在 Python 环境中的库
            <br />
            • 需要先在"Python 环境管理"中安装离线包
            <br />
            • 内置库（如 os、sys、json）可直接使用
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>6. 异常处理</strong>
            <br />
            • 系统会自动捕获未处理的异常
            <br />
            • 建议对关键操作使用 try-except 进行错误处理
            <br />
            • 异常信息会在测试结果中显示
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>7. 执行时间限制</strong>
            <br />
            • 默认超时时间为 60 秒
            <br />
            • 避免死循环和耗时过长的操作
            <br />
            • 超时会自动终止并返回错误
          </Card>

          <Card size="small" style={{ marginBottom: 8, background: '#fff7e6', borderColor: '#ffd591' }}>
            <strong>8. 输出数据类型</strong>
            <br />
            • outputs 必须是可 JSON 序列化的类型
            <br />
            • 支持：字符串、数字、布尔、列表、字典、None
            <br />
            • 不支持：函数、类实例、文件对象等复杂类型
          </Card>

          <Divider />

          <h3>💡 最佳实践示例</h3>
          <pre style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, border: '1px solid #91d5ff' }}>
{`# -*- coding: utf-8 -*-
import json

# 1. 使用安全转换函数获取输入
count = safe_int(inputs.get('count'), 0)
name = inputs.get('name', 'Unknown')

# 2. 添加输入验证
if count <= 0:
    outputs = {
        "success": False,
        "error": "count 必须大于 0"
    }
else:
    # 3. 执行业务逻辑
    try:
        result = process_data(count, name)

        # 4. 使用 print 输出调试信息
        print(f"处理完成：count={count}, name={name}")

        # 5. 设置成功的输出
        outputs = {
            "success": True,
            "result": result,
            "message": f"成功处理 {count} 条数据"
        }
    except Exception as e:
        # 6. 错误处理
        print(f"错误：{str(e)}")
        outputs = {
            "success": False,
            "error": str(e)
        }
`}
          </pre>
        </div>
      </Modal>
    </div>
  );
};

export default BlockEditor;
