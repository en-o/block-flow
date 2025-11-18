import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge, Tooltip } from 'antd';
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
}

const BlockNode: React.FC<NodeProps<BlockNodeData>> = ({ data, selected }) => {
  const { blockName, blockTypeCode, color = '#5C7CFA', description, icon } = data;

  return (
    <div
      className="block-node"
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: '#fff',
        border: `2px solid ${selected ? color : '#d9d9d9'}`,
        boxShadow: selected ? `0 4px 12px ${color}40` : '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '180px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* 输入连接点 */}
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

      {/* 节点内容 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              marginTop: '8px',
              fontSize: '12px',
              color: '#595959',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </div>
        </Tooltip>
      )}

      {/* 输出连接点 */}
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
    </div>
  );
};

export default memo(BlockNode);
