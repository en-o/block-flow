import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { authUtils, UserRole } from '../../utils/auth';
import type { LoginRequest } from '../../types/api';
import './index.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);

      // 保存token和用户信息
      if (response.data) {
        authUtils.setToken(response.data.token);
        authUtils.setUserInfo({
          username: values.loginName,  // 使用输入的登录名作为username
          role: response.data.role,
        });

        message.success('登录成功');

        // 根据角色跳转到不同页面
        const role = response.data.role;
        if (role === UserRole.VIEWER) {
          // VIEWER 只能访问 /flow 页面
          navigate('/flow');
        } else {
          // ADMIN 和 USER 跳转到管理页面
          navigate('/manage');
        }
      }
    } catch (error: any) {
      // 错误已经在拦截器中显示，这里不需要再次显示
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="BlockFlow 登录">
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="loginName"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-tips">
          <p>提示：首次使用请联系管理员创建账号</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
