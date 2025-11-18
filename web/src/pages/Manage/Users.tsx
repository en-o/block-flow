import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Card,
  Switch,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LockOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { userApi } from '../../api/user';
import type { User, UserCreateDTO, UserUpdateDTO, UserPage } from '../../types/api';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [searchParams, setSearchParams] = useState<UserPage>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (params?: UserPage) => {
    setLoading(true);
    try {
      const queryParams: UserPage = {
        ...searchParams,
        ...params,
        page: {
          pageNum: (params?.page?.pageNum !== undefined ? params.page.pageNum : pagination.current - 1),
          pageSize: (params?.page?.pageSize !== undefined ? params.page.pageSize : pagination.pageSize),
        }
      };

      const response = await userApi.page(queryParams);
      if (response.code === 200 && response.data) {
        setUsers(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取用户列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers({ ...values, page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers({ page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      realName: record.realName,
      role: record.role,
      isActive: record.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？删除后将无法恢复。',
      onOk: async () => {
        try {
          await userApi.delete(id);
          message.success('删除成功');
          fetchUsers();
        } catch (error) {
          console.error('删除失败', error);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        const updateData: UserUpdateDTO = {
          id: editingUser.id,
          ...values
        };
        await userApi.update(updateData);
        message.success('更新成功');
      } else {
        const createData: UserCreateDTO = values;
        await userApi.create(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userApi.toggleActive(user.id);
      message.success(`已${user.isActive ? '停用' : '激活'}用户`);
      fetchUsers();
    } catch (error) {
      console.error('操作失败', error);
    }
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    resetPasswordForm.resetFields();
    setResetPasswordModalVisible(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordUser) return;

    try {
      const values = await resetPasswordForm.validateFields();
      await userApi.resetPassword(resetPasswordUser.id, values.newPassword);
      message.success('密码重置成功');
      setResetPasswordModalVisible(false);
      resetPasswordForm.resetFields();
    } catch (error) {
      console.error('重置密码失败', error);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchUsers({
      ...searchParams,
      page: {
        pageNum: pag.current - 1,
        pageSize: pag.pageSize
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: 'ADMIN' | 'USER' | 'VIEWER') => {
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
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
          {isActive ? '激活' : '停用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 180,
      render: (time?: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确定${record.isActive ? '停用' : '激活'}该用户吗？`}
            onConfirm={() => handleToggleActive(record)}
          >
            <Button type="link">
              {record.isActive ? '停用' : '激活'}
            </Button>
          </Popconfirm>
          <Button
            type="link"
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }} size="small">
        <Form form={searchForm} layout="inline">
          <Form.Item name="username" label="用户名">
            <Input placeholder="请输入用户名" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select placeholder="请选择角色" style={{ width: 150 }} allowClear>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="USER">用户</Select.Option>
              <Select.Option value="VIEWER">访客</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value={true}>激活</Select.Option>
              <Select.Option value={false}>停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleResetSearch}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新建用户
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item label="真实姓名" name="realName">
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="userRole"
            initialValue="USER"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="USER">用户</Select.Option>
              <Select.Option value="VIEWER">访客</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="激活" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码 Modal */}
      <Modal
        title={`重置密码 - ${resetPasswordUser?.username}`}
        open={resetPasswordModalVisible}
        onOk={handleResetPasswordSubmit}
        onCancel={() => {
          setResetPasswordModalVisible(false);
          resetPasswordForm.resetFields();
        }}
      >
        <Form form={resetPasswordForm} layout="vertical">
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
            label="确认密码"
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
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
