import * as Blockly from 'blockly';
import { Order } from 'blockly/python';
import { BlockDefinition, BlockHelper } from '../core/BlockDefinition';

/**
 * from datetime import datetime
 */
export class ImportDatetimeBlock extends BlockDefinition {
  type = 'import_datetime';
  category = 'python_datetime';

  definition = {
    message0: 'from datetime import datetime',
    previousStatement: null,
    nextStatement: null,
    colour: '#eb2f96',
    tooltip: '导入 datetime 模块',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    return 'from datetime import datetime\n';
  };
}

/**
 * from dateutil import parser
 */
export class ImportDateutilBlock extends BlockDefinition {
  type = 'import_dateutil';
  category = 'python_datetime';

  definition = {
    message0: 'from dateutil import parser',
    previousStatement: null,
    nextStatement: null,
    colour: '#eb2f96',
    tooltip: '导入 dateutil.parser 用于灵活解析日期',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    return 'from dateutil import parser\n';
  };
}

/**
 * datetime.now() - 获取当前时间
 */
export class DatetimeNowBlock extends BlockDefinition {
  type = 'datetime_now';
  category = 'python_datetime';

  definition = {
    message0: 'datetime.now()',
    output: null,
    colour: '#eb2f96',
    tooltip: '获取当前日期和时间',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    return ['datetime.now()', Order.FUNCTION_CALL];
  };
}

/**
 * parser.parse() - 解析日期字符串
 */
export class ParserParseBlock extends BlockDefinition {
  type = 'parser_parse';
  category = 'python_datetime';

  definition = {
    message0: 'parser.parse %1',
    args0: [
      {
        type: 'input_value',
        name: 'DATE_STRING',
        check: 'String',
      },
    ],
    output: null,
    colour: '#eb2f96',
    tooltip: '解析日期字符串为 datetime 对象',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const dateString = BlockHelper.getInputValue(block, 'DATE_STRING', Order.NONE) || '\'\'';
    return [`parser.parse(${dateString})`, Order.FUNCTION_CALL];
  };
}

/**
 * datetime.strptime() - 按格式解析日期
 */
export class DatetimeStrptimeBlock extends BlockDefinition {
  type = 'datetime_strptime';
  category = 'python_datetime';

  definition = {
    message0: 'datetime.strptime %1 格式 %2',
    args0: [
      {
        type: 'input_value',
        name: 'DATE_STRING',
        check: 'String',
      },
      {
        type: 'input_value',
        name: 'FORMAT',
        check: 'String',
      },
    ],
    output: null,
    colour: '#eb2f96',
    tooltip: '按指定格式解析日期字符串（如：\'%Y-%m-%d %H:%M:%S\'）',
    helpUrl: '',
    inputsInline: false,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const dateString = BlockHelper.getInputValue(block, 'DATE_STRING', Order.NONE) || '\'\'';
    const format = BlockHelper.getInputValue(block, 'FORMAT', Order.NONE) || '\'%Y-%m-%d\'';
    return [`datetime.strptime(${dateString}, ${format})`, Order.FUNCTION_CALL];
  };
}

/**
 * datetime.strftime() - 格式化日期
 */
export class DatetimeStrftimeBlock extends BlockDefinition {
  type = 'datetime_strftime';
  category = 'python_datetime';

  definition = {
    message0: '%1 .strftime %2',
    args0: [
      {
        type: 'input_value',
        name: 'DATETIME',
      },
      {
        type: 'input_value',
        name: 'FORMAT',
        check: 'String',
      },
    ],
    output: 'String',
    colour: '#eb2f96',
    tooltip: '将 datetime 对象格式化为字符串',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const datetime = BlockHelper.getInputValue(block, 'DATETIME', Order.MEMBER) || 'datetime.now()';
    const format = BlockHelper.getInputValue(block, 'FORMAT', Order.NONE) || '\'%Y-%m-%d %H:%M:%S\'';
    return [`${datetime}.strftime(${format})`, Order.FUNCTION_CALL];
  };
}

/**
 * timedelta - 时间差
 */
export class TimedeltaBlock extends BlockDefinition {
  type = 'timedelta';
  category = 'python_datetime';

  definition = {
    message0: 'timedelta 天数 %1 小时 %2 分钟 %3 秒 %4',
    args0: [
      {
        type: 'input_value',
        name: 'DAYS',
        check: 'Number',
      },
      {
        type: 'input_value',
        name: 'HOURS',
        check: 'Number',
      },
      {
        type: 'input_value',
        name: 'MINUTES',
        check: 'Number',
      },
      {
        type: 'input_value',
        name: 'SECONDS',
        check: 'Number',
      },
    ],
    output: null,
    colour: '#eb2f96',
    tooltip: '创建时间差对象（用于日期加减运算）',
    helpUrl: '',
    inputsInline: false,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const days = BlockHelper.getInputValue(block, 'DAYS', Order.NONE);
    const hours = BlockHelper.getInputValue(block, 'HOURS', Order.NONE);
    const minutes = BlockHelper.getInputValue(block, 'MINUTES', Order.NONE);
    const seconds = BlockHelper.getInputValue(block, 'SECONDS', Order.NONE);

    const parts: string[] = [];
    if (days) parts.push(`days=${days}`);
    if (hours) parts.push(`hours=${hours}`);
    if (minutes) parts.push(`minutes=${minutes}`);
    if (seconds) parts.push(`seconds=${seconds}`);

    const code = parts.length > 0 ? `timedelta(${parts.join(', ')})` : 'timedelta()';
    return [code, Order.FUNCTION_CALL];
  };
}

/**
 * 导入 timedelta
 */
export class ImportTimedeltaBlock extends BlockDefinition {
  type = 'import_timedelta';
  category = 'python_datetime';

  definition = {
    message0: 'from datetime import timedelta',
    previousStatement: null,
    nextStatement: null,
    colour: '#eb2f96',
    tooltip: '导入 timedelta 用于时间差计算',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): string => {
    return 'from datetime import timedelta\n';
  };
}

/**
 * 日期属性访问 - year, month, day 等
 */
export class DatetimeAttributeBlock extends BlockDefinition {
  type = 'datetime_attribute';
  category = 'python_datetime';

  definition = {
    message0: '%1 . %2',
    args0: [
      {
        type: 'input_value',
        name: 'DATETIME',
      },
      {
        type: 'field_dropdown',
        name: 'ATTRIBUTE',
        options: [
          ['year (年)', 'year'],
          ['month (月)', 'month'],
          ['day (日)', 'day'],
          ['hour (小时)', 'hour'],
          ['minute (分钟)', 'minute'],
          ['second (秒)', 'second'],
          ['microsecond (微秒)', 'microsecond'],
          ['weekday() (星期)', 'weekday()'],
          ['isoformat() (ISO格式)', 'isoformat()'],
        ],
      },
    ],
    output: null,
    colour: '#eb2f96',
    tooltip: '获取日期时间对象的属性',
    helpUrl: '',
    inputsInline: true,
  };

  generator = (block: Blockly.Block): [string, number] => {
    const datetime = BlockHelper.getInputValue(block, 'DATETIME', Order.MEMBER) || 'datetime.now()';
    const attribute = BlockHelper.getFieldValue(block, 'ATTRIBUTE');
    return [`${datetime}.${attribute}`, Order.MEMBER];
  };
}

/**
 * 日期格式常量块
 */
export class DateFormatBlock extends BlockDefinition {
  type = 'date_format';
  category = 'python_datetime';

  definition = {
    message0: '日期格式 %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'FORMAT',
        options: [
          ['%Y-%m-%d (2024-01-15)', '%Y-%m-%d'],
          ['%Y/%m/%d (2024/01/15)', '%Y/%m/%d'],
          ['%Y-%m-%d %H:%M:%S (完整)', '%Y-%m-%d %H:%M:%S'],
          ['%Y-%m-%d %H:%M', '%Y-%m-%d %H:%M'],
          ['%Y年%m月%d日', '%Y年%m月%d日'],
          ['%Y年%m月%d日 %H:%M:%S', '%Y年%m月%d日 %H:%M:%S'],
          ['%H:%M:%S (时:分:秒)', '%H:%M:%S'],
          ['%H:%M (时:分)', '%H:%M'],
          ['%Y%m%d (20240115)', '%Y%m%d'],
          ['%Y%m%d%H%M%S', '%Y%m%d%H%M%S'],
          ['ISO 8601 (%Y-%m-%dT%H:%M:%S)', '%Y-%m-%dT%H:%M:%S'],
        ],
      },
    ],
    output: 'String',
    colour: '#eb2f96',
    tooltip: '常用日期时间格式字符串',
    helpUrl: '',
  };

  generator = (block: Blockly.Block): [string, number] => {
    const format = BlockHelper.getFieldValue(block, 'FORMAT');
    return [`'${format}'`, Order.ATOMIC];
  };
}
