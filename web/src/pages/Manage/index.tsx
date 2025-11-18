import React, { useState } from 'react';
import { Layout, Menu, message, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  BlockOutlined,
  AppstoreOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import './index.css';

const { Header, Sider, Content } = Layout;

const Manage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const userInfo = authUtils.getUserInfo();

  const menuItems = [
    {
      key: '/manage/blocks',
      icon: <BlockOutlined />,
      label: '块管理',
    },
    {
      key: '/manage/block-types',
      icon: <AppstoreOutlined />,
      label: '块类型管理',
    },
    {
      key: '/manage/python-envs',
      icon: <EnvironmentOutlined />,
      label: 'Python环境',
    },
    {
      key: '/manage/context',
      icon: <SettingOutlined />,
      label: '上下文变量',
    },
    {
      key: '/manage/users',
      icon: <TeamOutlined />,
      label: '用户管理',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    authUtils.clearAuth();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => navigate('/manage/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="manage-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div className="logo">
          <h2>{collapsed ? 'BF' : 'BlockFlow'}</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header className="manage-header">
          <div className="header-left">
            <h2>管理后台</h2>
          </div>
          <div className="header-right">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span className="user-info" style={{ cursor: 'pointer' }}>
                <UserOutlined /> {userInfo?.username || 'Admin'} <DownOutlined />
              </span>
            </Dropdown>
            <a href="/flow" target="_blank" rel="noopener noreferrer">
              前往流程编排
            </a>
          </div>
        </Header>

        <Content className="manage-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Manage;
