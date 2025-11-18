import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Descriptions, Divider, Space, Tag } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { userApi } from '../../api/user';
import type { User, UpdateProfileDTO, ChangePasswordDTO } from '../../types/api';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.code === 200 && response.data) {
        setUser(response.data);
        profileForm.setFieldsValue({
          email: response.data.email,
          realName: response.data.realName,
        });
      }
    } catch (error) {
      console.error('获取个人信息失败', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const values = await profileForm.validateFields();
      const updateData: UpdateProfileDTO = values;

      const response = await userApi.updateProfile(updateData);
      if (response.code === 200) {
        message.success('个人信息更新成功');
        fetchProfile();
      }
    } catch (error) {
      console.error('更新个人信息失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      const values = await passwordForm.validateFields();
      const changeData: ChangePasswordDTO = {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      };

      const response = await userApi.changePassword(changeData);
      if (response.code === 200) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('修改密码失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role: 'ADMIN' | 'USER' | 'VIEWER') => {
    const colorMap: Record<string, string> = {
      ADMIN: 'red',
      USER: 'blue',
      VIEWER: 'green',
    };
    const nameMap: Record<string, string> = {
      ADMIN: '管理员',
      USER: '用户',
      VIEWER: '访客',
    };
    return <Tag color={colorMap[role]}>{nameMap[role]}</Tag>;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 基本信息卡片 */}
      <Card title={<><UserOutlined /> 基本信息</>} style={{ marginBottom: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="角色">{user && getRoleTag(user.role)}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{user?.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="账户状态">
            <Tag color={user?.isActive ? 'success' : 'default'}>
              {user?.isActive ? '激活' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            {user?.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {user?.createTime ? new Date(user.createTime).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {user?.updateTime ? new Date(user.updateTime).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 编辑个人信息 */}
      <Card title="编辑个人信息" style={{ marginBottom: 24 }}>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            label="真实姓名"
            name="realName"
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 修改密码 */}
      <Card title={<><LockOutlined /> 修改密码</>}>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="旧密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LockOutlined />}
              loading={loading}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;
