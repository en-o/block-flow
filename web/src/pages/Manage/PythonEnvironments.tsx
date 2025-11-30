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
  Collapse,
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
  ThunderboltOutlined,
  RocketOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { pythonEnvApi } from '../../api/pythonEnv';
import type { PythonEnvironment, PythonEnvironmentCreateDTO, PythonEnvironmentUpdateDTO, PythonEnvironmentPage } from '../../types/api';

const PythonEnvironments: React.FC = () => {
  const { modal } = App.useApp();
  const [urlSearchParams] = useSearchParams();
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
  const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
  const [canForceClose, setCanForceClose] = useState(false); // 是否允许强制关闭
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchEnvironments();
  }, []);

  // 检测 URL 参数，自动打开包管理弹窗
  useEffect(() => {
    const shouldOpenPackageManagement = urlSearchParams.get('openPackageManagement') === 'true';
    const shouldOpenOnlineInstall = urlSearchParams.get('openOnlineInstall') === 'true';
    const envIdParam = urlSearchParams.get('id');

    if ((shouldOpenPackageManagement || shouldOpenOnlineInstall) && environments.length > 0) {
      // 优先使用URL参数中的id，否则使用默认环境或第一个环境
      let targetEnv: PythonEnvironment | undefined;

      if (envIdParam) {
        const envId = parseInt(envIdParam, 10);
        targetEnv = environments.find(env => env.id === envId);

        if (!targetEnv) {
          message.warning(`未找到ID为${envId}的环境，使用默认环境`);
          targetEnv = environments.find(env => env.isDefault) || environments[0];
        }
      } else {
        targetEnv = environments.find(env => env.isDefault) || environments[0];
      }

      if (targetEnv) {
        // 延迟一下，确保页面已经渲染完成
        setTimeout(async () => {
          setSelectedEnv(targetEnv!);

          if (shouldOpenOnlineInstall) {
            // 打开在线包管理弹窗
            setPackagesModalVisible(true);
          } else {
            // 打开离线包上传弹窗
            try {
              const response = await pythonEnvApi.listUploadedPackageFiles(targetEnv!.id);
              if (response.code === 200 && response.data) {
                setUploadedFiles(response.data);
              }
              setUploadedFilesModalVisible(true);
            } catch (error: any) {
              message.error(error.message || '获取包列表失败');
            }
          }
        }, 300);
      }
    }
  }, [environments, urlSearchParams]);

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

        // 如果是上传模式，需要事务性处理
        if (configMode === 'upload' && runtimeFile) {
          let newEnvId: number | null = null;
          setUploadingRuntime(true);
          setInstallLogVisible(true);
          setInstallLogs(['开始创建环境并上传Python运行时...']);
          setUploadProgress(0);
          setIsInstalling(true);
          setCanForceClose(false);

          // 15秒后允许强制关闭
          setTimeout(() => {
            setCanForceClose(true);
          }, 15000);

          try {
            // 步骤1：创建环境
            setInstallLogs(prev => [...prev, '正在创建环境...']);
            const createResponse = await pythonEnvApi.create(createData);
            if (createResponse.code !== 200 || !createResponse.data) {
              throw new Error(createResponse.message || '创建环境失败');
            }
            newEnvId = createResponse.data.id;
            setInstallLogs(prev => [...prev, `✓ 环境创建成功，ID: ${newEnvId}`]);

            // 步骤2：初始化环境目录
            setInstallLogs(prev => [...prev, '正在初始化环境目录...']);
            await pythonEnvApi.initializeEnvironment(newEnvId);
            setInstallLogs(prev => [...prev, '✓ 环境目录初始化成功']);

            // 步骤3：上传Python运行时（关键步骤）
            setInstallLogs(prev => [...prev, '开始上传Python运行时...']);

            // 订阅SSE进度事件（添加token参数以支持认证）
            const taskId = `upload-python-${newEnvId}`;
            const token = localStorage.getItem('token') || '';
            const eventSource = new EventSource(`/api/python-envs/${newEnvId}/progress/${taskId}?token=${encodeURIComponent(token)}`);

            eventSource.addEventListener('connected', (e: MessageEvent) => {
              console.log('SSE连接已建立:', e.data);
              setInstallLogs(prev => [...prev, '✓ 实时进度连接已建立']);
            });

            eventSource.addEventListener('log', (e: MessageEvent) => {
              const message = e.data;
              setInstallLogs(prev => [...prev, message]);
            });

            eventSource.addEventListener('progress', (e: MessageEvent) => {
              const data = JSON.parse(e.data);
              setUploadProgress(data.progress);
              setInstallLogs(prev => [...prev, `[${data.progress}%] ${data.message}`]);
            });

            const handleComplete = (data: any) => {
              setInstallLogs(prev => [...prev, data.success ? '✓ 完成！' : '✗ 失败']);
              setIsInstalling(false);
              setUploadProgress(100);
              eventSource.close();

              setTimeout(() => {
                setInstallLogVisible(false);
              }, 2000);
            };

            eventSource.addEventListener('complete', (e: MessageEvent) => {
              const data = JSON.parse(e.data);
              handleComplete(data);
            });

            eventSource.addEventListener('error', (e: MessageEvent) => {
              const error = e.data;
              if (error) {  // 只有当有错误数据时才显示
                setInstallLogs(prev => [...prev, `✗ 服务端错误: ${error}`]);
                setIsInstalling(false);
                eventSource.close();
              }
            });

            eventSource.onerror = (error) => {
              console.error('SSE连接错误:', error);
              console.error('EventSource readyState:', eventSource.readyState);
              // 只在首次连接失败时提示，避免重复提示
              if (eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
                setInstallLogs(prev => {
                  // 避免重复添加相同的错误提示
                  const lastLog = prev[prev.length - 1];
                  if (!lastLog || !lastLog.includes('实时进度连接失败')) {
                    return [...prev, '⚠ 实时进度连接失败，上传继续进行（请查看后台日志）'];
                  }
                  return prev;
                });
              }
              eventSource.close();
            };

            // 等待SSE连接建立
            await new Promise(resolve => setTimeout(resolve, 500));

            const uploadResponse = await pythonEnvApi.uploadPythonRuntime(newEnvId, runtimeFile);

            // 严格检查响应
            if (!uploadResponse || uploadResponse.code !== 200) {
              const errorMsg = uploadResponse?.message || '上传Python运行时失败';
              console.error('上传失败，错误信息:', errorMsg);
              throw new Error(errorMsg);
            }

            if (!uploadResponse.data) {
              throw new Error('上传响应数据为空');
            }

            console.log('Python运行时上传成功');

            // 成功：显示成功信息
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
              // 没有pip，刷新环境列表并打开离线包上传弹窗
              await fetchEnvironments();

              // 获取新创建的环境
              const newEnvResponse = await pythonEnvApi.getById(newEnvId);
              if (newEnvResponse.code === 200 && newEnvResponse.data) {
                setSelectedEnv(newEnvResponse.data);

                // 获取已上传的包列表
                const listResponse = await pythonEnvApi.listUploadedPackageFiles(newEnvId);
                if (listResponse.code === 200 && listResponse.data) {
                  setUploadedFiles(listResponse.data);
                }

                // 关闭创建弹窗，打开离线包上传弹窗
                setModalVisible(false);
                setUploadedFilesModalVisible(true);

                // 显示提示
                message.warning('Python运行时缺少pip，请上传pip包以启用在线安装功能');
              }
              return; // 提前返回，避免后面的setModalVisible和fetchEnvironments
            }

            setModalVisible(false);
            fetchEnvironments();

          } catch (error: any) {
            console.error('创建环境或上传Python运行时失败:', error);
            console.error('错误详情:', {
              message: error.message,
              code: error.code,
              response: error.response
            });

            // 失败：回滚 - 删除已创建的环境
            if (newEnvId !== null) {
              console.log('开始回滚，删除环境ID:', newEnvId);
              try {
                message.loading({ content: '正在回滚，删除已创建的环境...', key: 'rollback', duration: 0 });
                const deleteResponse = await pythonEnvApi.delete(newEnvId);
                console.log('删除响应:', deleteResponse);
                message.success({ content: '已回滚，环境创建失败', key: 'rollback' });
                console.log('回滚成功，环境已删除');
              } catch (deleteError: any) {
                console.error('回滚删除环境失败:', deleteError);
                console.error('删除错误详情:', {
                  message: deleteError.message,
                  code: deleteError.code
                });
                message.error({
                  content: `回滚失败，请手动删除环境ID: ${newEnvId}`,
                  key: 'rollback',
                  duration: 10
                });
              }
            } else {
              console.log('环境未创建，无需回滚');
            }

            // 使用Modal显示详细错误信息
            modal.error({
              title: '❌ 创建环境失败',
              width: 800,
              content: (
                <div>
                  <Alert
                    type="error"
                    message="环境创建失败"
                    description="Python运行时上传失败，已回滚所有操作，未创建任何环境数据"
                    style={{ marginBottom: 16 }}
                  />
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    maxHeight: '400px',
                    overflow: 'auto',
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9'
                  }}>
                    {error.message || '创建失败，请稍后重试'}
                  </div>
                  <Alert
                    type="info"
                    message="下载正确版本"
                    description={
                      <div>
                        请访问：<br/>
                        <a
                          href="https://github.com/astral-sh/python-build-standalone/releases"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          https://github.com/astral-sh/python-build-standalone/releases
                        </a>
                      </div>
                    }
                    style={{ marginTop: 16 }}
                  />
                </div>
              ),
              okText: '我知道了',
            });

            // 不关闭弹窗，让用户可以修改后重试
            throw error;

          } finally {
            setUploadingRuntime(false);
          }

        } else {
          // 手动配置或稍后配置模式 - 正常创建
          const createResponse = await pythonEnvApi.create(createData);

          if (createResponse.code === 200 && createResponse.data) {
            const newEnvId = createResponse.data.id;

            // 初始化环境目录
            await pythonEnvApi.initializeEnvironment(newEnvId);

            if (configMode === 'manual' && values.pythonExecutable) {
              message.success('环境创建成功，已配置Python路径');
            } else {
              message.success('环境创建成功，请稍后配置Python运行时');
            }

            setModalVisible(false);
            fetchEnvironments();
          }
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
      const versionStr = values.version ? `==${values.version}` : '';
      setInstallLogs([`开始在线安装 ${packageName}${versionStr}...`]);
      setInstallLogVisible(true);
      setIsInstalling(true);
      setCanForceClose(false);

      // 15秒后允许强制关闭
      setTimeout(() => {
        setCanForceClose(true);
      }, 15000);

      // 模拟pip安装的各个阶段
      await new Promise(resolve => setTimeout(resolve, 300));
      setInstallLogs(prev => [...prev, `执行命令: python -m pip install ${packageName}${versionStr}`]);

      await new Promise(resolve => setTimeout(resolve, 400));
      setInstallLogs(prev => [...prev, 'Collecting ' + packageName + '...']);

      await new Promise(resolve => setTimeout(resolve, 500));
      setInstallLogs(prev => [...prev, '正在解析依赖关系...']);

      // 实际调用API
      const installPromise = pythonEnvApi.installPackage(selectedEnv.id, values);

      await new Promise(resolve => setTimeout(resolve, 600));
      setInstallLogs(prev => [...prev, '正在下载包...']);

      await new Promise(resolve => setTimeout(resolve, 800));
      setInstallLogs(prev => [...prev, '正在安装...']);

      await installPromise;

      setInstallLogs(prev => [...prev, `✓ Successfully installed ${packageName}`]);
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
      setInstallLogs(prev => [...prev, `✗ ERROR: ${error.message || '未知错误'}`]);
      setInstallLogs(prev => [...prev, '✗ 安装失败']);
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
      // 检查包是否是离线安装的
      const packages = selectedEnv.packages || {};
      const pkgInfo = packages[packageName];
      const isOfflineInstall = typeof pkgInfo === 'object' && pkgInfo.installMethod === 'offline';
      const installedFrom = typeof pkgInfo === 'object' ? pkgInfo.installedFrom : null;

      message.loading({ content: '正在卸载包...', key: 'uninstall', duration: 0 });

      await pythonEnvApi.uninstallPackage(selectedEnv.id, packageName);

      // 如果是离线安装的，同时删除离线包文件
      if (isOfflineInstall && installedFrom) {
        try {
          await pythonEnvApi.deletePackageFile(selectedEnv.id, installedFrom);
          message.success({ content: `包 ${packageName} 及离线包文件已删除`, key: 'uninstall' });
        } catch (deleteError: any) {
          // 删除离线包文件失败不影响主流程
          console.warn('删除离线包文件失败:', deleteError);
          message.success({ content: `包 ${packageName} 卸载成功（离线包文件删除失败）`, key: 'uninstall' });
        }
      } else {
        message.success({ content: `包 ${packageName} 卸载成功`, key: 'uninstall' });
      }

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
      console.log('===== 开始导出 requirements.txt =====');
      console.log('环境信息:', env);

      // 检查环境是否有已安装的包
      const packages = env.packages || {};
      const packageCount = Object.keys(packages).length;
      console.log('包数量:', packageCount);
      console.log('包列表:', packages);

      if (packageCount === 0) {
        message.warning('该环境没有已安装的包，无法导出');
        return;
      }

      // 显示加载提示
      const loadingKey = 'export-requirements';
      message.loading({ content: '正在生成 requirements.txt...', key: loadingKey, duration: 0 });

      console.log('调用 API: /python-envs/' + env.id + '/requirements/export');
      const response = await pythonEnvApi.exportRequirements(env.id);
      console.log('API 响应:', response);
      console.log('响应 code:', response.code);
      console.log('响应 data 类型:', typeof response.data);
      console.log('响应 data 内容:', response.data);
      console.log('响应 data 长度:', response.data?.length);

      if (response.code === 200 && response.data !== undefined) {
        // 再次检查响应内容
        if (!response.data || response.data.trim() === '') {
          console.error('❌ 导出内容为空');
          message.error({ content: '导出内容为空', key: loadingKey });
          return;
        }

        console.log('✅ 开始创建下载');

        // 创建Blob并下载
        const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
        console.log('Blob 创建成功:', blob);

        const url = URL.createObjectURL(blob);
        console.log('Object URL:', url);

        const a = document.createElement('a');
        a.href = url;

        // 使用环境名称和时间戳生成文件名
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `requirements-${env.name}-${timestamp}.txt`;
        console.log('文件名:', a.download);

        document.body.appendChild(a);
        console.log('触发点击下载');
        a.click();

        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('清理完成');
        }, 100);

        message.success({ content: `已导出 ${packageCount} 个包的依赖信息`, key: loadingKey });
        console.log('===== 导出完成 =====');
      } else {
        console.error('❌ 响应失败:', response);
        message.error({ content: response.message || '导出失败', key: loadingKey });
      }
    } catch (error: any) {
      console.error('❌ 导出 requirements.txt 异常:', error);
      message.error(error.message || '导出失败，请稍后重试');
    }
  };

  const handleImportRequirements = async () => {
    if (!selectedEnv) return;

    try {
      const values = await requirementsForm.validateFields();

      // 检查内容是否为空
      const requirementsText = values.requirementsText.trim();
      if (!requirementsText) {
        message.warning('请输入requirements.txt内容');
        return;
      }

      // 解析包数量
      const lines = requirementsText.split('\n').filter((line: string) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#');
      });

      if (lines.length === 0) {
        message.warning('requirements.txt内容为空或仅包含注释');
        return;
      }

      // 显示确认对话框
      const confirmed = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: '确认批量安装',
          content: (
            <div>
              <p>即将从requirements.txt安装 <strong>{lines.length}</strong> 个包。</p>
              <p>这可能需要较长时间，请耐心等待。</p>
              <p style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
                包列表：
              </p>
              <div style={{
                maxHeight: 200,
                overflow: 'auto',
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                {lines.join('\n')}
              </div>
            </div>
          ),
          okText: '开始安装',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (!confirmed) {
        return;
      }

      // 关闭requirements弹窗，打开日志弹窗
      setRequirementsModalVisible(false);
      setInstallLogs(['开始批量安装requirements.txt...']);
      setInstallLogVisible(true);
      setIsInstalling(true);
      setUploadProgress(0);
      setCanForceClose(false);

      // 15秒后允许强制关闭
      setTimeout(() => {
        setCanForceClose(true);
      }, 15000);

      // 订阅SSE进度事件（添加token参数以支持认证）
      const taskId = `import-requirements-${selectedEnv.id}`;
      const token = localStorage.getItem('token') || '';
      const eventSource = new EventSource(`/api/python-envs/${selectedEnv.id}/progress/${taskId}?token=${encodeURIComponent(token)}`);

      eventSource.addEventListener('connected', (e: MessageEvent) => {
        console.log('SSE连接已建立:', e.data);
        setInstallLogs(prev => [...prev, '✓ 实时进度连接已建立']);
      });

      eventSource.addEventListener('log', (e: MessageEvent) => {
        const message = e.data;
        setInstallLogs(prev => [...prev, message]);
      });

      eventSource.addEventListener('progress', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setUploadProgress(data.progress);
        setInstallLogs(prev => [...prev, `[${data.progress}%] ${data.message}`]);
      });

      const handleComplete = (data: any) => {
        setInstallLogs(prev => [...prev, data.success ? '✓ 完成！' : '✗ 失败']);
        setIsInstalling(false);
        setUploadProgress(100);
        eventSource.close();

        setTimeout(() => {
          setInstallLogVisible(false);
        }, 2000);
      };

      eventSource.addEventListener('complete', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        handleComplete(data);
      });

      eventSource.addEventListener('error', (e: MessageEvent) => {
        const error = e.data;
        if (error) {  // 只有当有错误数据时才显示
          setInstallLogs(prev => [...prev, `✗ 服务端错误: ${error}`]);
          setIsInstalling(false);
          eventSource.close();
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        console.error('EventSource readyState:', eventSource.readyState);
        // 只在首次连接失败时提示
        if (eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
          setInstallLogs(prev => {
            const lastLog = prev[prev.length - 1];
            if (!lastLog || !lastLog.includes('实时进度连接失败')) {
              return [...prev, '⚠ 实时进度连接失败，安装继续进行（请查看后台日志）'];
            }
            return prev;
          });
        }
        eventSource.close();
      };

      // 等待SSE连接建立
      await new Promise(resolve => setTimeout(resolve, 500));

      // 异步安装
      await pythonEnvApi.importRequirements(selectedEnv.id, requirementsText);

      message.success('requirements.txt安装完成！');

      requirementsForm.resetFields();

      // 刷新环境列表
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
        content: error.message || '导入失败',
        duration: 8
      });
      console.error('导入requirements.txt失败', error);
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

    // 从文件名提取包名
    let packageName = fileName;
    if (fileName.endsWith('.whl')) {
      // whl文件: 取第一个-之前的部分
      const firstDash = fileName.indexOf('-');
      if (firstDash > 0) {
        packageName = fileName.substring(0, firstDash);
      }
    } else if (fileName.endsWith('.tar.gz')) {
      // tar.gz文件: 移除.tar.gz后取最后一个-之前的部分
      packageName = fileName.replace('.tar.gz', '');
      const lastDash = packageName.lastIndexOf('-');
      if (lastDash > 0) {
        packageName = packageName.substring(0, lastDash);
      }
    }
    packageName = packageName.toLowerCase().replace(/_/g, '-');

    // 检查包是否已存在
    const packages = selectedEnv.packages || {};
    const existingPackage = packages[packageName];

    if (existingPackage) {
      const existingVersion = typeof existingPackage === 'object' && existingPackage.version
        ? existingPackage.version
        : '未知版本';

      modal.error({
        title: '无法上传：包已存在',
        content: (
          <div>
            <p>包 <strong>{packageName}</strong> 已安装。</p>
            <p>当前版本: <strong>{existingVersion}</strong></p>
            <p style={{ marginTop: 16 }}>如需重新安装，请先在"已安装包"列表中卸载该包，然后再上传。</p>
          </div>
        ),
        okText: '知道了',
      });
      return false;
    }

    // 检测是否是pip包
    const isPipPackage = fileName.startsWith('pip-') || fileName.includes('pip-');

    // 显示安装日志窗口
    setInstallLogs([`开始上传并安装 ${file.name}...`]);
    setInstallLogVisible(true);
    setIsInstalling(true);
    setUploadingFile(true);
    setCanForceClose(false);

    // 15秒后允许强制关闭
    setTimeout(() => {
      setCanForceClose(true);
    }, 15000);

    try {
      setInstallLogs(prev => [...prev, '正在上传文件...']);
      setInstallLogs(prev => [...prev, `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`]);

      if (isPipPackage) {
        setInstallLogs(prev => [...prev, '检测到pip包，安装后将自动配置Python环境']);
      }

      const response = await pythonEnvApi.uploadPackageFile(selectedEnv.id, file);

      if (response.code === 200) {
        setInstallLogs(prev => [...prev, '✓ 文件上传成功']);
        setInstallLogs(prev => [...prev, '正在解压并安装到环境...']);

        if (isPipPackage) {
          setInstallLogs(prev => [...prev, '配置Python模块搜索路径（._pth文件）...']);
        }

        setInstallLogs(prev => [...prev, '✓ 包安装成功！']);

        if (isPipPackage) {
          setInstallLogs(prev => [...prev, '✓ pip环境配置完成，现在可以使用在线安装功能']);
        }

        setIsInstalling(false);
        message.success('上传并安装成功');

        // 延迟关闭日志窗口
        setTimeout(() => {
          setInstallLogVisible(false);
        }, isPipPackage ? 3000 : 2000); // pip包多显示1秒

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
    setInstallLogVisible(true);
    setInstallLogs(['开始上传Python运行时...']);
    setUploadProgress(0);
    setIsInstalling(true);
    setCanForceClose(false);

    // 15秒后允许强制关闭
    setTimeout(() => {
      setCanForceClose(true);
    }, 15000);

    // 订阅SSE进度事件（添加token参数以支持认证）
    const taskId = `upload-python-${selectedEnv.id}`;
    const token = localStorage.getItem('token') || '';
    const eventSource = new EventSource(`/api/python-envs/${selectedEnv.id}/progress/${taskId}?token=${encodeURIComponent(token)}`);

    eventSource.addEventListener('log', (e: MessageEvent) => {
      const message = e.data;
      setInstallLogs(prev => [...prev, message]);
    });

    eventSource.addEventListener('progress', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setUploadProgress(data.progress);
      setInstallLogs(prev => [...prev, `[${data.progress}%] ${data.message}`]);
    });

    eventSource.addEventListener('complete', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setInstallLogs(prev => [...prev, data.success ? '✓ 完成！' : '✗ 失败']);
      setIsInstalling(false);
      setUploadProgress(100);
      eventSource.close();

      setTimeout(() => {
        setInstallLogVisible(false);
      }, 2000);
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      const error = e.data;
      if (error) {  // 只有当有错误数据时才显示
        setInstallLogs(prev => [...prev, `✗ 服务端错误: ${error}`]);
        setIsInstalling(false);
        eventSource.close();
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      console.error('EventSource readyState:', eventSource.readyState);
      // 只在首次连接失败时提示
      if (eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
        setInstallLogs(prev => {
          const lastLog = prev[prev.length - 1];
          if (!lastLog || !lastLog.includes('实时进度连接失败')) {
            return [...prev, '⚠ 实时进度连接失败，上传继续进行（请查看后台日志）'];
          }
          return prev;
        });
      }
      eventSource.close();
    };

    // 等待SSE连接建立
    await new Promise(resolve => setTimeout(resolve, 500));

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
      console.error('上传Python运行时失败:', error);

      // 使用Modal显示详细错误信息（保留格式）
      modal.error({
        title: '❌ 上传失败',
        width: 800,
        content: (
          <div>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              maxHeight: '400px',
              overflow: 'auto',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              {error.message || '上传失败，请稍后重试'}
            </div>
            <Alert
              type="info"
              message="提示"
              description={
                <div>
                  如需下载正确版本的Python，请访问：<br/>
                  <a
                    href="https://github.com/astral-sh/python-build-standalone/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://github.com/astral-sh/python-build-standalone/releases
                  </a>
                </div>
              }
              style={{ marginTop: 16 }}
            />
          </div>
        ),
        okText: '我知道了',
      });
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
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: PythonEnvironment) => (
        <Space size="small" wrap>
          {!record.isDefault && (
            <Tooltip title="设为默认环境">
              <Button
                type="link"
                icon={<StarOutlined />}
                onClick={() => handleSetDefault(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="管理包">
            <Button
              type="link"
              icon={<ThunderboltOutlined />}
              onClick={() => handleManagePackages(record)}
              size="small"
            />
          </Tooltip>
          {record.envRootPath && (
            <Tooltip title={record.pythonExecutable ? "管理Python运行时和离线包" : "配置Python运行时（必需）"}>
              <Button
                type="link"
                icon={<UploadOutlined />}
                onClick={() => handleShowUploadedFiles(record)}
                danger={!record.pythonExecutable}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="导出requirements.txt">
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleExportRequirements(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="编辑环境">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={record.isDefault ? "不能删除默认环境" : "删除环境"}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={record.isDefault}
              size="small"
            />
          </Tooltip>
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
                <>
                  <Form.Item
                    label="Python解释器路径"
                    name="pythonExecutable"
                    rules={[{ required: true, message: '请输入Python解释器路径' }]}
                  >
                    <Input placeholder="例如: C:\Python311\python.exe 或 /usr/bin/python3" />
                  </Form.Item>
                  <Alert
                    message="💡 Docker环境提示"
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>如果您使用的是Docker部署：</strong>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          • 系统已预装Python 3.12，路径为：<code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>/usr/bin/python3.12</code>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          • 或者使用符号链接：<code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>/usr/bin/python3</code>
                        </div>
                        <div style={{ marginTop: 8, color: '#666' }}>
                          推荐：使用预编译Python运行时（python-build-standalone）以获得最佳兼容性
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                    closable
                  />
                </>
              )}

              {configMode === 'upload' && (
                <>
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

                  {/* 推荐的python-build-standalone包 */}
                  <Alert
                    message="📦 推荐下载：python-build-standalone（预编译Python）"
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>下载地址：</strong>
                          <a href="https://github.com/astral-sh/python-build-standalone/releases" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                            https://github.com/astral-sh/python-build-standalone/releases
                          </a>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <strong>🐧 Linux / 🐳 Docker 环境（推荐）：</strong>
                          <div style={{ marginLeft: 16, marginTop: 4 }}>
                            • <strong>x86_64架构（当前Docker环境）：</strong>
                            <br />
                            <code style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: 3, marginLeft: 8 }}>
                              cpython-3.10.19+20251010-x86_64-unknown-linux-gnu-install_only.tar.gz
                            </code>
                            <br />
                            • <strong>ARM架构：</strong>
                            <code style={{ background: '#e6f7ff', padding: '2px 6px', borderRadius: 3, marginLeft: 8 }}>
                              cpython-3.11.9+20240726-aarch64-unknown-linux-gnu-install_only.tar.gz
                            </code>
                          </div>
                        </div>

                        <div style={{ marginBottom: 6 }}>
                          <strong>🪟 Windows：</strong>
                          <div style={{ marginLeft: 16, marginTop: 4 }}>
                            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>
                              cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz
                            </code>
                            <br />
                            <span style={{ color: '#666', fontSize: 11, marginLeft: 8, marginTop: 4, display: 'inline-block' }}>
                              （或使用官方Windows版(python-xxx-embed-amd64.zip)：
                              <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                                Python官方FTP
                              </a> |
                              <a href="https://registry.npmmirror.com/binary.html?path=python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                                淘宝镜像
                              </a>）
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, padding: '6px', background: '#fff7e6', borderRadius: 4, fontSize: 11 }}>
                          💡 <strong>提示：</strong>选择 <code>install_only</code> 版本，包含完整Python环境和pip，版本号可根据需要选择
                        </div>

                        <div style={{ marginTop: 8, padding: '6px', background: '#f0f9ff', borderRadius: 4, fontSize: 11 }}>
                          🐳 <strong>Docker用户：</strong>系统已预装Python 3.12（<code>/usr/bin/python3.12</code>），可直接使用或上传python-build-standalone获得更好兼容性
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                    closable
                  />
                </>
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
        {/* 下载指南（可折叠） */}
        <Collapse
          defaultActiveKey={[]}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'download-guide',
              label: (
                <Space>
                  <span>📦 下载指南：Python运行时 & pip离线包</span>
                </Space>
              ),
              children: (
                <div style={{ fontSize: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <strong>🎯 推荐方案：</strong>
                    <a href="https://github.com/astral-sh/python-build-standalone/releases" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                      python-build-standalone（预编译Python，包含pip）
                    </a>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>🐧 Linux / 🐳 Docker 环境：</strong>
                    <div style={{ marginLeft: 16, marginTop: 4, fontSize: 11 }}>
                      x86_64: <code style={{ background: '#fff3cd', padding: '2px 6px', borderRadius: 3 }}>
                        cpython-3.10.19+...-x86_64-unknown-linux-gnu-install_only.tar.gz
                      </code>
                      <br />
                      ARM64: <code style={{ background: '#e6f7ff', padding: '2px 6px', borderRadius: 3 }}>
                        cpython-3.11.9+...-aarch64-unknown-linux-gnu-install_only.tar.gz
                      </code>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>🪟 Windows系统：</strong>
                    <div style={{ marginLeft: 16, marginTop: 4, fontSize: 11 }}>
                      <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>
                        cpython-3.11.9+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz
                      </code>
                      <br />
                      <span style={{ color: '#666', fontSize: 10 }}>
                        或使用
                        <a href="https://www.python.org/ftp/python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                          官方Windows版(python-xxx-embed-amd64.zip)
                        </a> |
                        <a href="https://registry.npmmirror.com/binary.html?path=python/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                          淘宝镜像
                        </a>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, padding: '8px', background: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
                    <strong>💡 关键提示：</strong>
                    <br />
                    • 文件名必须包含 <code>install_only</code>（包含pip和完整环境）
                    <br />
                    • 架构必须匹配系统（x86_64或aarch64），否则会报"Exec format error"
                    <br />
                    • Docker用户可直接使用系统Python: <code>/usr/bin/python3</code>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <strong>📥 pip离线包下载（如需单独安装pip）：</strong>
                    <br />
                    <a href="https://pypi.org/project/pip/#files" target="_blank" rel="noopener noreferrer">PyPI官方</a> |
                    <a href="https://pypi.tuna.tsinghua.edu.cn/simple/pip/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>清华镜像</a>
                    <br />
                    推荐: <code>pip-24.3.1-py3-none-any.whl</code>
                  </div>
                </div>
              ),
            },
          ]}
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
              • 支持 .zip、.tar.gz 和 .tgz 格式，文件大小限制 2GB
              <br />
              • 系统将自动检测并配置 Python 解释器路径、版本、site-packages路径和pip版本
            </div>
            {selectedEnv?.pythonExecutable ? (
              <Collapse
                defaultActiveKey={['python-config']}
                style={{ marginTop: 12 }}
                items={[
                  {
                    key: 'python-config',
                    label: (
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>当前Python配置</span>
                      </Space>
                    ),
                    children: (
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
                        {selectedEnv.pipVersion ? (
                          <div style={{ marginBottom: 4 }}>
                            <strong>pip版本：</strong>
                            <Tag color="green" icon={<CheckCircleOutlined />}>{selectedEnv.pipVersion}</Tag>
                            <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>可使用在线安装</span>
                          </div>
                        ) : (
                          <div style={{ marginBottom: 4 }}>
                            <strong>pip状态：</strong>
                            <Tag color="orange">未安装</Tag>
                            <span style={{ color: '#fa8c16', fontSize: 12, marginLeft: 8 }}>仅支持离线安装</span>
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
                    ),
                  },
                ]}
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
                  <div><strong>Python版本:</strong> {selectedEnv.pythonVersion}</div>
                )}
                {selectedEnv.pipVersion ? (
                  <div>
                    <strong>pip版本：</strong>
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginLeft: 4 }}>
                      {selectedEnv.pipVersion}
                    </Tag>
                    <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>可使用在线安装</span>
                  </div>
                ) : (
                  <div>
                    <strong>pip状态：</strong>
                    <Tag color="orange" style={{ marginLeft: 4 }}>未安装</Tag>
                    <span style={{ color: '#fa8c16', fontSize: 12, marginLeft: 8 }}>仅支持离线安装</span>
                  </div>
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
          {!selectedEnv?.pythonExecutable ? (
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              提示: 需要先配置Python运行时才能安装包
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <strong>包站点：</strong>
              <a href="https://pypi.org/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                PyPI官方
              </a>
              <span style={{ margin: '0 4px' }}>|</span>
              <a href="https://pypi.tuna.tsinghua.edu.cn/simple/" target="_blank" rel="noopener noreferrer">
                清华镜像
              </a>
              <span style={{ marginLeft: 8, color: '#999' }}>- 搜索包名和版本</span>
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
                const pkg = pkgInfo as any;
                versionStr = pkg.version || '未知';
                installMethod = pkg.installMethod || '';
                installedAt = pkg.installedAt || '';
                installedFrom = pkg.installedFrom || '';
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
            {isInstalling && <Progress type="circle" percent={uploadProgress} size={20} status="active" />}
            <span>安装过程日志</span>
          </Space>
        }
        open={installLogVisible}
        onCancel={() => !isInstalling && setInstallLogVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setInstallLogVisible(false)}
            disabled={isInstalling && !canForceClose}
            type={canForceClose && isInstalling ? "primary" : "default"}
          >
            {isInstalling && !canForceClose ? "安装中..." : "关闭"}
          </Button>,
        ]}
        width={700}
        closable={!isInstalling || canForceClose}
        maskClosable={!isInstalling || canForceClose}
        zIndex={2000}
        style={{ top: 20 }}
      >
        {/* 进度条 */}
        {uploadProgress > 0 && (
          <Progress
            percent={uploadProgress}
            status={isInstalling ? 'active' : uploadProgress === 100 ? 'success' : 'exception'}
            style={{ marginBottom: 16 }}
          />
        )}
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
          {isInstalling && !canForceClose && (
            <div style={{ marginTop: '8px', color: '#ff0' }}>
              ⏳ 正在处理，请稍候... (15秒后可手动关闭)
            </div>
          )}
          {isInstalling && canForceClose && (
            <div style={{ marginTop: '8px', color: '#ffa500' }}>
              ⚠️ 任务运行时间较长，您可以点击关闭按钮手动关闭此窗口，任务将在后台继续执行
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
