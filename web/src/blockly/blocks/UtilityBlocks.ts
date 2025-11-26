import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * # -*- coding: utf-8 -*- 编码声明
 */
export class CodingDeclarationBlock extends BlockDefinition {
  type = 'coding_declaration';
  category = 'python_io';

  definition = {
    message0: '# -*- coding: utf-8 -*-',
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: 'Python 文件编码声明（建议放在文件开头）',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    return '# -*- coding: utf-8 -*-\n';
  };
}

/**
 * 注释块
 */
export class CommentBlock extends BlockDefinition {
  type = 'comment';
  category = 'python_io';

  definition = {
    message0: '# %1',
    args0: [
      {
        type: 'field_input',
        name: 'COMMENT',
        text: '注释内容',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: 'Python 单行注释',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const comment = BlockHelper.getFieldValue(block, 'COMMENT');
    return `# ${comment}\n`;
  };
}

/**
 * import 语句块
 */
export class ImportBlock extends BlockDefinition {
  type = 'import_module';
  category = 'python_io';

  definition = {
    message0: 'import %1',
    args0: [
      {
        type: 'field_input',
        name: 'MODULE',
        text: 'module',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '导入 Python 模块',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    const module = BlockHelper.getFieldValue(block, 'MODULE');
    return `import ${module}\n`;
  };
}

/**
 * from ... import ... 语句块
 */
export class FromImportBlock extends BlockDefinition {
  type = 'from_import';
  category = 'python_io';

  definition = {
    message0: 'from %1 import %2',
    args0: [
      {
        type: 'field_input',
        name: 'MODULE',
        text: 'module',
      },
      {
        type: 'field_input',
        name: 'NAMES',
        text: 'function',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#1890ff',
    tooltip: '从模块中导入指定函数或类',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): string => {
    const module = BlockHelper.getFieldValue(block, 'MODULE');
    const names = BlockHelper.getFieldValue(block, 'NAMES');
    return `from ${module} import ${names}\n`;
  };
}
