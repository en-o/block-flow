import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tooltip, Tag } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

export interface BlockNodeData {
  blockId: number;
  blockName: string;
  blockTypeCode: string;
  color?: string;
  description?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  icon?: string;
  inputValues?: Record<string, any>; // 存储每个输入参数的配置值（用于未连接的输入）
  [key: string]: any; // 索引签名，允许ReactFlow兼容
}

const BlockNode: React.FC<any> = ({ data, selected }) => {
  const { blockName, blockTypeCode, color = '#5C7CFA', description, icon, inputs = {}, outputs = {} } = data;

  // 将 inputs 和 outputs 转换为数组
  const inputList = Object.entries(inputs).map(([name, param]: [string, any]) => ({
    name,
    ...param
  }));
  const outputList = Object.entries(outputs).map(([name, param]: [string, any]) => ({
    name,
    ...param
  }));

  // 类型颜色映射
  const typeColorMap: Record<string, string> = {
    string: '#1890ff',
    number: '#52c41a',
    boolean: '#faad14',
    object: '#722ed1',
    array: '#eb2f96',
    any: '#8c8c8c',
  };

  return (
    <div
      className="block-node"
      style={{
        padding: '12px',
        borderRadius: '8px',
        background: '#fff',
        border: `2px solid ${selected ? color : '#d9d9d9'}`,
        boxShadow: selected ? `0 4px 12px ${color}40` : '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '200px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* 节点标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: inputList.length > 0 || outputList.length > 0 ? '8px' : '0' }}>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
        {!icon && <PlayCircleOutlined style={{ fontSize: '18px', color }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
            {blockName}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
            {blockTypeCode}
          </div>
        </div>
      </div>

      {/* 描述信息 */}
      {description && (
        <Tooltip title={description}>
          <div
            style={{
              fontSize: '12px',
              color: '#595959',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '8px',
            }}
          >
            {description}
          </div>
        </Tooltip>
      )}

      {/* 输入参数列表 */}
      {inputList.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px', fontWeight: 500 }}>输入:</div>
          {inputList.map((input, index) => (
            <div
              key={input.name}
              style={{
                position: 'relative',
                marginBottom: '4px',
                paddingLeft: '8px',
              }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`input-${input.name}`}
                style={{
                  width: '8px',
                  height: '8px',
                  background: typeColorMap[input.type] || '#8c8c8c',
                  border: '2px solid #fff',
                  left: '-5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <Tooltip title={`${input.description || '无描述'} ${input.required ? '(必填)' : '(可选)'}`}>
                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 500, color: '#262626' }}>{input.name}</span>
                  <Tag color={typeColorMap[input.type]} style={{ fontSize: '10px', lineHeight: '16px', margin: 0, padding: '0 4px' }}>
                    {input.type}
                  </Tag>
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {/* 输出参数列表 */}
      {outputList.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: '4px', fontWeight: 500 }}>输出:</div>
          {outputList.map((output, index) => (
            <div
              key={output.name}
              style={{
                position: 'relative',
                marginBottom: '4px',
                paddingRight: '8px',
                textAlign: 'right',
              }}
            >
              <Handle
                type="source"
                position={Position.Right}
                id={`output-${output.name}`}
                style={{
                  width: '8px',
                  height: '8px',
                  background: typeColorMap[output.type] || '#8c8c8c',
                  border: '2px solid #fff',
                  right: '-5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <Tooltip title={`${output.description || '无描述'}`}>
                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <Tag color={typeColorMap[output.type]} style={{ fontSize: '10px', lineHeight: '16px', margin: 0, padding: '0 4px' }}>
                    {output.type}
                  </Tag>
                  <span style={{ fontWeight: 500, color: '#262626' }}>{output.name}</span>
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {/* 如果没有输入输出，保留默认的连接点 */}
      {inputList.length === 0 && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '10px',
            height: '10px',
            background: color,
            border: '2px solid #fff',
          }}
        />
      )}

      {outputList.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '10px',
            height: '10px',
            background: color,
            border: '2px solid #fff',
          }}
        />
      )}
    </div>
  );
};

export default memo(BlockNode);
