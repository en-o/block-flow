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
  const lines = code.split('\n').filter(line => {
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

    // 1. 上下文变量：name = inputs.get('ctx.USER_NAME', '默认值')
    const ctxVarMatch = line.match(/^(\w+)\s*=\s*inputs\.get\s*\(\s*['"]ctx\.([^'"]+)['"]\s*(?:,\s*(.+))?\s*\)$/);
    if (ctxVarMatch) {
      console.log('✅ 识别为上下文变量获取');
      block = workspace.newBlock('variable_assign');
      block.setFieldValue(ctxVarMatch[1], 'VAR');

      const ctxBlock = workspace.newBlock('context_variable');
      ctxBlock.setFieldValue(ctxVarMatch[2], 'VAR_NAME');

      block.getInput('VALUE')?.connection?.connect(ctxBlock.outputConnection!);
      ctxBlock.initSvg();
      ctxBlock.render();
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

        // Create python_input_get block
        const inputGetBlock = workspace.newBlock('python_input_get');
        const paramNameBlock = workspace.newBlock('text');
        paramNameBlock.setFieldValue(match[3], 'TEXT');
        inputGetBlock.getInput('PARAM_NAME')?.connection?.connect(paramNameBlock.outputConnection!);

        // 处理默认值（如果有）
        // 从 inputs.get('a', '1') 中提取默认值 '1'
        const inputsGetMatch = line.match(/inputs\.get\s*\(\s*['"]([^'"]+)['"]\s*,\s*(['"]?)([^)'"]+)\2\s*\)/);
        if (inputsGetMatch && inputsGetMatch[3]) {
          const defaultVal = inputsGetMatch[3];
          const defaultBlock = /^\d+$/.test(defaultVal)
            ? workspace.newBlock('math_number')
            : workspace.newBlock('text');

          if (defaultBlock.type === 'math_number') {
            defaultBlock.setFieldValue(defaultVal, 'NUM');
          } else {
            defaultBlock.setFieldValue(defaultVal, 'TEXT');
          }
          inputGetBlock.getInput('DEFAULT_VALUE')?.connection?.connect(defaultBlock.outputConnection!);
          defaultBlock.initSvg();
          defaultBlock.render();
        }

        // Connect input_get to safe conversion
        safeBlock.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

        // Connect safe conversion to variable
        block.getInput('VALUE')?.connection?.connect(safeBlock.outputConnection!);

        paramNameBlock.initSvg();
        paramNameBlock.render();
        inputGetBlock.initSvg();
        inputGetBlock.render();
        safeBlock.initSvg();
        safeBlock.render();
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
          defaultBlock.initSvg();
          defaultBlock.render();
        }

        block.getInput('VALUE')?.connection?.connect(inputGetBlock.outputConnection!);

        paramNameBlock.initSvg();
        paramNameBlock.render();
        inputGetBlock.initSvg();
        inputGetBlock.render();
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

        varA.initSvg();
        varA.render();
        varB.initSvg();
        varB.render();
        mathBlock.initSvg();
        mathBlock.render();
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

        varBlock.initSvg();
        varBlock.render();
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

        textBlock.initSvg();
        textBlock.render();
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
          valueBlock.initSvg();
          valueBlock.render();

          if (idx === 0) {
            firstItemBlock = itemBlock;
          } else if (prevItemBlock) {
            prevItemBlock.nextConnection?.connect(itemBlock.previousConnection!);
          }

          itemBlock.initSvg();
          itemBlock.render();
          prevItemBlock = itemBlock;
        });

        if (firstItemBlock) {
          block.getInput('OUTPUTS')?.connection?.connect(firstItemBlock.previousConnection!);
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
        valueBlock.initSvg();
        valueBlock.render();
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
        valueBlock.initSvg();
        valueBlock.render();
        convertedCount++;
      }
    }
    // 10. For 循环
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
      skippedLines.push(line);
    }

    // 如果成功创建了块，初始化并放置
    if (block) {
      block.initSvg();
      block.render();

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
