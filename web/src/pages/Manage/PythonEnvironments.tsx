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
  Radio,
  Alert,
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
  const [uploadingRuntime, setUploadingRuntime] = useState(false);
  const [detectingPython, setDetectingPython] = useState(false);
  const [configMode, setConfigMode] = useState<'manual' | 'upload' | 'later'>('manual'); // Python配置模式
  const [runtimeFile, setRuntimeFile] = useState<File | null>(null); // 待上传的运行时文件
  const [installLogVisible, setInstallLogVisible] = useState(false); // 安装日志弹窗
  const [installLogs, setInstallLogs] = useState<string[]>([]); // 安装日志
  const [isInstalling, setIsInstalling] = useState(false); // 是否正在安装
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
    setConfigMode('manual');
    setRuntimeFile(null);
    setModalVisible(true);
  };

  const handleEdit = (record: PythonEnvironment) => {
    setEditingEnv(record);
    form.setFieldsValue(record);
    setConfigMode('manual');
    setRuntimeFile(null);
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
        // 编辑模式
        const updateData: PythonEnvironmentUpdateDTO = {
          id: editingEnv.id,
          ...values
        };
        await pythonEnvApi.update(updateData);
        message.success('更新成功');
        setModalVisible(false);
        fetchEnvironments();
      } else {
        // 创建模式
        const createData: PythonEnvironmentCreateDTO = values;
        const createResponse = await pythonEnvApi.create(createData);

        if (createResponse.code === 200 && createResponse.data) {
          const newEnvId = createResponse.data.id;

          // 初始化环境目录
          await pythonEnvApi.initializeEnvironment(newEnvId);

          // 根据配置模式进行后续操作
          if (configMode === 'upload' && runtimeFile) {
            // 上传Python运行时
            setUploadingRuntime(true);
            try {
              const uploadResponse = await pythonEnvApi.uploadPythonRuntime(newEnvId, runtimeFile);
              if (uploadResponse.code === 200 && uploadResponse.data) {
                message.success('环境创建并配置成功');

                // 构建提示内容
                const content = (
                  <div>
                    <p><strong>Python路径:</strong> {uploadResponse.data.pythonExecutable || '未检测到'}</p>
                    <p><strong>Python版本:</strong> {uploadResponse.data.pythonVersion || '未检测到'}</p>
                    <p><strong>site-packages:</strong> {uploadResponse.data.sitePackagesPath || '未检测到'}</p>
                    <p><strong>pip状态:</strong> {uploadResponse.data.hasPip ? <Tag color="green">已安装</Tag> : <Tag color="orange">未安装</Tag>}</p>
                    {uploadResponse.data.message && (
                      <Alert
                        message={uploadResponse.data.message}
                        type={uploadResponse.data.hasPip ? "info" : "warning"}
                        showIcon
                        style={{ marginTop: 12 }}
                      />
                    )}
                  </div>
                );

                // 根据pip状态显示不同类型的弹窗
                if (uploadResponse.data.hasPip) {
                  modal.success({
                    title: 'Python运行时配置成功',
                    width: 700,
                    content: content,
                  });
                } else {
                  modal.warning({
                    title: 'Python运行时配置成功（但缺少pip）',
                    width: 700,
                    content: content,
                  });
                }
              }
            } catch (error: any) {
              message.warning('环境创建成功，但运行时上传失败: ' + (error.message || '未知错误'));
            } finally {
              setUploadingRuntime(false);
            }
          } else if (configMode === 'manual' && values.pythonExecutable) {
            message.success('环境创建成功，已配置Python路径');
          } else {
            message.success('环境创建成功，请稍后配置Python运行时');
          }

          setModalVisible(false);
          fetchEnvironments();
        }
      }
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

      // 检查环境是否配置了Python
      if (!selectedEnv.pythonExecutable) {
        message.error('该环境未配置Python解释器路径,无法安装包。请先配置Python运行时。');
        return;
      }

      // 检查包是否已存在
      const packageName = values.packageName;
      const packages = selectedEnv.packages || {};
      const existingPackage = packages[packageName];

      // 如果包已存在，弹出确认对话框
      if (existingPackage) {
        const existingVersion = typeof existingPackage === 'object' && existingPackage.version
          ? existingPackage.version
          : '未知版本';
        const requestVersion = values.version || '最新版本';

        const confirmed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: '包已存在',
            content: (
              <div>
                <p>包 <strong>{packageName}</strong> 已安装。</p>
                <p>当前版本: <strong>{existingVersion}</strong></p>
                <p>请求安装版本: <strong>{requestVersion}</strong></p>
                <p style={{ marginTop: 16 }}>是否继续安装？这将覆盖或升级现有版本。</p>
              </div>
            ),
            okText: '继续安装',
            cancelText: '取消',
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmed) {
          return;
        }
      }

      // 显示安装日志窗口
      setInstallLogs([`开始安装 ${packageName}${values.version ? ' ' + values.version : ''}...`]);
      setInstallLogVisible(true);
      setIsInstalling(true);

      setInstallLogs(prev => [...prev, '正在执行 pip install 命令...']);
      setInstallLogs(prev => [...prev, '请稍候，这可能需要几秒到几分钟...']);

      const response = await pythonEnvApi.installPackage(selectedEnv.id, values);

      setInstallLogs(prev => [...prev, `✓ 包 ${values.packageName} 安装成功！`]);
      setIsInstalling(false);

      message.success(`包 ${values.packageName} 安装成功`);
      packageForm.resetFields();

      // 延迟关闭日志窗口
      setTimeout(() => {
        setInstallLogVisible(false);
      }, 2000);

      // 刷新环境列表以更新已安装包
      await fetchEnvironments();

      // 更新selectedEnv以显示最新的包列表
      const updatedEnv = await pythonEnvApi.getById(selectedEnv.id);
      if (updatedEnv.code === 200 && updatedEnv.data) {
        setSelectedEnv(updatedEnv.data);
      }

    } catch (error: any) {
      setInstallLogs(prev => [...prev, `✗ 安装失败: ${error.message || '未知错误'}`]);
      setIsInstalling(false);
      message.error({
        content: error.message || '安装包失败',
        duration: 5
      });
      console.error('安装包失败', error);
    }
  };

  const handleUninstallPackage = async (packageName: string) => {
    if (!selectedEnv) return;

    try {
      message.loading({ content: '正在卸载包...', key: 'uninstall', duration: 0 });

      await pythonEnvApi.uninstallPackage(selectedEnv.id, packageName);

      message.success({ content: `包 ${packageName} 卸载成功`, key: 'uninstall' });

      // 刷新环境列表
      await fetchEnvironments();

      // 更新selectedEnv以显示最新的包列表
      const updatedEnv = await pythonEnvApi.getById(selectedEnv.id);
      if (updatedEnv.code === 200 && updatedEnv.data) {
        setSelectedEnv(updatedEnv.data);
      }

    } catch (error: any) {
      message.error({
        content: error.message || '卸载包失败',
        key: 'uninstall',
        duration: 5
      });
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

    // 显示安装日志窗口
    setInstallLogs([`开始上传并安装 ${file.name}...`]);
    setInstallLogVisible(true);
    setIsInstalling(true);
    setUploadingFile(true);

    try {
      setInstallLogs(prev => [...prev, '正在上传文件...']);
      setInstallLogs(prev => [...prev, `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`]);

      const response = await pythonEnvApi.uploadPackageFile(selectedEnv.id, file);

      if (response.code === 200) {
        setInstallLogs(prev => [...prev, '✓ 文件上传成功']);
        setInstallLogs(prev => [...prev, '正在安装到环境...']);
        setInstallLogs(prev => [...prev, '✓ 包安装成功！']);

        setIsInstalling(false);
        message.success('上传并安装成功');

        // 延迟关闭日志窗口
        setTimeout(() => {
          setInstallLogVisible(false);
        }, 2000);

        // 刷新环境列表和包列表
        await fetchEnvironments();
        const listResponse = await pythonEnvApi.listUploadedPackageFiles(selectedEnv.id);
        if (listResponse.code === 200 && listResponse.data) {
          setUploadedFiles(listResponse.data);
        }
      }
    } catch (error: any) {
      setInstallLogs(prev => [...prev, `✗ 安装失败: ${error.message || '未知错误'}`]);
      setIsInstalling(false);
      message.error(error.message || '上传失败');
    } finally {
      setUploadingFile(false);
    }
    return false; // 阻止默认上传行为
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

        // 构建提示内容
        const content = (
          <div>
            <p><strong>文件名:</strong> {response.data.fileName}</p>
            <p><strong>文件大小:</strong> {(response.data.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>解压路径:</strong> {response.data.extractPath}</p>
            <p><strong>Python路径:</strong> {response.data.pythonExecutable || '未检测到'}</p>
            <p><strong>Python版本:</strong> {response.data.pythonVersion || '未检测到'}</p>
            <p><strong>site-packages:</strong> {response.data.sitePackagesPath || '未检测到'}</p>
            <p><strong>pip状态:</strong> {response.data.hasPip ? <Tag color="green">已安装</Tag> : <Tag color="orange">未安装</Tag>}</p>
            {response.data.message && (
              <Alert
                message={response.data.message}
                type={response.data.hasPip ? "info" : "warning"}
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </div>
        );

        // 根据pip状态显示不同类型的弹窗
        if (response.data.hasPip) {
          modal.success({
            title: 'Python运行时配置成功',
            width: 700,
            content: content,
          });
        } else {
          modal.warning({
            title: 'Python运行时配置成功（但缺少pip）',
            width: 700,
            content: content,
          });
        }

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
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: PythonEnvironment) => (
        <Space>
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
            <Tooltip title={record.pythonExecutable ? "管理Python运行时和离线包" : "配置Python运行时（必需）"}>
              <Button
                type="link"
                icon={<UploadOutlined />}
                onClick={() => handleShowUploadedFiles(record)}
                danger={!record.pythonExecutable}
              >
                配置/离线包
              </Button>
            </Tooltip>
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
        width={700}
        confirmLoading={uploadingRuntime}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="环境名称"
            name="name"
            rules={[{ required: true, message: '请输入环境名称' }]}
          >
            <Input placeholder="例如: python311-prod" />
          </Form.Item>

          <Form.Item
            label="Python版本"
            name="pythonVersion"
            rules={[{ required: true, message: '请输入Python版本' }]}
          >
            <Input placeholder="例如: 3.11.7" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="环境描述" />
          </Form.Item>

          {!editingEnv && (
            <>
              <Divider>Python运行时配置</Divider>

              <Form.Item label="配置方式">
                <Radio.Group value={configMode} onChange={(e) => setConfigMode(e.target.value)}>
                  <Space direction="vertical">
                    <Radio value="manual">
                      <Space>
                        <span>手动配置路径</span>
                        <Tag color="blue">适合系统已安装Python</Tag>
                      </Space>
                    </Radio>
                    <Radio value="upload">
                      <Space>
                        <span>上传Python运行时</span>
                        <Tag color="green">推荐离线环境</Tag>
                      </Space>
                    </Radio>
                    <Radio value="later">
                      <Space>
                        <span>稍后配置</span>
                        <Tag>延迟配置</Tag>
                      </Space>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              {configMode === 'manual' && (
                <Form.Item
                  label="Python解释器路径"
                  name="pythonExecutable"
                  rules={[{ required: true, message: '请输入Python解释器路径' }]}
                >
                  <Input placeholder="例如: C:\Python311\python.exe 或 /usr/bin/python3" />
                </Form.Item>
              )}

              {configMode === 'upload' && (
                <Form.Item label="Python运行时压缩包">
                  <Upload
                    beforeUpload={(file) => {
                      // 验证文件类型
                      const fileName = file.name.toLowerCase();
                      if (!fileName.endsWith('.zip') && !fileName.endsWith('.tar.gz') && !fileName.endsWith('.tgz')) {
                        message.error('仅支持 .zip、.tar.gz 和 .tgz 格式');
                        return false;
                      }
                      // 验证文件大小
                      const maxSize = 2 * 1024 * 1024 * 1024;
                      if (file.size > maxSize) {
                        message.error('文件大小不能超过 2GB');
                        return false;
                      }
                      setRuntimeFile(file);
                      message.success(`已选择文件: ${file.name}`);
                      return false; // 阻止自动上传
                    }}
                    onRemove={() => {
                      setRuntimeFile(null);
                    }}
                    maxCount={1}
                    accept=".zip,.tar.gz,.tgz"
                  >
                    <Button icon={<RocketOutlined />}>选择Python运行时文件</Button>
                  </Upload>
                  <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                    • 支持 .zip、.tar.gz 和 .tgz 格式
                    <br />
                    • 文件大小限制 2GB
                    <br />
                    • 系统将自动解压并检测Python路径、版本和site-packages
                    <br />
                    • <strong>Python下载：</strong>
                    <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>官方FTP</a> |
                    <a href="https://registry.npmmirror.com/binary.html?path=python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>淘宝镜像</a>
                  </div>
                  {runtimeFile && (
                    <Alert
                      message={`已选择: ${runtimeFile.name} (${(runtimeFile.size / 1024 / 1024).toFixed(2)} MB)`}
                      type="success"
                      style={{ marginTop: 8 }}
                      closable
                      onClose={() => setRuntimeFile(null)}
                    />
                  )}
                </Form.Item>
              )}

              {configMode === 'later' && (
                <Alert
                  message="稍后配置"
                  description="环境创建后，您可以在离线包管理中上传Python运行时或手动配置路径"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}

          {editingEnv && (
            <Form.Item label="Python解释器路径" name="pythonExecutable">
              <Input placeholder="例如: C:\Python311\python.exe 或 /usr/bin/python3" />
            </Form.Item>
          )}

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

      {/* 配置/离线包管理 Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            <span>配置与离线包管理 - {selectedEnv?.name}</span>
          </Space>
        }
        open={uploadedFilesModalVisible}
        onCancel={() => {
          setUploadedFilesModalVisible(false);
          setSelectedEnv(null);
          setUploadedFiles([]);
        }}
        width={900}
        footer={[
          <Button key="close" onClick={() => setUploadedFilesModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {/* Python运行时配置区域 */}
        <Alert
          message="Python运行时配置"
          description={
            <div>
              {selectedEnv?.pythonExecutable
                ? "当前环境已配置Python运行时，您可以重新上传或检测以更新配置"
                : "当前环境尚未配置Python运行时，请先上传Python环境或自动检测"}
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <strong>Python下载地址：</strong>
                <br />
                • Windows: <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer">Python官方FTP</a> 或 <a href="https://registry.npmmirror.com/binary.html?path=python/" target="_blank" rel="noopener noreferrer">淘宝镜像</a>
                <br />
                • Linux: <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer">Python官方FTP</a> 或使用系统包管理器
                <br />
                <strong>pip离线包下载：</strong>
                <br />
                • PyPI官方: <a href="https://pypi.org/project/pip/#files" target="_blank" rel="noopener noreferrer">https://pypi.org/project/pip/#files</a>
                <br />
                • 清华镜像: <a href="https://pypi.tuna.tsinghua.edu.cn/simple/pip/" target="_blank" rel="noopener noreferrer">https://pypi.tuna.tsinghua.edu.cn/simple/pip/</a>
                <br />
                • 推荐下载: <code>pip-24.0-py3-none-any.whl</code>（适用于所有Python 3.x）
              </div>
            </div>
          }
          type={selectedEnv?.pythonExecutable ? "success" : "warning"}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card
          size="small"
          title={
            <Space>
              <RocketOutlined />
              <span>Python运行时环境配置</span>
              {selectedEnv?.pythonExecutable && <Tag color="green">已配置</Tag>}
            </Space>
          }
          style={{ marginBottom: 16, borderColor: selectedEnv?.pythonExecutable ? '#52c41a' : '#1890ff' }}
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
              <br />
              • <strong>Python下载：</strong>
              <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>官方FTP</a> |
              <a href="https://registry.npmmirror.com/binary.html?path=python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>淘宝镜像</a>
            </div>
            {selectedEnv?.pythonExecutable ? (
              <Alert
                message="当前Python配置"
                description={
                  <div style={{ fontSize: 13 }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>解释器路径：</strong>
                      <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>
                        {selectedEnv.pythonExecutable}
                      </code>
                    </div>
                    {selectedEnv.pythonVersion && (
                      <div style={{ marginBottom: 4 }}>
                        <strong>Python版本：</strong>
                        <Tag color="blue">{selectedEnv.pythonVersion}</Tag>
                      </div>
                    )}
                    {selectedEnv.sitePackagesPath && (
                      <div>
                        <strong>site-packages：</strong>
                        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>
                          {selectedEnv.sitePackagesPath}
                        </code>
                      </div>
                    )}
                  </div>
                }
                type="success"
                showIcon
                style={{ marginTop: 12 }}
              />
            ) : (
              <Alert
                message="未配置Python运行时"
                description="请上传Python运行时压缩包或使用自动检测功能来配置Python环境"
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </Space>
        </Card>

        <Divider style={{ margin: '16px 0' }} />

        <Card size="small" title="上传离线包（上传即安装）" style={{ marginBottom: 16 }}>
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".whl,.tar.gz"
          >
            <Button icon={<UploadOutlined />} loading={uploadingFile}>
              {uploadingFile ? '上传中...' : '选择文件上传并安装 (.whl 或 .tar.gz)'}
            </Button>
          </Upload>
          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            • 支持 .whl 和 .tar.gz 格式
            <br />
            • 文件大小限制 500MB
            <br />
            • 上传后将立即安装到环境（无需pip）
            <br />
            • 如果Python环境没有pip，可上传pip的whl包来启用pip功能
            <br />
            • <strong>pip下载：</strong>
            <a href="https://pypi.org/project/pip/#files" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>PyPI官方</a> |
            <a href="https://pypi.tuna.tsinghua.edu.cn/simple/pip/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>清华镜像</a>
            （推荐: <code>pip-24.0-py3-none-any.whl</code>）
          </div>
        </Card>

        <Card size="small" title="已上传/已安装的包文件">
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
                        <Tag color="green" icon={<CheckCircleOutlined />}>已安装</Tag>
                      </Space>
                    }
                    description={
                      <Space split="|">
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
        {/* Python环境状态提示 */}
        {!selectedEnv?.pythonExecutable && (
          <Alert
            message="环境未配置Python运行时"
            description={
              <div>
                当前环境尚未配置Python解释器路径,无法安装包。
                <br />
                请先关闭此窗口,点击"配置/离线包"按钮配置Python运行时。
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => {
                setPackagesModalVisible(false);
                handleShowUploadedFiles(selectedEnv!);
              }}>
                去配置
              </Button>
            }
          />
        )}

        {selectedEnv?.pythonExecutable && (
          <Alert
            message="Python环境已配置"
            description={
              <div style={{ fontSize: 12 }}>
                <div><strong>Python路径:</strong> {selectedEnv.pythonExecutable}</div>
                {selectedEnv.pythonVersion && (
                  <div><strong>版本:</strong> {selectedEnv.pythonVersion}</div>
                )}
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            closable
          />
        )}

        <Card size="small" title="安装新包" style={{ marginBottom: 16 }}>
          <Form form={packageForm} layout="inline">
            <Form.Item
              name="packageName"
              rules={[{ required: true, message: '请输入包名' }]}
            >
              <Input
                placeholder="包名，例如: requests"
                style={{ width: 200 }}
                disabled={!selectedEnv?.pythonExecutable}
              />
            </Form.Item>
            <Form.Item name="version">
              <Input
                placeholder="版本（可选）"
                style={{ width: 120 }}
                disabled={!selectedEnv?.pythonExecutable}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                onClick={handleInstallPackage}
                disabled={!selectedEnv?.pythonExecutable}
              >
                安装
              </Button>
            </Form.Item>
          </Form>
          {!selectedEnv?.pythonExecutable && (
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              提示: 需要先配置Python运行时才能安装包
            </div>
          )}
        </Card>

        <Card size="small" title="已安装包">
          <List
            dataSource={selectedEnv?.packages ? Object.entries(selectedEnv.packages) : []}
            renderItem={([name, pkgInfo]) => {
              // 解析包信息
              let versionStr = '未知';
              let installMethod = '';
              let installedAt = '';
              let installedFrom = '';

              if (typeof pkgInfo === 'string') {
                versionStr = pkgInfo;
              } else if (typeof pkgInfo === 'object' && pkgInfo !== null) {
                versionStr = pkgInfo.version || '未知';
                installMethod = pkgInfo.installMethod || '';
                installedAt = pkgInfo.installedAt || '';
                installedFrom = pkgInfo.installedFrom || '';
              }

              return (
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
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{name}</span>
                        <Tag color="blue">{versionStr}</Tag>
                        {installMethod === 'offline' && <Tag color="orange">离线安装</Tag>}
                        {installMethod === 'pip' && <Tag color="green">在线安装</Tag>}
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {installedFrom && <div>来源: {installedFrom}</div>}
                        {installedAt && <div>安装时间: {new Date(installedAt).toLocaleString()}</div>}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
            locale={{ emptyText: '暂无已安装的包' }}
          />
        </Card>
      </Modal>

      {/* 安装日志 Modal */}
      <Modal
        title={
          <Space>
            {isInstalling && <Progress type="circle" percent={100} size={20} status="active" />}
            <span>安装过程日志</span>
          </Space>
        }
        open={installLogVisible}
        onCancel={() => !isInstalling && setInstallLogVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setInstallLogVisible(false)}
            disabled={isInstalling}
          >
            关闭
          </Button>,
        ]}
        width={700}
        closable={!isInstalling}
        maskClosable={!isInstalling}
      >
        <div style={{
          background: '#000',
          color: '#0f0',
          padding: '16px',
          borderRadius: '4px',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {installLogs.map((log, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              {log}
            </div>
          ))}
          {isInstalling && (
            <div style={{ marginTop: '8px', color: '#ff0' }}>
              ⏳ 正在处理，请稍候...
            </div>
          )}
        </div>
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
