# Python运行时环境完整指南

> BlockFlow Python运行时上传与管理功能 - 实现文档与使用指南

**版本**: v1.0.0
**更新日期**: 2025-01-19

---

## 目录

- [功能概述](#功能概述)
- [核心设计理念](#核心设计理念)
- [快速开始](#快速开始)
- [配置方式详解](#配置方式详解)
- [技术实现](#技术实现)
- [API文档](#api文档)
- [使用场景示例](#使用场景示例)
- [目录结构说明](#目录结构说明)
- [测试指南](#测试指南)
- [常见问题](#常见问题)
- [已知限制](#已知限制)
- [后续优化建议](#后续优化建议)

---

## 功能概述

BlockFlow系统现已支持**完整Python运行时环境上传**功能，您可以通过以下三种方式配置Python环境：

1. **手动配置路径** - 直接填写系统已安装的Python路径（适合系统已安装Python）
2. **上传Python运行时** - 上传完整的Python环境压缩包（推荐离线环境）
3. **稍后配置** - 创建环境后在"配置/离线包"中配置（延迟配置）

### 核心特性

- ✅ 支持 .zip、.tar.gz、.tgz 多种压缩格式
- ✅ 自动检测Python可执行文件路径
- ✅ 自动检测Python版本和site-packages路径
- ✅ 跨平台支持（Windows、Linux、macOS）
- ✅ 最大支持2GB文件上传
- ✅ 环境隔离，每个环境独立目录
- ✅ 离线包管理支持

---

## 核心设计理念

根据用户反馈：**"没有运行环境怎么进行后面的操作，不就是Python解释器路径的必要设置吗"**

我们将Python运行时配置**集成到环境创建流程**中，确保环境创建后即可使用：

### 设计原则

1. **创建即配置** - 环境创建时完成Python运行时配置
2. **自动化优先** - 自动检测、自动解压、自动配置
3. **灵活性** - 三种配置模式满足不同场景
4. **用户友好** - 视觉反馈、状态提示、错误指引

### 流程对比

**旧流程**（手动、繁琐）：
```
创建环境 → 手动点击"初始化" → 手动进入"离线包" → 上传运行时
```

**新流程**（自动、一体化）：
```
创建环境 + 选择配置方式 → 系统自动完成所有步骤 → 环境即可使用
```

---

## 快速开始

### 1分钟快速配置

#### 场景A：系统已安装Python

1. 点击"新建Python环境"
2. 填写环境名称和版本
3. 选择**"手动配置路径"**
4. 输入Python路径（例如：`/usr/bin/python3`）
5. 点击确定 → **完成**

#### 场景B：离线环境（推荐）

1. 准备Python运行时压缩包（见下方"准备运行时压缩包"）
2. 点击"新建Python环境"
3. 填写环境名称和版本
4. 选择**"上传Python运行时"**
5. 选择压缩包文件
6. 点击确定 → **系统自动上传、解压、检测、配置**

#### 场景C：稍后配置

1. 点击"新建Python环境"
2. 填写环境名称和版本
3. 选择**"稍后配置"**
4. 点击确定 → 环境创建成功
5. 稍后在"配置/离线包"中完成配置

---

## 配置方式详解

### 方式1：手动配置Python解释器路径

#### 适用场景
- 系统已安装Python
- 明确知道Python可执行文件路径
- 快速配置测试环境

#### 操作步骤

**前端操作**：
1. 创建环境时选择"手动配置路径"
2. 输入Python解释器路径
   - Windows示例：`C:\Python311\python.exe`
   - Linux/macOS示例：`/usr/bin/python3` 或 `/usr/local/bin/python3.11`
3. 提交创建

**后端API调用示例**：
```bash
POST /python-envs
{
  "name": "生产环境",
  "pythonVersion": "3.11",
  "pythonExecutable": "/usr/bin/python3",
  "description": "生产环境Python3.11"
}
```

**系统自动执行**：
1. 创建环境记录
2. 初始化目录结构（`POST /python-envs/{id}/initialize`）
3. 保存配置到数据库

---

### 方式2：上传完整Python运行时（推荐）

#### 准备Python运行时压缩包

##### Linux/Unix环境

**选项A：使用Python Standalone Builds（推荐）**
```bash
# 下载Python独立构建版本
wget https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz

# 或使用国内镜像
wget https://mirrors.tuna.tsinghua.edu.cn/python-build-standalone/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz
```

**选项B：使用系统Python创建便携版**
```bash
# 安装virtualenv
pip install virtualenv

# 创建虚拟环境
virtualenv --always-copy --relocatable python3.11-env

# 打包
tar -czf python3.11-runtime.tar.gz python3.11-env/
```

##### Windows环境

**选项A：使用Python Embeddable Package**
```powershell
# 访问 https://www.python.org/downloads/windows/
# 下载 "Windows embeddable package (64-bit)"

# 解压后打包为zip
Compress-Archive -Path python-3.11.7-embed-amd64 -DestinationPath python3.11-runtime.zip
```

**选项B：使用WinPython**
```powershell
# 下载WinPython：https://winpython.github.io/
# 解压后打包python目录
Compress-Archive -Path WinPython\python-3.11.7.amd64 -DestinationPath python3.11-runtime.zip
```

#### 上传步骤

**前端操作**：
1. 创建环境时选择"上传Python运行时"
2. 点击"选择Python运行时文件"
3. 选择压缩包（.zip、.tar.gz、.tgz）
4. 文件验证通过后显示文件信息
5. 点击确定提交

**系统自动处理流程**：

1. **保存压缩包** → `{env-root}/runtime/`
2. **解压文件** → `{env-root}/runtime/python/`
   - ZIP: 使用Java `ZipInputStream`
   - TAR.GZ: 调用系统 `tar -xzf` 命令
3. **检测Python可执行文件**
   - 扫描路径：`bin/`, `Scripts/`, 根目录
   - 文件名：`python3`, `python`, `python.exe`, `python3.exe`
   - 递归深度：3层
4. **检测Python版本**
   - 执行：`{pythonExecutable} --version`
   - 解析输出提取版本号
5. **检测site-packages路径**
   - 扫描路径：`lib/site-packages`, `Lib/site-packages`
   - 递归深度：5层
6. **设置可执行权限**
   - 为 bin/Scripts 目录下的文件设置执行权限
7. **更新数据库配置**
   - `pythonExecutable`
   - `pythonVersion`
   - `sitePackagesPath`
8. **返回检测结果** → 弹窗显示

**后端API调用示例**：
```bash
# 步骤1：创建环境
POST /python-envs
{
  "name": "离线Python3.11",
  "pythonVersion": "3.11",
  "description": "上传的完整Python运行时"
}
# 返回：{ "code": 200, "data": { "id": 1, ... } }

# 步骤2：初始化环境
POST /python-envs/1/initialize

# 步骤3：上传Python运行时
POST /python-envs/1/runtime/upload
Content-Type: multipart/form-data
file: python3.11-runtime.zip
```

**响应示例**：
```json
{
  "code": 200,
  "data": {
    "fileName": "python3.11-runtime.zip",
    "fileSize": 45678901,
    "uploadTime": "2025-01-19T10:30:45",
    "extractPath": "/opt/app/python-envs/1/runtime/python",
    "pythonExecutable": "/opt/app/python-envs/1/runtime/python/bin/python3",
    "pythonVersion": "3.11.7",
    "sitePackagesPath": "/opt/app/python-envs/1/runtime/python/lib/python3.11/site-packages"
  }
}
```

#### 支持的压缩格式
- ✅ `.zip` - 使用Java内置ZipInputStream解压
- ✅ `.tar.gz` - 使用系统tar命令解压
- ✅ `.tgz` - 同tar.gz

#### 文件大小限制
- 最大上传大小：**2GB**
- 配置位置：`application.yaml` 中的 `spring.servlet.multipart.max-file-size`

---

### 方式3：自动检测Python路径

#### 使用场景
- 已通过其他方式上传Python文件到服务器
- 手动拷贝Python环境到指定目录
- 需要重新检测Python路径

#### 操作步骤

**前端操作**：
1. 创建环境后，点击"配置/离线包"
2. 在"Python运行时环境配置"卡片中
3. 点击"自动检测Python路径"按钮
4. 系统自动扫描并显示检测结果

**后端API调用示例**：
```bash
# 确保Python文件已放置在环境目录中
# 例如：/opt/app/python-envs/1/bin/python3

# 调用自动检测API
POST /python-envs/1/detect-python
```

**响应示例**：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "测试环境",
    "pythonExecutable": "/opt/app/python-envs/1/bin/python3",
    "pythonVersion": "3.11.7",
    "sitePackagesPath": "/opt/app/python-envs/1/lib/python3.11/site-packages"
  }
}
```

---

## 技术实现

### 后端实现

#### 1. 新增DTO类

**文件**: `api/src/main/java/cn/tannn/cat/block/controller/dto/pythonenvironment/PythonRuntimeUploadResultDTO.java`

```java
@Data
public class PythonRuntimeUploadResultDTO implements Serializable {
    /** 文件名 */
    private String fileName;

    /** 文件大小（字节） */
    private Long fileSize;

    /** 上传时间 */
    private String uploadTime;

    /** 解压路径 */
    private String extractPath;

    /** Python解释器路径（检测结果） */
    private String pythonExecutable;

    /** Python版本（检测结果） */
    private String pythonVersion;

    /** site-packages路径（检测结果） */
    private String sitePackagesPath;
}
```

#### 2. Service层新增方法

**文件**: `api/src/main/java/cn/tannn/cat/block/service/impl/PythonEnvironmentServiceImpl.java`

**核心方法**：

##### `uploadPythonRuntime(Integer id, MultipartFile file)`

```java
@Override
@Transactional(rollbackFor = Exception.class)
public PythonRuntimeUploadResultDTO uploadPythonRuntime(Integer id, MultipartFile file) {
    // 1. 文件验证
    validateRuntimeFile(file);

    // 2. 保存文件
    String runtimeDir = envRootPath + "/" + id + "/runtime/";
    String savedFilePath = saveFile(file, runtimeDir);

    // 3. 解压文件
    String extractDir = runtimeDir + "python/";
    extractArchive(savedFilePath, extractDir);

    // 4. 自动检测Python路径
    String pythonExec = detectPythonExecutableInDirectory(extractDir);

    // 5. 检测版本
    String version = detectPythonVersion(pythonExec);

    // 6. 检测site-packages
    String sitePackages = detectSitePackages(extractDir);

    // 7. 更新数据库
    updateEnvironmentConfig(id, pythonExec, version, sitePackages);

    // 8. 返回结果
    return buildResult(...);
}
```

##### `detectPythonExecutable(Integer id)`

```java
@Override
@Transactional(rollbackFor = Exception.class)
public PythonEnvironment detectPythonExecutable(Integer id) {
    PythonEnvironment env = findById(id);
    String envRoot = env.getEnvRootPath();

    // 搜索Python可执行文件
    String pythonExec = detectPythonExecutableInDirectory(envRoot);

    if (pythonExec != null) {
        // 检测版本
        String version = detectPythonVersion(pythonExec);

        // 检测site-packages
        String sitePackages = detectSitePackages(envRoot);

        // 更新配置
        env.setPythonExecutable(pythonExec);
        env.setPythonVersion(version);
        env.setSitePackagesPath(sitePackages);

        pythonEnvironmentMapper.update(env);
    }

    return env;
}
```

**辅助方法**：

```java
// Python可执行文件检测（递归搜索，深度限制3层）
private String detectPythonExecutableInDirectory(String directory) {
    // 优先搜索常见路径
    String[] commonPaths = {"bin/python3", "bin/python", "Scripts/python.exe", "Scripts/python3.exe"};

    // 递归搜索
    return recursiveSearch(directory, commonPaths, 3);
}

// 版本检测
private String detectPythonVersion(String pythonExecutable) {
    Process process = Runtime.getRuntime().exec(pythonExecutable + " --version");
    String output = readOutput(process);
    // 解析 "Python 3.11.7" 提取版本号
    return parseVersion(output);
}

// site-packages检测（递归搜索，深度限制5层）
private String detectSitePackages(String directory) {
    return recursiveSearch(directory, "site-packages", 5);
}

// ZIP解压
private void extractZip(String zipFilePath, String destDirectory) {
    try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFilePath))) {
        ZipEntry entry;
        while ((entry = zis.getNextEntry()) != null) {
            File file = new File(destDirectory, entry.getName());
            // 解压文件...
            // 设置可执行权限...
        }
    }
}

// TAR.GZ解压
private void extractTarGz(String tarGzFilePath, String destDirectory) {
    ProcessBuilder pb = new ProcessBuilder("tar", "-xzf", tarGzFilePath, "-C", destDirectory);
    Process process = pb.start();
    process.waitFor();
}
```

#### 3. Controller层新增接口

**文件**: `api/src/main/java/cn/tannn/cat/block/controller/PythonEnvironmentController.java`

```java
/**
 * 上传Python运行时环境
 */
@PostMapping(value = "/{id}/runtime/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@Operation(summary = "上传Python运行时环境")
public ResultVO<PythonRuntimeUploadResultDTO> uploadPythonRuntime(
    @PathVariable Integer id,
    @RequestParam("file") MultipartFile file
) {
    return ResultVO.success(pythonEnvironmentService.uploadPythonRuntime(id, file));
}

/**
 * 自动检测Python可执行文件路径
 */
@PostMapping("/{id}/detect-python")
@Operation(summary = "自动检测Python可执行文件路径")
public ResultVO<PythonEnvironment> detectPythonExecutable(@PathVariable Integer id) {
    return ResultVO.success(pythonEnvironmentService.detectPythonExecutable(id));
}
```

#### 4. 配置更新

**文件**: `api/src/main/resources/application.yaml`

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      # 单个文件大小（离线包最大500MB，运行时最大2GB）
      max-file-size: ${FILE_MAX_SIZE:2GB}
      # 总上传的文件大小
      max-request-size: ${FILE_MAX_REQUEST:2GB}

# Python环境配置
python:
  env:
    # Python环境根目录（可通过环境变量PYTHON_ENV_ROOT_PATH覆盖）
    root-path: ${PYTHON_ENV_ROOT_PATH:${user.dir}/python-envs}
```

---

### 前端实现

#### 1. 类型定义

**文件**: `web/src/types/api.ts`

```typescript
// Python运行时上传结果DTO
export interface PythonRuntimeUploadResultDTO {
  fileName: string;
  fileSize: number;
  uploadTime: string;
  extractPath: string;
  pythonExecutable?: string;
  pythonVersion?: string;
  sitePackagesPath?: string;
}
```

#### 2. API客户端

**文件**: `web/src/api/pythonEnv.ts`

```typescript
export const pythonEnvApi = {
  // ... 其他方法

  // 上传Python运行时环境
  uploadPythonRuntime(id: number, file: File): Promise<ApiResponse<PythonRuntimeUploadResultDTO>> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/python-envs/${id}/runtime/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // 自动检测Python可执行文件路径
  detectPythonExecutable(id: number): Promise<ApiResponse<PythonEnvironment>> {
    return http.post(`/python-envs/${id}/detect-python`);
  },
};
```

#### 3. UI组件重构

**文件**: `web/src/pages/Manage/PythonEnvironments.tsx`

**新增状态管理**：
```typescript
const [configMode, setConfigMode] = useState<'manual' | 'upload' | 'later'>('manual');
const [runtimeFile, setRuntimeFile] = useState<File | null>(null);
const [uploadingRuntime, setUploadingRuntime] = useState(false);
const [detectingPython, setDetectingPython] = useState(false);
```

**创建流程Handler**：
```typescript
const handleSubmit = async () => {
  const values = await form.validateFields();

  if (editingEnv) {
    // 编辑模式 - 简单更新
    await pythonEnvApi.update({ id: editingEnv.id, ...values });
  } else {
    // 创建模式 - 三步流程

    // 1. 创建环境
    const createResponse = await pythonEnvApi.create(values);
    const newEnvId = createResponse.data.id;

    // 2. 初始化目录
    await pythonEnvApi.initializeEnvironment(newEnvId);

    // 3. 根据配置模式处理
    if (configMode === 'upload' && runtimeFile) {
      // 上传运行时
      setUploadingRuntime(true);
      const uploadResponse = await pythonEnvApi.uploadPythonRuntime(newEnvId, runtimeFile);

      // 显示检测结果
      modal.info({
        title: 'Python运行时配置成功',
        content: (
          <div>
            <p>Python路径: {uploadResponse.data.pythonExecutable}</p>
            <p>Python版本: {uploadResponse.data.pythonVersion}</p>
            <p>site-packages: {uploadResponse.data.sitePackagesPath}</p>
          </div>
        )
      });
      setUploadingRuntime(false);
    }
  }

  setModalVisible(false);
  fetchEnvironments();
};
```

**创建Modal - 三种配置模式UI**：
```typescript
<Form.Item label="配置方式">
  <Radio.Group value={configMode} onChange={(e) => setConfigMode(e.target.value)}>
    <Space direction="vertical">
      {/* 模式1：手动配置 */}
      <Radio value="manual">
        <Space>
          <span>手动配置路径</span>
          <Tag color="blue">适合系统已安装Python</Tag>
        </Space>
      </Radio>

      {/* 模式2：上传运行时 */}
      <Radio value="upload">
        <Space>
          <span>上传Python运行时</span>
          <Tag color="green">推荐离线环境</Tag>
        </Space>
      </Radio>

      {/* 模式3：稍后配置 */}
      <Radio value="later">
        <Space>
          <span>稍后配置</span>
          <Tag>延迟配置</Tag>
        </Space>
      </Radio>
    </Space>
  </Radio.Group>
</Form.Item>

{/* 手动模式 - 显示路径输入 */}
{configMode === 'manual' && (
  <Form.Item
    label="Python解释器路径"
    name="pythonExecutable"
    rules={[{ required: true, message: '请输入Python解释器路径' }]}
  >
    <Input placeholder="例如: C:\Python311\python.exe 或 /usr/bin/python3" />
  </Form.Item>
)}

{/* 上传模式 - 显示文件上传 */}
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
        if (file.size > 2 * 1024 * 1024 * 1024) {
          message.error('文件大小不能超过 2GB');
          return false;
        }
        setRuntimeFile(file);
        return false; // 阻止自动上传
      }}
      maxCount={1}
    >
      <Button icon={<RocketOutlined />}>选择Python运行时文件</Button>
    </Upload>
  </Form.Item>
)}

{/* 稍后配置模式 - 显示提示 */}
{configMode === 'later' && (
  <Alert
    message="稍后配置"
    description="环境创建后，您可以在离线包管理中上传Python运行时或手动配置路径"
    type="info"
    showIcon
  />
)}
```

**"配置/离线包"Modal优化**：
```typescript
<Modal title="配置与离线包管理" ...>
  {/* 状态提示 */}
  <Alert
    message="Python运行时配置"
    description={
      selectedEnv?.pythonExecutable
        ? "当前环境已配置Python运行时，您可以重新上传或检测以更新配置"
        : "当前环境尚未配置Python运行时，请先上传Python环境或自动检测"
    }
    type={selectedEnv?.pythonExecutable ? "success" : "warning"}
    showIcon
  />

  {/* Python运行时配置卡片 */}
  <Card
    title={
      <Space>
        <RocketOutlined />
        <span>Python运行时环境配置</span>
        {selectedEnv?.pythonExecutable && <Tag color="green">已配置</Tag>}
      </Space>
    }
    style={{ borderColor: selectedEnv?.pythonExecutable ? '#52c41a' : '#1890ff' }}
  >
    <Space>
      {/* 上传按钮 */}
      <Upload beforeUpload={handleRuntimeUpload} showUploadList={false}>
        <Button icon={<RocketOutlined />} loading={uploadingRuntime} type="primary">
          {uploadingRuntime ? '上传中...' : '选择Python运行时上传'}
        </Button>
      </Upload>

      {/* 检测按钮 */}
      <Button icon={<ScanOutlined />} onClick={handleDetectPython} loading={detectingPython}>
        {detectingPython ? '检测中...' : '自动检测Python路径'}
      </Button>
    </Space>

    {/* 当前配置显示 */}
    {selectedEnv?.pythonExecutable ? (
      <Alert
        message="当前Python配置"
        description={
          <div>
            <div><strong>解释器路径：</strong><code>{selectedEnv.pythonExecutable}</code></div>
            <div><strong>Python版本：</strong><Tag color="blue">{selectedEnv.pythonVersion}</Tag></div>
            <div><strong>site-packages：</strong><code>{selectedEnv.sitePackagesPath}</code></div>
          </div>
        }
        type="success"
        showIcon
      />
    ) : (
      <Alert
        message="未配置Python运行时"
        description="请上传Python运行时压缩包或使用自动检测功能来配置Python环境"
        type="warning"
        showIcon
      />
    )}
  </Card>
</Modal>
```

**操作按钮优化**：
```typescript
{/* 未配置环境用红色按钮+Tooltip提示 */}
{record.envRootPath && (
  <Tooltip title={record.pythonExecutable ? "管理Python运行时和离线包" : "配置Python运行时（必需）"}>
    <Button
      type="link"
      icon={<UploadOutlined />}
      onClick={() => handleShowUploadedFiles(record)}
      danger={!record.pythonExecutable}  // 未配置显示红色
    >
      配置/离线包
    </Button>
  </Tooltip>
)}
```

---

## API文档

### Python运行时管理

| 方法 | 路径 | 说明 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/python-envs` | 创建Python环境 | `PythonEnvironmentCreateDTO` | `ApiResponse<PythonEnvironment>` |
| POST | `/python-envs/{id}/initialize` | 初始化环境目录 | `id`: 环境ID | `ApiResponse<PythonEnvironment>` |
| POST | `/python-envs/{id}/runtime/upload` | 上传Python运行时 | `id`: 环境ID<br>`file`: MultipartFile | `ResultVO<PythonRuntimeUploadResultDTO>` |
| POST | `/python-envs/{id}/detect-python` | 自动检测Python路径 | `id`: 环境ID | `ResultVO<PythonEnvironment>` |
| GET | `/python-envs/{id}` | 获取环境详情 | `id`: 环境ID | `ApiResponse<PythonEnvironment>` |
| PUT | `/python-envs` | 更新环境配置 | `PythonEnvironmentUpdateDTO` | `ApiResponse<PythonEnvironment>` |

### 离线包管理

| 方法 | 路径 | 说明 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/python-envs/{id}/packages/upload` | 上传离线包 | `id`: 环境ID<br>`file`: .whl或.tar.gz | `ApiResponse<any>` |
| POST | `/python-envs/{id}/packages/install/{fileName}` | 安装离线包 | `id`: 环境ID<br>`fileName`: 文件名 | `ApiResponse<PythonEnvironment>` |
| GET | `/python-envs/{id}/packages/files` | 列出已上传包 | `id`: 环境ID | `ApiResponse<UploadedPackageFileDTO[]>` |
| DELETE | `/python-envs/{id}/packages/files/{fileName}` | 删除包文件 | `id`: 环境ID<br>`fileName`: 文件名 | `ApiResponse<void>` |

---

## 使用场景示例

### 场景1：在线生产环境（手动配置）

**需求**: 服务器已安装Python 3.11，需要快速创建环境

**步骤**:
```bash
# 1. 创建环境（前端操作或API调用）
POST /python-envs
{
  "name": "生产环境",
  "pythonVersion": "3.11",
  "pythonExecutable": "/usr/bin/python3.11",
  "description": "生产环境Python3.11"
}

# 系统自动初始化目录
# 环境立即可用
```

---

### 场景2：离线环境部署（上传运行时）

**需求**: 内网服务器无法访问外网，需要离线部署完整Python环境

**步骤**:

#### 1. 在有网络的环境准备Python运行时

```bash
# 下载Python独立构建
wget https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz

# 重命名
mv cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz python3.11-runtime.tar.gz

# 下载常用依赖包
mkdir packages
pip download requests numpy pandas -d packages/
```

#### 2. 在BlockFlow系统创建环境

**前端操作**:
1. 点击"新建Python环境"
2. 填写：
   - 环境名称：`离线生产环境`
   - Python版本：`3.11`
   - 描述：`完全离线的Python环境`
3. 选择配置方式：**上传Python运行时**
4. 选择文件：`python3.11-runtime.tar.gz`
5. 点击确定

**系统自动执行**:
- 创建环境（ID=1）
- 初始化目录
- 上传并解压运行时
- 检测Python路径：`/opt/app/python-envs/1/runtime/python/bin/python3`
- 检测版本：`3.11.7`
- 检测site-packages：`/opt/app/python-envs/1/runtime/python/lib/python3.11/site-packages`
- 弹窗显示检测结果

#### 3. 上传并安装离线依赖包

```bash
# 上传requests包
curl -X POST http://localhost:8777/python-envs/1/packages/upload \
  -F "file=@packages/requests-2.28.0-py3-none-any.whl"

# 安装requests包
curl -X POST http://localhost:8777/python-envs/1/packages/install/requests-2.28.0-py3-none-any.whl

# 重复以上步骤安装其他包（numpy、pandas等）
```

#### 4. 验证环境

```bash
# 获取环境详情
curl http://localhost:8777/python-envs/1

# 查看已安装包
curl http://localhost:8777/python-envs/1/packages/files
```

#### 5. 在Block中使用该环境

```bash
# 创建使用该环境的Block
curl -X POST http://localhost:8777/blocks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "数据处理块",
    "typeCode": "data_process",
    "pythonEnvId": 1,
    "script": "import requests\nimport numpy as np\ndef execute(context, inputs):\n    return {\"result\": \"success\"}"
  }'
```

---

### 场景3：快速原型开发（稍后配置）

**需求**: 先创建多个环境框架，稍后统一配置

**步骤**:

```bash
# 1. 快速创建多个环境
POST /python-envs
{ "name": "开发环境", "pythonVersion": "3.11" }

POST /python-envs
{ "name": "测试环境", "pythonVersion": "3.10" }

POST /python-envs
{ "name": "预发环境", "pythonVersion": "3.11" }

# 2. 稍后配置
# 前端：点击"配置/离线包" → 上传运行时或自动检测
```

---

## 目录结构说明

### 环境目录结构

```
${python.env.root-path}/              # 配置的根目录（默认：./python-envs）
├── 1/                                # 环境ID=1
│   ├── runtime/                      # Python运行时目录
│   │   ├── python3.11-runtime.zip    # 上传的压缩包
│   │   └── python/                   # 解压后的Python环境
│   │       ├── bin/                  # 可执行文件目录
│   │       │   ├── python3           # Python解释器
│   │       │   ├── pip3              # pip工具
│   │       │   └── ...
│   │       └── lib/                  # 库文件目录
│   │           └── python3.11/
│   │               └── site-packages/  # Python标准库和第三方库
│   ├── lib/                          # 用户依赖包目录
│   │   └── site-packages/            # pip --target安装目标
│   └── packages/                     # 离线.whl包存储
│       ├── requests-2.28.0.whl
│       └── numpy-1.24.0.whl
├── 2/                                # 环境ID=2
│   └── ...
└── 3/                                # 环境ID=3
    └── ...
```

### PYTHONPATH设置

执行脚本时，系统自动设置：

```bash
PYTHONPATH={sitePackagesPath}:{PYTHONPATH}
```

**优先级**：
1. `{env-root}/lib/site-packages` - 用户安装的包（优先）
2. `{runtime}/python/lib/pythonX.X/site-packages` - 运行时自带的包

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PYTHON_ENV_ROOT_PATH` | `${user.dir}/python-envs` | Python环境根目录 |
| `FILE_MAX_SIZE` | `2GB` | 单个文件大小限制 |
| `FILE_MAX_REQUEST` | `2GB` | 请求总大小限制 |

---

## 测试指南

### 测试检查清单

#### 后端测试

**文件上传测试**:
- [ ] 上传.zip格式Python运行时
- [ ] 上传.tar.gz格式Python运行时
- [ ] 上传.tgz格式Python运行时
- [ ] 上传超过2GB的文件（应拒绝）
- [ ] 上传非压缩文件（应拒绝）
- [ ] 上传损坏的压缩包（应报错）

**自动检测测试**:
- [ ] 检测到Python路径（bin/python3）
- [ ] 检测到Python路径（Scripts/python.exe）
- [ ] 检测Python版本正确
- [ ] 检测site-packages路径正确
- [ ] 检测失败时返回合理错误

**权限测试**:
- [ ] 解压后bin/目录文件有执行权限
- [ ] Scripts/目录文件有执行权限

**自动检测API测试**:
- [ ] `/detect-python` API正常工作
- [ ] 检测失败时返回空而不报错

#### 前端测试

**创建环境测试**:
- [ ] 手动配置模式 - 创建成功
- [ ] 上传运行时模式 - 创建成功
- [ ] 稍后配置模式 - 创建成功
- [ ] 文件类型验证（客户端）
- [ ] 文件大小验证（客户端）
- [ ] 上传进度显示
- [ ] 检测结果Modal正确显示

**配置/离线包Modal测试**:
- [ ] 已配置环境显示成功Alert
- [ ] 未配置环境显示警告Alert
- [ ] 运行时配置卡片边框颜色正确
- [ ] 上传按钮正常工作
- [ ] 检测按钮正常工作
- [ ] 当前配置信息正确显示

**UI交互测试**:
- [ ] 未配置环境的"配置/离线包"按钮显示红色
- [ ] Tooltip正确显示
- [ ] Loading状态正确显示
- [ ] 错误消息友好提示

#### 集成测试

**完整流程测试**:
- [ ] 流程1：创建（手动）→ 使用环境执行脚本
- [ ] 流程2：创建（上传）→ 检测结果正确 → 使用环境
- [ ] 流程3：创建（稍后）→ 进入配置Modal → 上传 → 使用环境
- [ ] 流程4：创建环境 → 上传离线包 → 安装离线包 → 使用

**重配置测试**:
- [ ] 已配置环境重新上传运行时（覆盖）
- [ ] 已配置环境重新检测路径（更新）

**错误恢复测试**:
- [ ] 上传失败后重试
- [ ] 检测失败后手动输入路径
- [ ] 网络中断后恢复上传

---

## 常见问题

### Q1: 上传失败，提示文件过大

**A:** 检查配置文件 `application.yaml`：

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 2GB
      max-request-size: 2GB
```

如需支持更大文件，修改配置并重启服务：

```bash
# 使用环境变量覆盖
export FILE_MAX_SIZE=5GB
export FILE_MAX_REQUEST=5GB
mvn spring-boot:run
```

---

### Q2: 检测不到Python可执行文件

**可能原因**：
1. 压缩包结构不正确
2. Python可执行文件不在 `bin/` 或 `Scripts/` 目录
3. 文件没有执行权限

**解决方案**：

**方案A：确保压缩包结构正确**
```bash
# 正确结构示例（解压后）
python/
├── bin/
│   └── python3          # ← 必须在这里
└── lib/
    └── python3.11/
        └── site-packages/
```

**方案B：手动指定路径**
1. 解压后记录实际Python路径
2. 编辑环境，手动输入 `pythonExecutable`
3. 保存更新

**方案C：检查文件权限**
```bash
# Linux/macOS
chmod +x /path/to/python-envs/1/runtime/python/bin/python3

# 然后重新调用检测API
curl -X POST http://localhost:8777/python-envs/1/detect-python
```

---

### Q3: 运行脚本时找不到模块

**错误示例**：
```
ModuleNotFoundError: No module named 'requests'
```

**排查步骤**：

1. **确认包已安装**
```bash
# 查看环境详情，检查packages字段
curl http://localhost:8777/python-envs/1

# 应返回：
{
  "packages": {
    "requests": "2.28.0",
    "numpy": "1.24.0"
  }
}
```

2. **确认sitePackagesPath正确**
```bash
# 检查环境配置
curl http://localhost:8777/python-envs/1

# 应返回：
{
  "sitePackagesPath": "/opt/app/python-envs/1/lib/python3.11/site-packages"
}
```

3. **重新安装包**
```bash
# 方式1：通过API安装
curl -X POST http://localhost:8777/python-envs/1/packages \
  -H "Content-Type: application/json" \
  -d '{"packageName": "requests", "version": "2.28.0"}'

# 方式2：上传离线包安装
curl -X POST http://localhost:8777/python-envs/1/packages/upload \
  -F "file=@requests-2.28.0-py3-none-any.whl"
curl -X POST http://localhost:8777/python-envs/1/packages/install/requests-2.28.0-py3-none-any.whl
```

---

### Q4: Windows环境tar.gz解压失败

**错误示例**：
```
java.io.IOException: Cannot run program "tar"
```

**原因**: Windows系统默认没有tar命令

**解决方案**：

**方案A：使用.zip格式（推荐）**
```powershell
# 准备Windows Python运行时时使用.zip格式
Compress-Archive -Path python-3.11.7-embed-amd64 -DestinationPath python3.11-runtime.zip
```

**方案B：安装Git Bash**
1. 安装Git for Windows (包含tar命令)
2. 确保tar命令在系统PATH中
3. 重启BlockFlow服务

**方案C：安装Cygwin**
1. 安装Cygwin并选择tar包
2. 添加Cygwin的bin目录到PATH
3. 重启BlockFlow服务

---

### Q5: Python版本检测不正确

**错误示例**：
```json
{
  "pythonVersion": null
}
```

**可能原因**：
1. Python可执行文件没有执行权限
2. `python --version` 命令输出格式不标准
3. Python环境依赖缺失

**解决方案**：

**方案A：检查权限**
```bash
# 确保Python可执行
ls -l /path/to/python-envs/1/runtime/python/bin/python3
# 应显示：-rwxr-xr-x

# 手动测试版本检测
/path/to/python-envs/1/runtime/python/bin/python3 --version
# 应输出：Python 3.11.7
```

**方案B：手动更新版本**
1. 编辑环境
2. 手动填写 `pythonVersion` 字段
3. 保存更新

```bash
PUT /python-envs
{
  "id": 1,
  "pythonVersion": "3.11.7"
}
```

**方案C：重新调用检测**
```bash
# 修复问题后重新检测
curl -X POST http://localhost:8777/python-envs/1/detect-python
```

---

### Q6: 离线包安装后仍提示找不到模块

**原因**: 可能安装到了错误的site-packages路径

**解决方案**：

1. **检查安装位置**
```bash
# 查看环境的sitePackagesPath
curl http://localhost:8777/python-envs/1

# 手动检查包是否在正确位置
ls /opt/app/python-envs/1/lib/python3.11/site-packages/
# 应该看到包目录（如 requests/）
```

2. **确认PYTHONPATH设置**
- 系统执行脚本时会自动设置PYTHONPATH
- 优先级：用户包 > 运行时包

3. **重新安装包**
```bash
# 删除已安装包
curl -X DELETE http://localhost:8777/python-envs/1/packages/files/requests-2.28.0-py3-none-any.whl

# 重新上传并安装
curl -X POST http://localhost:8777/python-envs/1/packages/upload \
  -F "file=@requests-2.28.0-py3-none-any.whl"
curl -X POST http://localhost:8777/python-envs/1/packages/install/requests-2.28.0-py3-none-any.whl
```

---

## 已知限制

### 1. tar命令依赖
**限制**: Windows环境解压.tar.gz需要tar命令
**影响**: Windows用户无法直接使用.tar.gz格式
**建议**:
- Windows用户使用.zip格式
- 或安装Git Bash/Cygwin提供tar命令

---

### 2. 文件大小限制
**限制**: 默认最大2GB，可通过配置调整
**影响**: 超大Python环境（如包含大量科学计算库）可能无法上传
**建议**:
- 分离运行时和依赖包，分别上传
- 调整配置支持更大文件
- 使用手动配置+离线包管理方式

---

### 3. 检测深度限制
**限制**:
- Python可执行文件搜索深度：3层
- site-packages搜索深度：5层

**影响**: 异常结构的Python环境可能检测失败
**建议**:
- 使用标准Python目录结构
- 检测失败时手动指定路径

---

### 4. 平台兼容性
**限制**:
- Linux运行时无法在Windows上使用
- Windows运行时无法在Linux上使用

**影响**: 跨平台迁移需要重新准备运行时
**建议**:
- 为每个平台准备专用运行时
- 使用虚拟化/容器技术统一环境

---

### 5. Python版本兼容
**限制**: 不同Python版本的包可能不兼容
**影响**: Python 3.11的包无法用于Python 3.9环境
**建议**:
- 为不同版本创建独立环境
- 使用pip download时指定Python版本

---

## 后续优化建议

### 1. 增强检测能力

**建议**：
- [ ] 支持用户自定义搜索路径
- [ ] 检测失败时提供手动输入界面
- [ ] 支持多个Python版本共存检测
- [ ] 检测过程日志实时显示

**优先级**: 中
**实现难度**: 低

---

### 2. 批量操作支持

**建议**：
- [ ] 支持批量上传多个离线包
- [ ] 一键安装requirements.txt中的所有包
- [ ] 导出环境配置为模板
- [ ] 从模板快速创建环境

**优先级**: 高
**实现难度**: 中

---

### 3. 上传体验优化

**建议**：
- [ ] 显示解压进度条
- [ ] 显示检测过程详细日志
- [ ] 支持断点续传
- [ ] 支持拖拽上传文件

**优先级**: 中
**实现难度**: 中

---

### 4. 环境验证功能

**建议**：
- [ ] 上传后自动运行测试脚本
- [ ] 验证import基础库是否正常
- [ ] 生成环境健康报告
- [ ] 依赖冲突检测

**优先级**: 高
**实现难度**: 高

---

### 5. 模板管理系统

**建议**：
- [ ] 保存常用Python配置为模板
- [ ] 模板市场（预置常用环境）
- [ ] 一键克隆环境
- [ ] 环境版本管理

**优先级**: 低
**实现难度**: 高

---

### 6. 性能优化

**建议**：
- [ ] 异步解压大文件
- [ ] 缓存检测结果
- [ ] 并行处理多个上传
- [ ] 增量更新site-packages

**优先级**: 中
**实现难度**: 中

---

## 技术亮点总结

### 1. 跨平台支持
✅ Windows: `python.exe`, `Scripts/`, `.zip`
✅ Linux/Unix: `python3`, `bin/`, `.tar.gz`
✅ macOS: 同Linux

### 2. 智能检测
✅ 递归搜索常见路径
✅ 自动执行版本检测
✅ 自动查找site-packages
✅ 容错处理

### 3. 用户体验
✅ 三种配置方式满足不同场景
✅ 创建即配置，流程简化
✅ 视觉反馈明确状态
✅ 错误提示友好详细

### 4. 安全性
✅ 客户端+服务端双重验证
✅ 文件类型和大小限制
✅ 环境隔离，独立目录
✅ 权限自动设置

### 5. 可扩展性
✅ 支持多种压缩格式
✅ 支持自定义配置路径
✅ 支持离线包管理
✅ 支持环境导入导出

---

## 相关资源

### 文档链接
- **API文档**: http://localhost:8777/doc.html（Swagger UI）
- **源码仓库**: [BlockFlow GitHub](https://github.com/your-repo/block-flow)

### Python运行时下载
- **Python Standalone Builds**: https://github.com/indygreg/python-build-standalone/releases
- **Python官方**: https://www.python.org/downloads/
- **WinPython**: https://winpython.github.io/

### 推荐工具
- **压缩工具**: 7-Zip (Windows), tar (Linux/macOS)
- **依赖下载**: pip download
- **环境管理**: virtualenv, conda

---

## 维护记录

| 日期 | 版本 | 修改内容 | 负责人 |
|------|------|----------|--------|
| 2025-01-19 | v1.0.0 | 初始实现Python运行时上传功能 | Claude |
| 2025-01-19 | v1.0.0 | 合并实现文档和使用指南 | Claude |

---

## 联系支持

如有问题，请：

1. **查看日志**
```bash
tail -f logs/application.log | grep Python
```

2. **提交Issue**
访问项目GitHub仓库提交Issue

3. **邮件支持**
发送邮件至：support@blockflow.com

---

**文档结束**
