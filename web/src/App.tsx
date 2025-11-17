import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Flow from './pages/Flow';
import Manage from './pages/Manage';
import Blocks from './pages/Manage/Blocks';
import BlockTypes from './pages/Manage/BlockTypes';
import Context from './pages/Manage/Context';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />

        {/* Flow页面 - 无需鉴权 */}
        <Route path="/flow" element={<Flow />} />

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
          <Route path="context" element={<Context />} />
        </Route>

        {/* 默认重定向到Flow页面 */}
        <Route path="/" element={<Navigate to="/flow" replace />} />

        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/flow" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
