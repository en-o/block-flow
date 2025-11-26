/**
 * Python 代码转 Blockly 块的增强转换器
 * 支持更多 Python 语法，包括上下文变量、outputs 设置等
 */
import * as Blockly from 'blockly';

export interface ConversionResult {
  convertedCount: number;
  skippedCount: number;
  skippedLines: string[];
}

/**
 * 将 Python 代码转换为 Blockly 块
 */
export function convertCodeToBlockly(
  workspace: Blockly.WorkspaceSvg,
  code: string
): ConversionResult {
  workspace.clear(); // 清空工作区

  // 解析代码并转换为块
  const lines = code.split('\n')
    .map(line => {
      // 移除行尾注释
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
        // 检查 # 是否在字符串内
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;

        // 如果引号是成对的，说明 # 在字符串外，可以移除
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          return beforeComment;
        }
      }
      return line;
    })
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('def ');
    });

  let convertedCount = 0;
  let skippedCount = 0;
  const skippedLines: string[] = [];
  let yPosition = 50; // 初始Y坐标
  let previousBlock: Blockly.Block | null = null;

  console.log('📝 准备转换', lines.length, '行代码');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`处理第 ${i + 1} 行:`, line);

    let block: Blockly.Block | null = null;

    // 0. 编码声明: # -*- coding: utf-8 -*-
    if (line.match(/^#\s*-\*-\s*coding:\s*utf-8\s*-\*-$/)) {
      console.log('✅ 识别为编码声明');
      block = workspace.newBlock('coding_declaration');
      convertedCount++;
    }
    // 1. 上下文变量：name = inputs.get('ctx.USER_NAME', '默认值')
    const ctxVarMatch = line.match(/^(\w+)\s*=\s*inputs\.get\s*\(\s*['"]ctx\.([^'"]+)['"]\s*(?:,\s*(.+))?\s*\)$/);
    if (ctxVarMatch) {
      console.log('✅ 识别为上下文变量获取');
      block = workspace.newBlock('variable_assign');
      block.setFieldValue(ctxVarMatch[1], 'VAR');

      const ctxBlock = workspace.newBlock('context_variable');
      ctxBlock.setFieldValue(ctxVarMatch[2], 'VAR_NAME');

      block.getInput('VALUE')?.connection?.connect(ctxBlock.outputConnection!);
      convertedCount++;
    }
    // 2. inputs.get() with int/float/bool/safe_int/safe_float/safe_bool
    else if (line.match(/^(\w+)\s*=\s*(?:safe_int|safe_float|safe_bool|int|float|bool)\s*\(\s*inputs\.get\s*\(/)) {
      const match = line.match(/^(\w+)\s*=\s*(safe_int|safe_float|safe_bool|int|float|bool)\s*\(\s*inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*[^)]+)?\s*\)\s*(?:,\s*([^)]+))?\s*\)$/);
      if (match) {
        console.log(`✅ 识别为 ${match[2]}(inputs.get(...))`);
        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');

        // Map int/float/bool to safe_int/safe_float/safe_bool
        const typeMap: Record<string, string> = {
          'int': 'safe_int',
          'float': 'safe_float',
          'bool': 'safe_bool',
          'safe_int': 'safe_int',
          'safe_float': 'safe_float',
          'safe_bool': 'safe_bool'
        };
        const blockType = typeMap[match[2]] || 'safe_int';

        // Create safe conversion block
        const safeBlock = workspace.newBlock(blockType);

        // 从 inputs.get('a', '1') 或 int(inputs.get('a', '1'), 0) 提取默认值
        // 优先使用转换函数的默认值（第二个参数），如果没有则使用 inputs.get 的默认值
        let defaultValue = '0';

        // 提取 inputs.get 的默认值
        const inputsGetMatch = line.match(/inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*,\s*(['"]?)([^)'"]+)\2\s*\)/);
        if (inputsGetMatch && inputsGetMatch[3]) {
          defaultValue = inputsGetMatch[3].trim();
        }

        // 如果有转换函数的第二个参数，优先使用它
        if (match[4]) {
          defaultValue = match[4].trim();
        }

        // 设置 safe_int/float/bool 的默认值
        if (blockType === 'safe_bool') {
          // bool 类型：True 或 False
          const boolValue = defaultValue.toLowerCase() === 'true' || defaultValue === '1' ? 'True' : 'False';
          safeBlock.setFieldValue(boolValue, 'DEFAULT');
        } else {
          // int/float 类型：数字
          safeBlock.setFieldValue(defaultValue, 'DEFAULT');
        }

        // Create python_input_get block (不设置默认值，让 safe_int 来处理)
        const inputGetBlock = workspace.newBlock('python_input_get');
        const paramNameBlock = workspace.newBlock('text');
        paramNameBlock.setFieldValue(match[3], 'TEXT');
        inputGetBlock.getInput('PARAM_NAME')?.connection?.connect(paramNameBlock.outputConnection!);

        // Connect input_get to safe conversion
        safeBlock.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

        // Connect safe conversion to variable
        block.getInput('VALUE')?.connection?.connect(safeBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 3. Simple inputs.get(): variable = inputs.get('param', default)
    else if (line.match(/^(\w+)\s*=\s*inputs\.get\s*\(/)) {
      const match = line.match(/^(\w+)\s*=\s*inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\d+|['"][^'"]*['"])?\s*)?\)$/);
      if (match) {
        console.log('✅ 识别为 inputs.get(...)');
        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');

        const inputGetBlock = workspace.newBlock('python_input_get');
        const paramNameBlock = workspace.newBlock('text');
        paramNameBlock.setFieldValue(match[2], 'TEXT');
        inputGetBlock.getInput('PARAM_NAME')?.connection?.connect(paramNameBlock.outputConnection!);

        // 添加默认值支持
        if (match[3]) {
          const defaultVal = match[3].replace(/^['"]|['"]$/g, '');
          const defaultBlock = /^\d+$/.test(defaultVal)
            ? workspace.newBlock('math_number')
            : workspace.newBlock('text');

          if (defaultBlock.type === 'math_number') {
            defaultBlock.setFieldValue(defaultVal, 'NUM');
          } else {
            defaultBlock.setFieldValue(defaultVal, 'TEXT');
          }
          inputGetBlock.getInput('DEFAULT_VALUE')?.connection?.connect(defaultBlock.outputConnection!);
        }

        block.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 4. Math operations: result = a + b, result = a * b, etc.
    else if (line.match(/^(\w+)\s*=\s*(\w+)\s*([\+\-\*\/])\s*(\d+|(\w+))$/)) {
      const match = line.match(/^(\w+)\s*=\s*(\w+)\s*([\+\-\*\/])\s*(\d+|\w+)$/);
      if (match) {
        const opMap: Record<string, string> = { '+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE' };
        console.log(`✅ 识别为数学运算 (${match[3]})`);

        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');

        const mathBlock = workspace.newBlock('math_arithmetic');
        mathBlock.setFieldValue(opMap[match[3]], 'OP');

        // Create left operand
        const varA = workspace.newBlock('variables_get');
        varA.setFieldValue(match[2], 'VAR');

        // Create right operand (variable or number)
        const varB = /^\d+$/.test(match[4])
          ? workspace.newBlock('math_number')
          : workspace.newBlock('variables_get');

        if (varB.type === 'math_number') {
          varB.setFieldValue(match[4], 'NUM');
        } else {
          varB.setFieldValue(match[4], 'VAR');
        }

        mathBlock.getInput('A')?.connection?.connect(varA.outputConnection!);
        mathBlock.getInput('B')?.connection?.connect(varB.outputConnection!);
        block.getInput('VALUE')?.connection?.connect(mathBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 5. Print variable: print(variable_name)
    else if (line.match(/^print\s*\(\s*(\w+)\s*\)$/)) {
      const match = line.match(/^print\s*\(\s*(\w+)\s*\)$/);
      if (match) {
        console.log('✅ 识别为 print(变量)');
        block = workspace.newBlock('python_print');

        const varBlock = workspace.newBlock('variables_get');
        varBlock.setFieldValue(match[1], 'VAR');
        block.getInput('TEXT')?.connection?.connect(varBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 6. Print string: print('text') or print("text")
    else if (line.match(/^print\s*\(\s*['"]([^'"]*)['"]\s*\)$/)) {
      const match = line.match(/^print\s*\(\s*['"]([^'"]*)['"]\s*\)$/);
      if (match) {
        console.log('✅ 识别为 print(字符串)');
        block = workspace.newBlock('python_print');

        const textBlock = workspace.newBlock('text');
        textBlock.setFieldValue(match[1], 'TEXT');
        block.getInput('TEXT')?.connection?.connect(textBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 7. outputs = {...} with content
    else if (line.match(/^outputs\s*=\s*\{/)) {
      console.log('✅ 识别为 outputs 设置');

      // 查找完整的 outputs 块（可能跨多行）
      let outputsContent = line;
      let j = i + 1;
      let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      while (braceCount > 0 && j < lines.length) {
        outputsContent += '\n' + lines[j].trim();
        braceCount += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
        j++;
      }

      // 解析键值对
      const kvMatches = [...outputsContent.matchAll(/['"]([^'"]+)['"]\s*:\s*(\w+|['"][^'"]*['"]|True|False)/g)];

      if (kvMatches.length > 0) {
        block = workspace.newBlock('python_output_set');

        let firstItemBlock: Blockly.Block | null = null;
        let prevItemBlock: Blockly.Block | null = null;

        kvMatches.forEach((kvMatch, idx) => {
          const key = kvMatch[1];
          const value = kvMatch[2];

          const itemBlock = workspace.newBlock('python_output_item');
          itemBlock.setFieldValue(key, 'KEY');

          // 创建值块
          let valueBlock: Blockly.Block;
          if (value === 'True' || value === 'False') {
            valueBlock = workspace.newBlock('logic_boolean');
            valueBlock.setFieldValue(value.toUpperCase(), 'BOOL');
          } else if (/^\d+$/.test(value)) {
            valueBlock = workspace.newBlock('math_number');
            valueBlock.setFieldValue(value, 'NUM');
          } else if (/^['"]/.test(value)) {
            valueBlock = workspace.newBlock('text');
            valueBlock.setFieldValue(value.replace(/^['"]|['"]$/g, ''), 'TEXT');
          } else {
            valueBlock = workspace.newBlock('variables_get');
            valueBlock.setFieldValue(value, 'VAR');
          }

          itemBlock.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);

          if (idx === 0) {
            firstItemBlock = itemBlock;
          } else if (prevItemBlock) {
            prevItemBlock.nextConnection?.connect(itemBlock.previousConnection!);
          }

          prevItemBlock = itemBlock;
        });

        if (firstItemBlock !== null) {
          const connection = (firstItemBlock as Blockly.Block).previousConnection;
          if (connection) {
            block.getInput('OUTPUTS')?.connection?.connect(connection);
          }
        }

        convertedCount++;
        i = j - 1; // 跳过已处理的行
      }
    }
    // 8. 变量赋值（字符串）
    else if (line.match(/^(\w+)\s*=\s*['"](.+?)['"]$/)) {
      const match = line.match(/^(\w+)\s*=\s*['"](.+?)['"]$/);
      if (match) {
        console.log('✅ 识别为字符串变量赋值');
        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');
        const valueBlock = workspace.newBlock('text');
        valueBlock.setFieldValue(match[2], 'TEXT');
        block.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);
        convertedCount++;
      }
    }
    // 9. 变量赋值（数字）
    else if (line.match(/^(\w+)\s*=\s*(\d+(?:\.\d+)?)$/)) {
      const match = line.match(/^(\w+)\s*=\s*(\d+(?:\.\d+)?)$/);
      if (match) {
        console.log('✅ 识别为数字变量赋值');
        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');
        const valueBlock = workspace.newBlock('math_number');
        valueBlock.setFieldValue(match[2], 'NUM');
        block.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);
        convertedCount++;
      }
    }
    // 10. from xxx import yyy
    else if (line.match(/^from\s+\S+\s+import\s+/)) {
      const match = line.match(/^from\s+(\S+)\s+import\s+(.+)$/);
      if (match) {
        console.log('✅ 识别为 from import');
        block = workspace.newBlock('from_import');
        block.setFieldValue(match[1], 'MODULE');
        block.setFieldValue(match[2], 'NAMES');
        convertedCount++;
      }
    }
    // 11. import xxx (通用 import)
    else if (line.match(/^import\s+\w+$/)) {
      const match = line.match(/^import\s+(\w+)$/);
      if (match) {
        console.log(`✅ 识别为 import ${match[1]}`);

        // 特殊处理：requests
        if (match[1] === 'requests') {
          block = workspace.newBlock('import_requests');
        } else {
          // 通用 import 块
          block = workspace.newBlock('import_module');
          block.setFieldValue(match[1], 'MODULE');
        }
        convertedCount++;
      }
    }
    // 12. r = requests.get(url) / requests.post(url)
    else if (line.match(/^(\w+)\s*=\s*requests\.(get|post|put|delete)\s*\(/)) {
      const match = line.match(/^(\w+)\s*=\s*requests\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]\s*\)$/);
      if (match) {
        console.log(`✅ 识别为 requests.${match[2]}(...)`);
        block = workspace.newBlock('variable_assign');
        block.setFieldValue(match[1], 'VAR');

        const requestBlock = workspace.newBlock(`requests_${match[2]}`);
        const urlBlock = workspace.newBlock('text');
        urlBlock.setFieldValue(match[3], 'TEXT');
        requestBlock.getInput('URL')?.connection?.connect(urlBlock.outputConnection!);

        block.getInput('VALUE')?.connection?.connect(requestBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 13. print('label:', value) - 带标签的打印
    else if (line.match(/^print\s*\(\s*['"]([^'"]+:)['"]\s*,\s*(\w+[\w\.]*(?:\[:[^\]]*\])?)\s*\)$/)) {
      const match = line.match(/^print\s*\(\s*['"]([^'"]+:)['"]\s*,\s*(\w+[\w\.]*(?:\[:[^\]]*\])?)\s*\)$/);
      if (match) {
        console.log('✅ 识别为 print(label:, value)');
        block = workspace.newBlock('print_with_label');
        block.setFieldValue(match[1], 'LABEL');

        // 解析 value：可能是变量、属性访问或切片
        const value = match[2];
        let valueBlock: Blockly.Block;

        // 如果包含切片 [:n]
        if (value.match(/(\w+(?:\.\w+)*)\[:(\d+)\]$/)) {
          const sliceMatch = value.match(/(\w+(?:\.\w+)*)\[:(\d+)\]$/);
          if (sliceMatch) {
            // 创建字符串切片块
            valueBlock = workspace.newBlock('string_slice');

            // 创建源变量/属性块
            const source = sliceMatch[1];
            let sourceBlock: Blockly.Block;
            if (source.includes('.')) {
              // 属性访问
              sourceBlock = createPropertyAccessChain(workspace, source);
            } else {
              // 简单变量
              sourceBlock = workspace.newBlock('variables_get');
              sourceBlock.setFieldValue(source, 'VAR');
            }

            // 连接源到切片块
            valueBlock.getInput('STRING')?.connection?.connect(sourceBlock.outputConnection!);

            // 设置结束索引
            const endBlock = workspace.newBlock('math_number');
            endBlock.setFieldValue(sliceMatch[2], 'NUM');
            valueBlock.getInput('END')?.connection?.connect(endBlock.outputConnection!);

          } else {
            valueBlock = workspace.newBlock('variables_get');
            valueBlock.setFieldValue(value, 'VAR');
          }
        }
        // 如果包含属性访问
        else if (value.includes('.')) {
          valueBlock = createPropertyAccessChain(workspace, value);
        }
        // 简单变量
        else {
          valueBlock = workspace.newBlock('variables_get');
          valueBlock.setFieldValue(value, 'VAR');
        }

        block.getInput('VALUE')?.connection?.connect(valueBlock.outputConnection!);

        convertedCount++;
      }
    }
    // 14. For 循环
    else if (line.match(/^for\s+\w+\s+in\s+range\((\d+)\):\s*$/)) {
      const match = line.match(/^for\s+(\w+)\s+in\s+range\((\d+)\):\s*$/);
      if (match) {
        console.log('✅ 识别为 for 循环');
        block = workspace.newBlock('controls_repeat_ext');
        const timesBlock = workspace.newBlock('math_number');
        timesBlock.setFieldValue(match[2], 'NUM');
        block.getInput('TIMES')?.connection?.connect(timesBlock.outputConnection!);
        convertedCount++;
      }
    }
    // 无法识别的语句
    else {
      console.log('❌ 无法转换此行代码');
      skippedCount++;
      skippedLines.push(line);
    }

    // 如果成功创建了块，初始化并放置
    if (block) {
      // 连接到前一个块
      if (previousBlock && previousBlock.nextConnection && block.previousConnection) {
        previousBlock.nextConnection.connect(block.previousConnection);
      } else {
        // 第一个块或不能连接的块，设置位置
        block.moveBy(50, yPosition);
        yPosition += 80;
      }

      previousBlock = block;
    }
  }

  console.log(`🎉 转换完成: ${convertedCount} 成功, ${skippedCount} 跳过`);

  return {
    convertedCount,
    skippedCount,
    skippedLines,
  };
}

/**
 * 创建属性访问链 (如 r.status_code 或 r.headers.get('xxx'))
 */
function createPropertyAccessChain(workspace: Blockly.WorkspaceSvg, expression: string): Blockly.Block {
  // 解析属性访问链，例如：r.status_code, r.headers.get('Content-Type')

  // 检查是否包含方法调用
  const methodMatch = expression.match(/^(\w+(?:\.\w+)*)\.(\w+)\((.*)\)$/);
  if (methodMatch) {
    // 创建对象方法调用块
    const methodBlock = workspace.newBlock('object_method_call');

    // 设置方法名
    methodBlock.setFieldValue(methodMatch[2], 'METHOD');

    // 创建对象部分（可能是嵌套的属性访问）
    const objectPart = methodMatch[1];
    let objectBlock: Blockly.Block;
    if (objectPart.includes('.')) {
      // 递归处理嵌套属性
      objectBlock = createPropertyAccessChain(workspace, objectPart);
    } else {
      // 简单变量
      objectBlock = workspace.newBlock('variables_get');
      objectBlock.setFieldValue(objectPart, 'VAR');
    }
    methodBlock.getInput('OBJECT')?.connection?.connect(objectBlock.outputConnection!);

    // 处理参数
    const args = methodMatch[3].trim();
    if (args) {
      // 简单处理：只支持单个字符串参数
      const argMatch = args.match(/^['"]([^'"]+)['"]$/);
      if (argMatch) {
        const argBlock = workspace.newBlock('text');
        argBlock.setFieldValue(argMatch[1], 'TEXT');
        methodBlock.getInput('ARGS')?.connection?.connect(argBlock.outputConnection!);
      }
    }

    methodBlock.getInput('OBJECT')?.connection?.connect(objectBlock.outputConnection!);

    return methodBlock;
  }

  // 简单属性访问（如 r.status_code）
  const parts = expression.split('.');
  if (parts.length === 2) {
    const propertyBlock = workspace.newBlock('object_property');
    propertyBlock.setFieldValue(parts[1], 'PROPERTY');

    const varBlock = workspace.newBlock('variables_get');
    varBlock.setFieldValue(parts[0], 'VAR');
    propertyBlock.getInput('OBJECT')?.connection?.connect(varBlock.outputConnection!);

    return propertyBlock;
  }

  // 嵌套属性访问（如 r.headers.xxx）
  const firstVar = parts[0];
  let currentBlock: Blockly.Block = workspace.newBlock('variables_get');
  currentBlock.setFieldValue(firstVar, 'VAR');

  for (let i = 1; i < parts.length; i++) {
    const propertyBlock = workspace.newBlock('object_property');
    propertyBlock.setFieldValue(parts[i], 'PROPERTY');
    propertyBlock.getInput('OBJECT')?.connection?.connect(currentBlock.outputConnection!);

    currentBlock = propertyBlock;
  }

  return currentBlock;
}
