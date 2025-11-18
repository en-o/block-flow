import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import Login from './pages/Login';
import Flow from './pages/Flow';
import BlockEditor from './pages/BlockEditor';
import Manage from './pages/Manage';
import Blocks from './pages/Manage/Blocks';
import BlockTypes from './pages/Manage/BlockTypes';
import Context from './pages/Manage/Context';
import PythonEnvironments from './pages/Manage/PythonEnvironments';
import Users from './pages/Manage/Users';
import Profile from './pages/Manage/Profile';
import PrivateRoute from './components/PrivateRoute';
import { setGlobalMessage } from './utils/messageInstance';
import './App.css';

/**
 * 应用内容组件
 * 使用 useApp hook 获取 message 实例并设置到全局
 */
const AppContent: React.FC = () => {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    // 将 message 实例设置到全局，供 axios 拦截器使用
    setGlobalMessage(message);
    console.log('[App] 全局 message 已初始化');
  }, [message]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />

        {/* Flow页面 - 无需鉴权 */}
        <Route path="/flow" element={<Flow />} />

        {/* 块编辑器 - 需要鉴权 */}
        <Route
          path="/block-editor/:id?"
          element={
            <PrivateRoute>
              <BlockEditor />
            </PrivateRoute>
          }
        />

        {/* 管理后台 - 需要鉴权 */}
        <Route
          path="/manage"
          element={
            <PrivateRoute>
              <Manage />
            </PrivateRoute>
          }
        >
          {/* 默认重定向到块管理 */}
          <Route index element={<Navigate to="/manage/blocks" replace />} />
          <Route path="blocks" element={<Blocks />} />
          <Route path="block-types" element={<BlockTypes />} />
          <Route path="python-envs" element={<PythonEnvironments />} />
          <Route path="context" element={<Context />} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 默认重定向到Flow页面 */}
        <Route path="/" element={<Navigate to="/flow" replace />} />

        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/flow" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * 根组件
 * 必须使用 AntdApp 包裹，以提供 message、modal、notification 等静态方法的上下文
 */
const App: React.FC = () => {
  return (
    <AntdApp>
      <AppContent />
    </AntdApp>
  );
};

export default App;
