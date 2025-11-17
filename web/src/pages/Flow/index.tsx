import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import './index.css';

const Flow: React.FC = () => {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (blocklyDivRef.current && !workspaceRef.current) {
      // 初始化Blockly工作区
      workspaceRef.current = Blockly.inject(blocklyDivRef.current, {
        toolbox: getToolboxConfig(),
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

      // 添加示例块到工作区（可选）
      addExampleBlocks(workspaceRef.current);
    }

    return () => {
      // 清理工作区
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  // 获取工具箱配置
  const getToolboxConfig = () => {
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '构建',
          colour: '#5C7CFA',
          contents: [
            {
              kind: 'block',
              type: 'text',
            },
          ],
        },
        {
          kind: 'category',
          name: '部署',
          colour: '#52C41A',
          contents: [
            {
              kind: 'block',
              type: 'text_print',
            },
          ],
        },
        {
          kind: 'category',
          name: '通知',
          colour: '#FA8C16',
          contents: [
            {
              kind: 'block',
              type: 'math_number',
            },
          ],
        },
        {
          kind: 'category',
          name: '工具',
          colour: '#722ED1',
          contents: [
            {
              kind: 'block',
              type: 'logic_boolean',
            },
          ],
        },
      ],
    };
  };

  // 添加示例块
  const addExampleBlocks = (_workspace: Blockly.WorkspaceSvg) => {
    // 可以在这里添加一些默认块到工作区
    // const block = _workspace.newBlock('text');
    // block.initSvg();
    // block.render();
  };

  // 保存流程
  const handleSave = () => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);
      console.log('保存的流程:', xmlText);

      // TODO: 调用API保存流程
      alert('流程已保存到控制台');
    }
  };

  // 执行流程
  const handleExecute = () => {
    if (workspaceRef.current) {
      // TODO: 实现流程执行逻辑
      alert('流程执行功能待实现');
    }
  };

  // 导出流程
  const handleExport = () => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      // 创建下载链接
      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'blockflow-workflow.xml';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flow-container">
      <div className="flow-header">
        <h1>BlockFlow - 可视化部署编排平台</h1>
        <div className="flow-actions">
          <a href="/manage">进入管理后台</a>
        </div>
      </div>

      <div className="flow-content">
        <div className="flow-workspace">
          <div ref={blocklyDivRef} id="blocklyDiv" className="blockly-workspace" />
        </div>
      </div>

      <div className="flow-footer">
        <button className="btn-primary" onClick={handleSave}>
          保存流程
        </button>
        <button className="btn-success" onClick={handleExecute}>
          执行流程
        </button>
        <button className="btn-default" onClick={handleExport}>
          导出
        </button>
      </div>
    </div>
  );
};

export default Flow;
