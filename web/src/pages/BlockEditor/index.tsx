import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  Button,
  Radio,
  Divider,
  message,
  Card,
  Space,
  Modal,
  Tooltip,
  Tag,
  Alert,
  Checkbox,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined, ThunderboltOutlined, QuestionCircleOutlined, WarningOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import Editor from '@monaco-editor/react';
import '../../monaco-loader'; // Configure Monaco to use local resources
import { blockApi } from '../../api/block';
import { blockTypeApi } from '../../api/blockType';
import { pythonEnvApi } from '../../api/pythonEnv';
import type { Block, BlockType, BlockCreateDTO, BlockUpdateDTO, PythonEnvironment } from '../../types/api';
import { getBlocklyToolbox, initializeBlocklyWithDynamic } from '../../blockly';
import { convertCodeToBlockly } from '../../utils/codeToBlocklyConverter';
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
  const [inputParams, setInputParams] = useState<Array<{ name: string; type: string; defaultValue: string; description: string; required?: boolean }>>([]);
  const [outputParams, setOutputParams] = useState<Array<{ name: string; type: string; description: string }>>([]);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  // 使用 ref 存储最新的参数，解决闭包问题
  const inputParamsRef = useRef<Array<{ name: string; type: string; defaultValue: string; description: string; required?: boolean }>>([]);
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

  // XML导出/导入功能
  const handleExportXML = () => {
    if (!workspaceRef.current) {
      message.error('工作区未初始化');
      return;
    }

    try {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToPrettyText(xml);

      // 创建Blob并下载
      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blockly_${block?.name || 'workspace'}_${Date.now()}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      message.success('XML结构已导出');
    } catch (error) {
      console.error('导出XML失败', error);
      message.error('导出XML失败');
    }
  };

  const handleImportXML = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const xmlText = event.target?.result as string;
          if (!workspaceRef.current) {
            message.error('工作区未初始化');
            return;
          }

          // 清空当前工作区
          workspaceRef.current.clear();

          // 导入XML
          const xml = Blockly.utils.xml.textToDom(xmlText);
          Blockly.Xml.domToWorkspace(xml, workspaceRef.current);

          message.success('XML结构已导入');
        } catch (error) {
          console.error('导入XML失败', error);
          message.error('导入XML失败，请检查文件格式');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  // Monaco Editor 挂载时的处理函数
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 添加 Ctrl+D 快捷键：复制当前行到下一行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (!model || !selection) return;

      // 获取当前光标所在行号
      const currentLineNumber = selection.startLineNumber;
      const currentLine = model.getLineContent(currentLineNumber);

      // 在当前行的末尾插入换行符和复制的内容
      const endOfLineColumn = model.getLineMaxColumn(currentLineNumber);
      const insertPosition = { lineNumber: currentLineNumber, column: endOfLineColumn };

      editor.executeEdits('duplicate-line', [{
        range: new monaco.Range(
          insertPosition.lineNumber,
          insertPosition.column,
          insertPosition.lineNumber,
          insertPosition.column
        ),
        text: '\n' + currentLine,
        forceMoveMarkers: true
      }]);

      // 将光标移动到新复制的行
      const newLineNumber = currentLineNumber + 1;
      editor.setPosition({ lineNumber: newLineNumber, column: selection.startColumn });
      editor.revealLineInCenter(newLineNumber);
    });

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
    // 初始化自定义Blockly块（包含静态块和动态块）
    initializeBlocklyWithDynamic().catch(error => {
      console.error('初始化Blockly失败:', error);
      message.error('加载Blockly块失败，部分功能可能不可用');
    });
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
              toolbox: getToolbox(),
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
              // 启用变量独立实例，防止复制块时字段共享引用
              move: {
                scrollbars: true,
                drag: true,
                wheel: true,
              },
            });

            // 监听块复制事件，确保字段独立
            workspaceRef.current.addChangeListener((event: any) => {
              if (event.type === Blockly.Events.BLOCK_CREATE && event.recordUndo) {
                // 当创建新块时（包括复制），确保所有字段都是独立的实例
                const block = workspaceRef.current?.getBlockById(event.blockId);
                if (block) {
                  // 只处理赋值类型的变量块复制（variables_set, variable_assign）
                  // variables_get 不应该触发重命名，它应该跟随赋值块的变量名
                  if (block.type === 'variables_set' || block.type === 'variable_assign') {
                    const varField = block.getField('VAR');
                    if (varField) {
                      try {
                        const currentVarName = varField.getText();
                        // 检查是否有同名变量正在使用
                        const allBlocks = workspaceRef.current?.getAllBlocks(false) || [];
                        const sameVarBlocks = allBlocks.filter((b: any) => {
                          if (b.id === block.id) return false; // 排除自己
                          // 只检查赋值类型的块
                          if (b.type !== 'variables_set' && b.type !== 'variable_assign') return false;
                          const field = b.getField?.('VAR');
                          return field && field.getText() === currentVarName;
                        });

                        // 如果有多个赋值块使用同一个变量名，说明是复制操作，自动创建新变量
                        if (sameVarBlocks.length > 0) {
                          // 生成新变量名（避免冲突）
                          let newVarName = currentVarName;
                          let counter = 2;
                          while (allBlocks.some((b: any) => {
                            // 只检查赋值类型的块
                            if (b.type !== 'variables_set' && b.type !== 'variable_assign') return false;
                            const field = b.getField?.('VAR');
                            return field && field.getText() === newVarName && b.id !== block.id;
                          })) {
                            newVarName = `${currentVarName}_${counter}`;
                            counter++;
                          }

                          // 设置新变量名（正确的方式：先创建变量，再设置ID）
                          if (newVarName !== currentVarName && workspaceRef.current) {
                            // 在workspace中创建或获取新变量
                            let newVariable = workspaceRef.current.getVariable(newVarName, '');
                            if (!newVariable) {
                              newVariable = workspaceRef.current.createVariable(newVarName, '');
                            }

                            // 设置变量ID而不是直接设置变量名
                            (varField as any).setValue(newVariable.getId());
                            console.log(`🔄 自动重命名复制的变量: ${currentVarName} -> ${newVarName}`);

                            // 更新所有引用该变量的获取块（包括后代块）
                            const descendants = block.getDescendants(false); // 获取所有子块（不包括自己）

                            descendants.forEach((descendant: any) => {
                              if (descendant.type === 'variables_get') {
                                const getVarField = descendant.getField('VAR');
                                if (getVarField && getVarField.getText() === currentVarName) {
                                  // 更新为新的变量名
                                  (getVarField as any).setValue(newVariable.getId());
                                  console.log(`  ↳ 同步更新引用块中的变量: ${currentVarName} -> ${newVarName}`);
                                }
                              }
                            });
                          }
                        }
                      } catch (error) {
                        console.warn('处理变量块复制时出错:', error);
                      }
                    }
                  }

                  // 强制刷新所有输入字段的连接
                  block.inputList.forEach((input: any) => {
                    if (input.connection && input.connection.targetBlock()) {
                      const targetBlock = input.connection.targetBlock();
                      // 重新初始化目标块的字段
                      targetBlock.inputList.forEach((targetInput: any) => {
                        targetInput.fieldRow.forEach((field: any) => {
                          if (field && field.setValue) {
                            // 强制字段值重新设置，确保独立引用
                            const currentValue = field.getValue();
                            field.setValue(currentValue);
                          }
                        });
                      });
                    }
                  });
                }
              }
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
            required: config.required || false,
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

  const getToolbox = useCallback(() => {
    // 使用新的ToolboxManager自动生成工具箱
    try {
      return getBlocklyToolbox();
    } catch (error) {
      console.error('获取工具箱配置失败', error);
      // 返回一个最小的fallback配置
      return {
        kind: 'categoryToolbox',
        contents: []
      };
    }
  }, []);

  const handleModeChange = (mode: 'BLOCKLY' | 'CODE') => {
    if (mode === 'CODE' && definitionMode === 'BLOCKLY') {
      // 从Blockly切换回代码模式：恢复原始代码，不解析参数
      console.log('从可视化模式切换回代码模式，恢复原始代码');

      // 恢复原始代码
      if (originalScriptCode) {
        setScriptCode(originalScriptCode);
        message.info('已恢复原始代码');
      }

      // 不修改参数配置，保持原有配置不变
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

  // 尝试将Python代码转换为Blockly块（使用增强型转换器）
  const handleConvertCodeToBlockly = () => {
    console.log('🧪 开始尝试转换Python代码到Blockly (使用增强型转换器)');
    console.log('当前代码:', scriptCode);

    try {
      if (!workspaceRef.current) {
        console.error('❌ Blockly workspace未初始化');
        message.error('可视化编辑器未就绪，请重试');
        return;
      }

      const workspace = workspaceRef.current;

      // 使用增强型转换器进行转换
      const result = convertCodeToBlockly(workspace, scriptCode);

      console.log(`🎉 转换完成: ${result.convertedCount} 成功, ${result.skippedCount} 跳过`);

      if (result.convertedCount > 0) {
        message.success(
          `转换完成：成功 ${result.convertedCount} 条语句${
            result.skippedCount > 0 ? `，跳过 ${result.skippedCount} 条` : ''
          }`
        );
        if (result.skippedCount > 0) {
          message.warning(
            `部分语句无法转换，请手动添加或调整。${
              result.skippedLines.length > 0
                ? `\n跳过的语句:\n${result.skippedLines.slice(0, 3).join('\n')}${
                    result.skippedLines.length > 3 ? '\n...' : ''
                  }`
                : ''
            }`,
            5
          );
        }
      } else if (result.skippedCount > 0) {
        message.warning('未能转换任何语句，代码可能过于复杂。你可以手动添加可视化块。', 6);
      } else {
        message.info('代码为空或没有可转换的语句');
      }
    } catch (error) {
      console.error('❌ 转换失败:', error);
      message.error('代码转换失败，但你可以手动添加可视化块');
    }
  };

  // 添加输入参数
  const handleAddInputParam = () => {
    setInputParams([...inputParams, { name: '', type: 'string', defaultValue: '', description: '', required: false }]);
  };

  // 删除输入参数
  const handleRemoveInputParam = (index: number) => {
    setInputParams(inputParams.filter((_, i) => i !== index));
  };

  // 更新输入参数
  const handleUpdateInputParam = (index: number, field: string, value: string | boolean) => {
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
          required: param.required || false,
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

  // 从 Blockly 工作区解析输入输出参数
  const parseBlocklyParameters = useCallback(() => {
    if (!workspaceRef.current) {
      return { inputParams: [], outputParams: [] };
    }

    const workspace = workspaceRef.current;
    const inputMatches = new Set<string>();
    const inputTypes: Record<string, string> = {};
    const outputMatches = new Set<string>();

    // 获取所有块
    const allBlocks = workspace.getAllBlocks(false);

    // 定义类型转换块与类型的映射关系
    const typeConversionMap: Record<string, string> = {
      'safe_int': 'number',
      'int_conversion': 'number',
      'safe_float': 'number',
      'float_conversion': 'number',
      'safe_bool': 'boolean',
      'bool_conversion': 'boolean',
      'str_conversion': 'string',
    };

    // 辅助函数：从块中提取参数名
    const extractParamNameFromInputGet = (inputGetBlock: Blockly.Block): string | null => {
      const paramNameInput = inputGetBlock.getInput('PARAM_NAME');
      if (paramNameInput?.connection?.targetBlock()) {
        const textBlock = paramNameInput.connection.targetBlock();
        if (textBlock?.type === 'text') {
          const paramName = textBlock.getFieldValue('TEXT');
          if (paramName && !paramName.startsWith('ctx.')) {
            return paramName;
          }
        }
      }
      return null;
    };

    allBlocks.forEach(block => {
      const blockType = block.type;

      // 1. 优先解析类型转换块包裹的 python_input_get（这样可以推断类型）
      if (typeConversionMap[blockType]) {
        const valueInput = block.getInput('VALUE');
        if (valueInput?.connection?.targetBlock()) {
          const targetBlock = valueInput.connection.targetBlock();
          if (targetBlock?.type === 'python_input_get') {
            const paramName = extractParamNameFromInputGet(targetBlock);
            if (paramName) {
              inputMatches.add(paramName);
              inputTypes[paramName] = typeConversionMap[blockType];
              console.log(`🔍 解析到类型转换: ${paramName} -> ${typeConversionMap[blockType]} (来自 ${blockType})`);
            }
          }
        }
      }

      // 2. 解析没有被类型转换包裹的 python_input_get 块（默认为 string）
      if (blockType === 'python_input_get') {
        const paramName = extractParamNameFromInputGet(block);
        if (paramName && !inputMatches.has(paramName)) {
          // 只有在尚未记录的情况下才添加（避免覆盖已识别的类型）
          inputMatches.add(paramName);
          inputTypes[paramName] = 'string'; // 默认字符串
          console.log(`🔍 解析到输入参数: ${paramName} -> string (默认)`);
        }
      }

      // 3. 解析 python_output_item 块（输出参数）
      if (blockType === 'python_output_item') {
        const key = block.getFieldValue('KEY');
        if (key && key !== '_console_output') {
          outputMatches.add(key);
          console.log(`🔍 解析到输出参数: ${key}`);
        }
      }
    });

    // 转换为参数数组
    const newInputParams = Array.from(inputMatches).map(name => ({
      name,
      type: inputTypes[name] || 'string',
      defaultValue: '',
      description: '',
      required: false,
    }));

    const newOutputParams = Array.from(outputMatches).map(name => ({
      name,
      type: 'string',
      description: ''
    }));

    console.log('✅ 参数解析完成:', { inputParams: newInputParams, outputParams: newOutputParams });

    return { inputParams: newInputParams, outputParams: newOutputParams };
  }, []);

  // 打开测试弹窗
  const handleOpenTest = () => {
    // 如果是可视化模式，先从 Blockly 工作区解析参数（仅用于测试，不覆盖原配置）
    if (definitionMode === 'BLOCKLY' && workspaceRef.current) {
      console.log('🔍 可视化模式：从 Blockly 工作区解析输入输出参数（仅用于测试）...');
      const { inputParams: parsedInputParams, outputParams: parsedOutputParams } = parseBlocklyParameters();

      if (parsedInputParams.length > 0) {
        console.log(`✅ 解析到 ${parsedInputParams.length} 个输入参数:`, parsedInputParams);
        // ⚠️ 重要：不更新 inputParams 状态，只用于测试
        // 使用解析后的参数初始化测试输入值
        const initialInputs: Record<string, any> = {};
        parsedInputParams.forEach(param => {
          if (param.name) {
            initialInputs[param.name] = param.defaultValue || '';
          }
        });
        setTestInputs(initialInputs);

        // 临时更新 inputParamsRef 用于测试弹窗显示（不影响左侧配置）
        inputParamsRef.current = parsedInputParams;
        message.info(`可视化模式测试：检测到 ${parsedInputParams.length} 个输入参数`);
      } else {
        // 如果没有解析到参数，使用现有配置
        const initialInputs: Record<string, any> = {};
        inputParams.forEach(param => {
          if (param.name) {
            initialInputs[param.name] = param.defaultValue || '';
          }
        });
        setTestInputs(initialInputs);
        inputParamsRef.current = inputParams;
      }

      if (parsedOutputParams.length > 0) {
        console.log(`✅ 解析到 ${parsedOutputParams.length} 个输出参数:`, parsedOutputParams);
        // 临时更新 outputParamsRef（不影响左侧配置）
        outputParamsRef.current = parsedOutputParams;
      } else {
        outputParamsRef.current = outputParams;
      }
    } else {
      // 代码模式：使用现有的 inputParams
      const initialInputs: Record<string, any> = {};
      inputParams.forEach(param => {
        if (param.name) {
          initialInputs[param.name] = param.defaultValue || '';
        }
      });
      setTestInputs(initialInputs);
      inputParamsRef.current = inputParams;
      outputParamsRef.current = outputParams;
    }

    setTestResult(null);
    setTestModalVisible(true);
  };

  // 执行测试
  const handleTest = async () => {
    if (!block) {
      message.warning('请先保存块后再进行测试');
      return;
    }

    // 校验非空参数（使用 inputParamsRef，因为可视化模式下 inputParams 可能未更新）
    const currentInputParams = inputParamsRef.current.length > 0 ? inputParamsRef.current : inputParams;
    const missingRequiredParams: string[] = [];
    currentInputParams.forEach(param => {
      if (param.required) {
        const value = testInputs[param.name];
        // 如果参数为空（undefined、null、空字符串）
        if (value === undefined || value === null || value === '') {
          // 如果没有默认值，则报错
          if (!param.defaultValue || param.defaultValue === '') {
            missingRequiredParams.push(param.name);
          }
        }
      }
    });

    if (missingRequiredParams.length > 0) {
      message.error(`以下参数为必填项：${missingRequiredParams.join(', ')}`);
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

          // 智能检测是否需要 safe_* 函数（只有代码中使用了才添加）
          const needsSafeInt = pythonCode.includes('safe_int(');
          const needsSafeFloat = pythonCode.includes('safe_float(');
          const needsSafeBool = pythonCode.includes('safe_bool(');

          let helperFunctions = '';

          if (needsSafeInt || needsSafeFloat || needsSafeBool) {
            helperFunctions = '# ========== 安全类型转换函数 ==========\n\n';

            if (needsSafeInt) {
              helperFunctions += `def safe_int(value, default=0):
    """安全地转换为整数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

`;
            }

            if (needsSafeFloat) {
              helperFunctions += `def safe_float(value, default=0.0):
    """安全地转换为浮点数，处理空字符串、None和无效值"""
    if value is None or value == '':
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

`;
            }

            if (needsSafeBool) {
              helperFunctions += `def safe_bool(value, default=False):
    """安全地转换为布尔值"""
    if value is None or value == '':
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['true', '1', 'yes', 'on']
    return bool(value)

`;
            }

            helperFunctions += '# ========== 可视化块生成的代码 ==========\n\n';
          }

          codeToTest = helperFunctions + pythonCode;
          console.log('🧪 可视化模式测试，生成的代码:', codeToTest);
          if (needsSafeInt || needsSafeFloat || needsSafeBool) {
            console.log('✅ 已自动添加安全转换函数:', { needsSafeInt, needsSafeFloat, needsSafeBool });
          }
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
      // 过滤掉空值参数（空字符串、null、undefined）
      // 这样 Python 代码的 inputs.get('param', default) 可以使用默认值
      const filteredInputs: Record<string, any> = {};
      Object.entries(testInputs).forEach(([key, value]) => {
        // 只保留非空值（空字符串、null、undefined 都会被过滤）
        if (value !== '' && value !== null && value !== undefined) {
          filteredInputs[key] = value;
        }
      });

      console.log('🧪 测试输入参数（已过滤空值）:', filteredInputs);

      // 使用临时代码测试（不保存块）
      const response = await blockApi.test(block.id, {
        inputs: filteredInputs, // 使用过滤后的参数
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
      const errorMessage = error.message || '未知错误';

      // 检查是否是Python环境不存在的错误
      if (errorMessage.includes('Python环境不存在')) {
        Modal.error({
          title: '脚本执行异常',
          content: (
            <div>
              <p>Python环境不存在，请先配置Python环境。</p>
              <p style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                当前块关联的Python环境可能已被删除或未正确配置。
              </p>
            </div>
          ),
          okText: '去配置Python环境',
          onOk: () => {
            navigate('/manage/python-envs');
          },
        });
        setTestResult({
          success: false,
          error: `执行失败: ${errorMessage}`
        });
      } else {
        setTestResult({
          success: false,
          error: `执行失败: ${errorMessage}`
        });
      }
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

    // 创建现有参数的映射，用于保留已有参数的配置
    const existingInputParamsMap = new Map(
      inputParams.map(p => [p.name, p])
    );
    const existingOutputParamsMap = new Map(
      outputParams.map(p => [p.name, p])
    );

    // 转换为参数数组，保留已存在参数的配置
    const newInputParams = Array.from(inputMatches).map(name => {
      const existing = existingInputParamsMap.get(name);
      if (existing) {
        // 如果参数已存在，保留原有配置，只更新类型（如果类型推断不同）
        return {
          ...existing,
          type: inputTypes[name] || existing.type, // 使用新推断的类型，如果没有则保持原类型
        };
      } else {
        // 新参数，使用默认配置
        return {
          name,
          type: inputTypes[name] || 'string',
          defaultValue: '',
          description: '',
          required: false,
        };
      }
    });

    const newOutputParams = Array.from(outputMatches).map(name => {
      const existing = existingOutputParamsMap.get(name);
      if (existing) {
        // 如果参数已存在，保留原有配置
        return existing;
      } else {
        // 新参数，使用默认配置
        return {
          name,
          type: 'string',
          description: ''
        };
      }
    });

    // 更新参数列表
    if (newInputParams.length > 0 || newOutputParams.length > 0) {
      setInputParams(newInputParams);
      setOutputParams(newOutputParams);
      const addedInputCount = newInputParams.filter(p => !existingInputParamsMap.has(p.name)).length;
      const addedOutputCount = newOutputParams.filter(p => !existingOutputParamsMap.has(p.name)).length;
      const keptInputCount = newInputParams.length - addedInputCount;
      const keptOutputCount = newOutputParams.length - addedOutputCount;

      message.success(
        `已解析参数：` +
        `输入参数 ${newInputParams.length} 个（新增 ${addedInputCount}，保留 ${keptInputCount}），` +
        `输出参数 ${newOutputParams.length} 个（新增 ${addedOutputCount}，保留 ${keptOutputCount}）`
      );
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

  // 保存函数引用，用于快捷键调用
  const handleSaveRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // 监听Ctrl+S快捷键保存
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否是Ctrl+S或Cmd+S（Mac）
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // 阻止浏览器默认保存行为
        handleSaveRef.current?.();
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
                          <Checkbox
                            checked={param.required}
                            onChange={(e) => handleUpdateInputParam(index, 'required', e.target.checked)}
                          >
                            非空
                          </Checkbox>
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
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WarningOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />
                    <span style={{ fontSize: '13px', color: '#595959' }}>
                      <strong>预览模式：</strong>可视化编辑仅用于预览测试，不会保存。切换回代码模式时会自动恢复原始代码。
                    </span>
                  </div>
                  <Space>
                    <Tooltip title="导出当前可视化块的XML结构">
                      <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={handleExportXML}
                      >
                        导出XML
                      </Button>
                    </Tooltip>
                    <Tooltip title="从XML文件导入可视化块结构">
                      <Button
                        size="small"
                        icon={<UploadOutlined />}
                        onClick={handleImportXML}
                      >
                        导入XML
                      </Button>
                    </Tooltip>
                  </Space>
                </div>
                <div ref={blocklyDivRef} className="blockly-editor" style={{ flex: 1 }} />
              </div>
            ) : (
              <div className="code-editor">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme="vs-dark"
                  defaultValue={scriptCode}
                  key={block?.id || 'new'}
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
          <Space direction="vertical" size={0}>
            <Tag color="blue" style={{ fontSize: 12 }}>Ctrl+S 快捷保存</Tag>
            <Tag color="green" style={{ fontSize: 12 }}>Ctrl+D 复制当前行</Tag>
          </Space>
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
          {inputParamsRef.current.length === 0 ? (
            <p style={{ color: '#999' }}>该块没有配置输入参数</p>
          ) : (
            <div>
              {inputParamsRef.current.map((param) => (
                <div key={param.name} style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{param.name}</strong>
                    {param.required && (
                      <Tag color="red" style={{ marginLeft: 8, fontSize: 11 }}>必填</Tag>
                    )}
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
                    placeholder={param.required && (!param.defaultValue || param.defaultValue === '') ? `必填，请输入 ${param.name}` : `请输入 ${param.name}${param.defaultValue ? ` (默认: ${param.defaultValue})` : ''}`}
                    status={param.required && (!param.defaultValue || param.defaultValue === '') && (!testInputs[param.name] || testInputs[param.name] === '') ? 'error' : undefined}
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
                                      // 在线安装，跳转到指定环境
                                      window.open(`/manage/python-envs?id=${testResult.pythonEnvId}&openOnlineInstall=true`, '_blank');
                                      // 离线安装
                                      // window.open(`/manage/python-envs?id=${testResult.pythonEnvId}&openPackageManagement=true`, '_blank');
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
