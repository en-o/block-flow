import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Card,
  InputNumber,
  Switch,
  Divider,
  List,
  Popconfirm,
  App,
  Upload,
  Tooltip,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import { pythonEnvApi } from '../../api/pythonEnv';
import type { PythonEnvironment, PythonEnvironmentCreateDTO, PythonEnvironmentUpdateDTO, PythonEnvironmentPage } from '../../types/api';

const PythonEnvironments: React.FC = () => {
  const { modal } = App.useApp();
  const [environments, setEnvironments] = useState<PythonEnvironment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnv, setEditingEnv] = useState<PythonEnvironment | null>(null);
  const [searchParams, setSearchParams] = useState<PythonEnvironmentPage>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [packagesModalVisible, setPackagesModalVisible] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<PythonEnvironment | null>(null);
  const [packageForm] = Form.useForm();
  const [requirementsModalVisible, setRequirementsModalVisible] = useState(false);
  const [requirementsForm] = Form.useForm();
  const [uploadedFilesModalVisible, setUploadedFilesModalVisible] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);
  const [uploadingRuntime, setUploadingRuntime] = useState(false);
  const [detectingPython, setDetectingPython] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async (params?: PythonEnvironmentPage) => {
    setLoading(true);
    try {
      const queryParams: PythonEnvironmentPage = {
        ...searchParams,
        ...params,
        page: {
          pageNum: (params?.page?.pageNum !== undefined ? params.page.pageNum : pagination.current - 1),
          pageSize: (params?.page?.pageSize !== undefined ? params.page.pageSize : pagination.pageSize),
        }
      };

      const response = await pythonEnvApi.page(queryParams);
      if (response.code === 200 && response.data) {
        setEnvironments(response.data.rows || []);
        setPagination({
          current: response.data.currentPage,
          pageSize: response.data.pageSize,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('获取Python环境列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const values = await searchForm.validateFields();
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEnvironments({ ...values, page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchEnvironments({ page: { pageNum: 0, pageSize: pagination.pageSize } });
  };

  const handleAdd = () => {
    setEditingEnv(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PythonEnvironment) => {
    setEditingEnv(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个Python环境吗？',
      onOk: async () => {
        try {
          await pythonEnvApi.delete(id);
          message.success('删除成功');
          fetchEnvironments();
        } catch (error: any) {
          message.error(error.message || '删除失败');
          throw error; // 抛出错误以保持 Modal 打开
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingEnv) {
        const updateData: PythonEnvironmentUpdateDTO = {
          id: editingEnv.id,
          ...values
        };
        await pythonEnvApi.update(updateData);
        message.success('更新成功');
      } else {
        const createData: PythonEnvironmentCreateDTO = values;
        await pythonEnvApi.create(createData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchEnvironments();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await pythonEnvApi.setAsDefault(id);
      message.success('设置默认环境成功');
      fetchEnvironments();
    } catch (error) {
      console.error('设置默认环境失败', error);
    }
  };

  const handleManagePackages = (record: PythonEnvironment) => {
    setSelectedEnv(record);
    setPackagesModalVisible(true);
  };

  const handleInstallPackage = async () => {
    if (!selectedEnv) return;

    try {
      const values = await packageForm.validateFields();
      await pythonEnvApi.installPackage(selectedEnv.id, values);
      message.success('安装成功');
      packageForm.resetFields();
      fetchEnvironments();
    } catch (error) {
      console.error('安装包失败', error);
    }
  };

  const handleUninstallPackage = async (packageName: string) => {
    if (!selectedEnv) return;

    try {
      await pythonEnvApi.uninstallPackage(selectedEnv.id, packageName);
      message.success('卸载成功');
      fetchEnvironments();
    } catch (error) {
      console.error('卸载包失败', error);
    }
  };

  const handleExportRequirements = async (env: PythonEnvironment) => {
    try {
      const response = await pythonEnvApi.exportRequirements(env.id);
      if (response.code === 200 && response.data) {
        const blob = new Blob([response.data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `requirements-${env.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('导出成功');
      }
    } catch (error) {
      console.error('导出失败', error);
    }
  };

  const handleImportRequirements = async () => {
    if (!selectedEnv) return;

    try {
      const values = await requirementsForm.validateFields();
      await pythonEnvApi.importRequirements(selectedEnv.id, values.requirementsText);
      message.success('导入成功');
      setRequirementsModalVisible(false);
      requirementsForm.resetFields();
      fetchEnvironments();
    } catch (error) {
      console.error('导入失败', error);
    }
  };

  const handleInitializeEnvironment = async (env: PythonEnvironment) => {
    try {
      await pythonEnvApi.initializeEnvironment(env.id);
      message.success('环境初始化成功');
      fetchEnvironments();
    } catch (error: any) {
      message.error(error.message || '初始化失败');
    }
  };

  const handleShowUploadedFiles = async (env: PythonEnvironment) => {
    setSelectedEnv(env);
    try {
      const response = await pythonEnvApi.listUploadedPackageFiles(env.id);
      if (response.code === 200 && response.data) {
        setUploadedFiles(response.data);
      }
      setUploadedFilesModalVisible(true);
    } catch (error: any) {
      message.error(error.message || '获取包列表失败');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedEnv) return false;

    // 验证文件类型
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.whl') && !fileName.endsWith('.tar.gz')) {
      message.error('仅支持 .whl 和 .tar.gz 格式的包文件');
      return false;
    }

    setUploadingFile(true);
    try {
      const response = await pythonEnvApi.uploadPackageFile(selectedEnv.id, file);
      if (response.code === 200) {
        message.success('上传成功');
        // 刷新列表
        const listResponse = await pythonEnvApi.listUploadedPackageFiles(selectedEnv.id);
        if (listResponse.code === 200 && listResponse.data) {
          setUploadedFiles(listResponse.data);
        }
      }
    } catch (error: any) {
      message.error(error.message || '上传失败');
    } finally {
      setUploadingFile(false);
    }
    return false; // 阻止默认上传行为
  };

  const handleInstallPackageFile = async (fileName: string) => {
    if (!selectedEnv) return;

    setInstallingPackage(fileName);
    try {
      await pythonEnvApi.installPackageFile(selectedEnv.id, fileName);
      message.success('安装成功');
      // 刷新环境和包列表
      fetchEnvironments();
      const listResponse = await pythonEnvApi.listUploadedPackageFiles(selectedEnv.id);
      if (listResponse.code === 200 && listResponse.data) {
        setUploadedFiles(listResponse.data);
      }
    } catch (error: any) {
      message.error(error.message || '安装失败');
    } finally {
      setInstallingPackage(null);
    }
  };

  const handleDeletePackageFile = async (fileName: string) => {
    if (!selectedEnv) return;

    try {
      await pythonEnvApi.deletePackageFile(selectedEnv.id, fileName);
      message.success('删除成功');
      // 刷新列表
      const listResponse = await pythonEnvApi.listUploadedPackageFiles(selectedEnv.id);
      if (listResponse.code === 200 && listResponse.data) {
        setUploadedFiles(listResponse.data);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleRuntimeUpload = async (file: File) => {
    if (!selectedEnv) return false;

    // 验证文件类型
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.zip') && !fileName.endsWith('.tar.gz') && !fileName.endsWith('.tgz')) {
      message.error('仅支持 .zip、.tar.gz 和 .tgz 格式的压缩包');
      return false;
    }

    // 验证文件大小（2GB）
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      message.error('文件大小不能超过 2GB');
      return false;
    }

    setUploadingRuntime(true);
    try {
      const response = await pythonEnvApi.uploadPythonRuntime(selectedEnv.id, file);
      if (response.code === 200 && response.data) {
        message.success('Python运行时上传并配置成功');
        // 显示检测到的信息
        modal.success({
          title: 'Python运行时配置成功',
          width: 600,
          content: (
            <div>
              <p><strong>文件名:</strong> {response.data.fileName}</p>
              <p><strong>文件大小:</strong> {(response.data.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>解压路径:</strong> {response.data.extractPath}</p>
              <p><strong>Python路径:</strong> {response.data.pythonExecutable || '未检测到'}</p>
              <p><strong>Python版本:</strong> {response.data.pythonVersion || '未检测到'}</p>
              <p><strong>site-packages:</strong> {response.data.sitePackagesPath || '未检测到'}</p>
            </div>
          ),
        });
        // 刷新环境列表
        fetchEnvironments();
      }
    } catch (error: any) {
      message.error(error.message || '上传失败');
    } finally {
      setUploadingRuntime(false);
    }
    return false; // 阻止默认上传行为
  };

  const handleDetectPython = async () => {
    if (!selectedEnv) return;

    setDetectingPython(true);
    try {
      const response = await pythonEnvApi.detectPythonExecutable(selectedEnv.id);
      if (response.code === 200 && response.data) {
        message.success('Python路径检测成功');
        // 显示检测结果
        modal.info({
          title: 'Python路径检测结果',
          width: 600,
          content: (
            <div>
              <p><strong>Python路径:</strong> {response.data.pythonExecutable || '未检测到'}</p>
              <p><strong>Python版本:</strong> {response.data.pythonVersion || '未检测到'}</p>
              <p><strong>site-packages:</strong> {response.data.sitePackagesPath || '未检测到'}</p>
            </div>
          ),
        });
        // 刷新环境列表
        fetchEnvironments();
      }
    } catch (error: any) {
      message.error(error.message || '检测失败');
    } finally {
      setDetectingPython(false);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchEnvironments({
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
      title: '环境名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: PythonEnvironment) => (
        <Space>
          {name}
          {record.isDefault && (
            <Tag icon={<StarFilled />} color="gold">
              默认
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Python版本',
      dataIndex: 'pythonVersion',
      key: 'pythonVersion',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: '已安装包',
      dataIndex: 'packages',
      key: 'packages',
      width: 150,
      render: (packages: Record<string, any>) => {
        const count = packages ? Object.keys(packages).length : 0;
        return (
          <Tag color="blue">
            {count} 个包
          </Tag>
        );
      },
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
      width: 380,
      fixed: 'right' as const,
      render: (_: any, record: PythonEnvironment) => (
        <Space>
          {!record.envRootPath && (
            <Tooltip title="初始化环境目录结构">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => handleInitializeEnvironment(record)}
                size="small"
              >
                初始化
              </Button>
            </Tooltip>
          )}
          {!record.isDefault && (
            <Button
              type="link"
              icon={<StarOutlined />}
              onClick={() => handleSetDefault(record.id)}
            >
              设为默认
            </Button>
          )}
          <Button
            type="link"
            onClick={() => handleManagePackages(record)}
          >
            管理包
          </Button>
          {record.envRootPath && (
            <Button
              type="link"
              icon={<UploadOutlined />}
              onClick={() => handleShowUploadedFiles(record)}
            >
              离线包
            </Button>
          )}
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleExportRequirements(record)}
          >
            导出
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.isDefault}
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
          <Form.Item name="name" label="环境名称">
            <Input placeholder="请输入环境名称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="pythonVersion" label="Python版本">
            <Input placeholder="例如: 3.9" style={{ width: 150 }} />
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
          新建Python环境
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={environments}
        loading={loading}
        rowKey="id"
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
      />

      {/* 编辑/新建 Modal */}
      <Modal
        title={editingEnv ? '编辑Python环境' : '新建Python环境'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="环境名称"
            name="name"
            rules={[{ required: true, message: '请输入环境名称' }]}
          >
            <Input placeholder="例如: python39-prod" />
          </Form.Item>

          <Form.Item
            label="Python版本"
            name="pythonVersion"
            rules={[{ required: true, message: '请输入Python版本' }]}
          >
            <Input placeholder="例如: 3.9.16" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="环境描述" />
          </Form.Item>

          <Form.Item label="Python解释器路径" name="pythonExecutable">
            <Input placeholder="例如: C:\Python39\python.exe 或 /usr/bin/python3" />
          </Form.Item>

          <Form.Item
            label="是否默认"
            name="isDefault"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 离线包管理 Modal */}
      <Modal
        title={`离线包管理 - ${selectedEnv?.name}`}
        open={uploadedFilesModalVisible}
        onCancel={() => {
          setUploadedFilesModalVisible(false);
          setSelectedEnv(null);
          setUploadedFiles([]);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setUploadedFilesModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {/* Python运行时上传 */}
        <Card
          size="small"
          title={
            <Space>
              <RocketOutlined />
              <span>上传Python运行时环境</span>
            </Space>
          }
          style={{ marginBottom: 16, borderColor: '#1890ff' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              上传完整的Python环境压缩包，系统将自动解压并检测Python可执行文件路径
            </div>
            <Space>
              <Upload
                beforeUpload={handleRuntimeUpload}
                showUploadList={false}
                accept=".zip,.tar.gz,.tgz"
              >
                <Button
                  icon={<RocketOutlined />}
                  loading={uploadingRuntime}
                  type="primary"
                >
                  {uploadingRuntime ? '上传中...' : '选择Python运行时上传'}
                </Button>
              </Upload>
              <Button
                icon={<ScanOutlined />}
                onClick={handleDetectPython}
                loading={detectingPython}
              >
                {detectingPython ? '检测中...' : '自动检测Python路径'}
              </Button>
            </Space>
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              • 支持 .zip、.tar.gz 和 .tgz 格式
              <br />
              • 文件大小限制 2GB
              <br />
              • 系统将自动检测并配置 Python 解释器路径、版本和 site-packages 路径
            </div>
            {selectedEnv?.pythonExecutable && (
              <div style={{ marginTop: 8, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div><strong>当前配置:</strong></div>
                <div>Python路径: {selectedEnv.pythonExecutable}</div>
                {selectedEnv.pythonVersion && <div>Python版本: {selectedEnv.pythonVersion}</div>}
                {selectedEnv.sitePackagesPath && <div>site-packages: {selectedEnv.sitePackagesPath}</div>}
              </div>
            )}
          </Space>
        </Card>

        <Divider style={{ margin: '16px 0' }} />

        <Card size="small" title="上传离线包" style={{ marginBottom: 16 }}>
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".whl,.tar.gz"
          >
            <Button icon={<UploadOutlined />} loading={uploadingFile}>
              {uploadingFile ? '上传中...' : '选择文件上传 (.whl 或 .tar.gz)'}
            </Button>
          </Upload>
          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            • 支持 .whl 和 .tar.gz 格式
            <br />
            • 文件大小限制 500MB
          </div>
        </Card>

        <Card size="small" title="已上传包文件">
          {uploadedFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              暂无已上传的包文件
            </div>
          ) : (
            <List
              dataSource={uploadedFiles}
              renderItem={(file: any) => (
                <List.Item
                  actions={[
                    <Button
                      key="install"
                      type="primary"
                      size="small"
                      icon={file.installed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      onClick={() => handleInstallPackageFile(file.fileName)}
                      loading={installingPackage === file.fileName}
                      disabled={file.installed}
                    >
                      {file.installed ? '已安装' : '安装'}
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="确定删除这个包文件吗？"
                      onConfirm={() => handleDeletePackageFile(file.fileName)}
                    >
                      <Button type="link" danger size="small">
                        删除
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{file.fileName}</span>
                        {file.installed && <Tag color="green">已安装</Tag>}
                      </Space>
                    }
                    description={
                      <Space split="|分">
                        <span>大小: {(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span>类型: {file.fileType}</span>
                        <span>上传时间: {new Date(file.uploadTime).toLocaleString()}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Modal>

      {/* 管理包 Modal */}
      <Modal
        title={`管理包 - ${selectedEnv?.name}`}
        open={packagesModalVisible}
        onCancel={() => {
          setPackagesModalVisible(false);
          setSelectedEnv(null);
        }}
        width={700}
        footer={[
          <Button
            key="import"
            icon={<UploadOutlined />}
            onClick={() => {
              setPackagesModalVisible(false);
              setRequirementsModalVisible(true);
            }}
          >
            导入 requirements.txt
          </Button>,
          <Button key="close" onClick={() => setPackagesModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Card size="small" title="安装新包" style={{ marginBottom: 16 }}>
          <Form form={packageForm} layout="inline">
            <Form.Item
              name="packageName"
              rules={[{ required: true, message: '请输入包名' }]}
            >
              <Input placeholder="包名，例如: requests" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="version">
              <Input placeholder="版本（可选）" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleInstallPackage}>
                安装
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card size="small" title="已安装包">
          <List
            dataSource={selectedEnv?.packages ? Object.entries(selectedEnv.packages) : []}
            renderItem={([name, version]) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="uninstall"
                    title="确定卸载这个包吗？"
                    onConfirm={() => handleUninstallPackage(name)}
                  >
                    <Button type="link" danger size="small">
                      卸载
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={name}
                  description={`版本: ${version || '未知'}`}
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无已安装的包' }}
          />
        </Card>
      </Modal>

      {/* 导入 requirements.txt Modal */}
      <Modal
        title={`导入 requirements.txt - ${selectedEnv?.name}`}
        open={requirementsModalVisible}
        onOk={handleImportRequirements}
        onCancel={() => {
          setRequirementsModalVisible(false);
          requirementsForm.resetFields();
        }}
        width={700}
      >
        <Form form={requirementsForm} layout="vertical">
          <Form.Item
            label="requirements.txt 内容"
            name="requirementsText"
            rules={[{ required: true, message: '请输入requirements内容' }]}
            tooltip="每行一个包，格式: package==version"
          >
            <Input.TextArea
              rows={15}
              placeholder={'requests==2.28.0\nnumpy==1.24.0\npandas==1.5.0'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PythonEnvironments;
