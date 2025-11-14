# BlockFlow 项目需求文档

## 项目概述

构建一个基于 Google Blockly 的可视化部署编排平台，允许用户通过拖拽自定义块来编排 Java/React/Vue 项目的部署流程，可结合 AI 辅助生成流程，替代手动操作过程。

### 核心价值

1. **降低操作成本**：通过固定脚本方式完成 TeamCity 部署，替代人工在原生 UI 上的重复操作
2. **提升可维护性**：Python 脚本统一管理和流程化，支持任意脚本的可视化编排
3. **提高效率**：可视化拖拽 + AI 辅助，快速构建复杂部署流程
4. **知识沉淀**：将运维经验固化为可复用的脚本块

### 技术选型说明

- **脚本语言选择**：Python（相比 Shell 有更强大的生态和跨平台能力）
- **前端路由规划**：
  - `/flow` - 流程编排页面（无需鉴权，快速访问）
  - `/manage` - 管理后台（需登录鉴权，管理块/变量/环境）

---

## 项目规划

### 第一阶段：基础建设（2-3周）
- [ ] 项目架构搭建
- [ ] 数据库设计与初始化
- [ ] 基础 CRUD 接口开发
- [ ] 前端框架集成（React + Blockly）
- [ ] 用户认证与权限系统

### 第二阶段：块执行测试（2周）
- [ ] Python 脚本执行引擎开发
- [ ] 块脚本编辑器集成（Monaco Editor）
- [ ] 单块执行测试功能
- [ ] 执行日志记录与展示
- [ ] 错误处理与异常捕获

### 第三阶段：流程测试（2周）
- [ ] Blockly 工作区集成
- [ ] 块之间的数据传递机制
- [ ] 流程编排保存与加载
- [ ] 完整流程执行引擎
- [ ] 流程版本管理

### 第四阶段：TeamCity 定制（1-2周）
- [ ] TeamCity API 集成
- [ ] 常用 TeamCity 操作块开发
- [ ] 构建触发与监控块
- [ ] 日志获取与展示块

### 第五阶段：AI 增强（可选，1-2周）
- [ ] AI 接口集成（OpenAI/Claude）
- [ ] 自然语言到流程的转换
- [ ] 智能推荐相关块
- [ ] 流程优化建议

---

## 核心功能模块

### 1. 块管理模块

#### 功能清单

**块类型管理**
- 创建块类型（服务器类、构建类、通知类、数据处理类等）
- 编辑/删除块类型
- 块类型图标自定义

**块 CRUD**
- 创建自定义块（名称、类型、描述、颜色、图标）
- 为块编写 Python 执行脚本
- 配置输入/输出参数
- 块版本管理
- 块权限控制（公开/私有）
- 块使用统计

**块测试**
- 一键测试功能
- 模拟输入参数
- 实时查看执行日志
- 测试结果保存

#### 数据结构

```json
{
  "id": 1,
  "name": "SSH 上传文件",
  "type_code": "ssh_upload",
  "description": "通过 SSH 上传文件到远程服务器",
  "color": "#5C7CFA",
  "script": "# Python 脚本内容\nimport paramiko\n...",
  "python_env_id": 1,
  "inputs": {
    "host": {
      "type": "string",
      "required": true,
      "default": "",
      "description": "服务器地址"
    },
    "file_path": {
      "type": "file",
      "required": true,
      "description": "本地文件路径"
    }
  },
  "outputs": {
    "remote_path": {
      "type": "string",
      "description": "远程文件路径"
    }
  },
  "is_public": true,
  "author_username": "admin",
  "create_time": "2025-01-15T10:00:00",
  "update_time": "2025-02-01T15:30:00"
}
```

> 注：根据实际 Entity 定义，Block 表的字段与文档保持一致。inputs/outputs 以 JSON 格式存储。

#### 内置块库（建议预置）

**构建类**
- Maven 构建
- Gradle 构建
- NPM 构建
- Yarn 构建
- Docker 镜像构建

**部署类**
- SSH 文件上传
- SCP 批量传输
- Docker 容器部署
- Kubernetes 部署
- Nginx 配置重载

**通知类**
- 钉钉机器人通知
- 企业微信通知
- 邮件通知
- Slack 通知

**工具类**
- 条件判断
- 循环执行
- 等待延迟
- 文件压缩/解压
- 环境变量设置

---

### 2. 上下文变量模块

#### 功能清单
- 添加全局变量（支持分组）
- 批量导入/导出变量
- 变量加密存储（敏感信息）
- 变量版本历史
- 变量引用追踪（查看哪些流程使用）
- 变量验证规则（格式校验）

#### 变量类型
- **TEXT (文本型)**：普通字符串
- **SECRET (密钥型)**：密码/Token（加密存储，界面脱敏显示）
- **JSON (JSON型)**：结构化配置
- **NUMBER (数字型)**：数值类型
- **FILE (文件型)**：证书文件路径

#### 环境类型
- **DEFAULT**：默认环境
- **DEV**：开发环境
- **TEST**：测试环境
- **PROD**：生产环境

#### 典型变量示例

```json
{
  "servers": {
    "prod_host": "192.168.1.100",
    "prod_port": 22,
    "prod_user": "deployer",
    "prod_password": "***encrypted***"
  },
  "docker": {
    "registry_url": "registry.example.com",
    "namespace": "production"
  },
  "notifications": {
    "dingtalk_webhook": "https://oapi.dingtalk.com/...",
    "email_recipients": ["dev@example.com"]
  },
  "teamcity": {
    "api_url": "https://teamcity.example.com",
    "api_token": "***encrypted***"
  }
}
```

#### 变量使用规范
- 脚本中通过 `context.get('变量名')` 获取
- 支持点分隔访问：`context.get('servers.prod_host')`
- 支持环境隔离：`context.get('db_host', env='prod')`

---

### 3. Python 环境管理模块

#### 功能清单
- 创建多个独立 Python 环境
- 为环境安装/卸载依赖包
- 环境依赖列表查看
- 环境导出/导入（requirements.txt）
- 环境使用统计
- 默认环境设置

#### 数据结构

```json
{
  "id": 1,
  "name": "部署环境",
  "python_version": "3.11",
  "description": "用于部署相关脚本",
  "packages": [
    {"name": "paramiko", "version": "3.0.0"},
    {"name": "requests", "version": "2.31.0"},
    {"name": "docker", "version": "6.1.3"}
  ],
  "is_default": true,
  "create_time": "2025-01-10T09:00:00Z"
}
```

#### 预置环境建议
- **基础环境**：常用工具库（requests, paramiko, pyyaml）
- **容器环境**：Docker、Kubernetes 相关库
- **数据处理**：pandas, numpy（用于日志分析）
- **测试环境**：pytest, selenium（用于自动化测试块）

---

### 4. 可视化编排模块

#### 核心能力
- 集成 Google Blockly 可视化编程界面
- 自定义工具箱分类展示
- 拖拽块到工作区
- 块连接与断开
- 块参数表单填写
- 块搜索与过滤
- 工作区缩放与平移
- 撤销/重做操作
- 流程保存与加载
- 流程导出（XML/JSON/Python代码）
- 流程分享（生成链接）
- 流程模板库

#### 界面布局

```
┌─────────────────────────────────────────────────────┐
│  BlockFlow - 可视化部署编排平台                     │
├───────────┬─────────────────────────────┬───────────┤
│ 工具箱    │  工作区                     │  属性面板 │
│           │                             │           │
│ 📦 构建   │   ┌─────────────┐          │  块属性   │
│  - Maven  │   │ Maven构建   │          │  ━━━━━━━ │
│  - NPM    │   └──────┬──────┘          │  名称:    │
│           │          │                  │  Maven构建│
│ 🚀 部署   │   ┌──────┴──────┐          │           │
│  - SSH    │   │ Docker打包  │          │  参数:    │
│  - Docker │   └──────┬──────┘          │  项目路径 │
│           │          │                  │  [输入框] │
│ 🔔 通知   │   ┌──────┴──────┐          │           │
│  - 钉钉   │   │ 钉钉通知    │          │  [测试]   │
│  - 邮件   │   └─────────────┘          │           │
└───────────┴─────────────────────────────┴───────────┘
│  [保存] [执行] [AI生成] [导出]                       │
└─────────────────────────────────────────────────────┘
```

#### 块连接规则
- 输出类型匹配输入类型
- 支持多输出单输入
- 支持条件分支
- 支持循环嵌套

---

### 5. 脚本执行引擎模块

#### 执行流程

```
1. 解析 Blockly XML
   ↓
2. 构建执行图（DAG）
   ↓
3. 注入上下文变量
   ↓
4. 按序执行块脚本
   ↓
5. 数据在块间传递
   ↓
6. 记录执行日志
   ↓
7. 返回执行结果
```

#### 核心功能
- **并行执行**：无依赖块可并行
- **错误处理**：失败回滚策略
- **超时控制**：单块执行超时限制
- **断点续传**：失败后从断点继续
- **实时日志**：WebSocket 推送执行日志
- **资源隔离**：容器化执行（可选）

#### 执行上下文

```python
class ExecutionContext:
    def __init__(self):
        self.variables = {}      # 全局变量
        self.block_outputs = {}  # 块输出缓存
        self.logs = []           # 执行日志
        self.status = "running"  # 执行状态
    
    def get(self, key, default=None):
        """获取变量"""
        return self.variables.get(key, default)
    
    def set(self, key, value):
        """设置变量"""
        self.variables[key] = value
    
    def log(self, message, level="info"):
        """记录日志"""
        self.logs.append({
            "time": datetime.now(),
            "level": level,
            "message": message
        })
```

#### 脚本 API 规范

```python
# 块脚本必须定义 execute 函数
def execute(context, inputs):
    """
    Args:
        context: ExecutionContext 对象
        inputs: dict，块的输入参数
    
    Returns:
        dict，块的输出结果
    """
    # 获取上下文变量
    host = context.get('prod_host')
    
    # 获取输入参数
    file_path = inputs.get('file_path')
    
    # 执行逻辑
    result = upload_file(host, file_path)
    
    # 记录日志
    context.log(f"文件上传成功: {result}")
    
    # 返回输出
    return {
        "remote_path": result,
        "success": True
    }
```

---

### 6. AI 辅助模块

#### 功能清单
- **自然语言生成流程**：输入需求，AI 生成完整流程
- **智能推荐**：根据当前流程推荐下一步块
- **流程优化**：分析流程并提供优化建议
- **错误诊断**：分析执行日志，给出修复建议
- **块代码生成**：根据描述生成块脚本

#### AI 生成示例

**输入**
```
构建 React 项目，打包成 Docker 镜像，部署到 K8s 生产环境，
如果部署成功发送钉钉通知，失败则回滚并发送告警邮件
```

**AI 输出流程**
```
1. [NPM 安装依赖]
2. [NPM 构建]
3. [Docker 镜像构建]
   ├─ 输入: 构建产物路径
   └─ 输出: 镜像 ID
4. [推送镜像到仓库]
5. [K8s 部署]
   ├─ 输入: 镜像 ID
   └─ 输出: 部署状态
6. [条件判断] (部署状态)
   ├─ 成功 → [钉钉通知]
   └─ 失败 → [K8s 回滚] → [邮件告警]
```

#### Prompt 设计

```
你是一个部署流程专家。用户会描述部署需求，你需要根据可用的块生成部署流程。

可用的块:
${blockList}

用户需求:
${userInput}

请输出 JSON 格式的流程定义:
{
  "blocks": [
    {
      "id": "block1",
      "type": "npm_build",
      "inputs": {"project_path": "/app"},
      "next": "block2"
    }
  ]
}
```

---

## 技术架构

### 前端技术栈
- **框架**：React 18 + TypeScript
- **UI 库**：Ant Design / Material-UI
- **可视化**：Blockly.js
- **代码编辑器**：Monaco Editor（VS Code 同款）
- **状态管理**：Zustand / Redux Toolkit
- **HTTP 客户端**：Axios
- **实时通信**：WebSocket / SSE

### 后端技术栈
- **开发语言**：Java 17+
- **框架**：Spring Boot 3.x
- **ORM**：Spring Data JPA + Hibernate
- **数据库**：MySQL 8.0+
- **缓存**：Redis（可选）
- **任务队列**：RabbitMQ / Kafka（可选）
- **脚本执行**：
  - Jython（Java 中执行 Python）
  - ProcessBuilder（独立进程）
  - Docker SDK（容器化执行）
- **远程执行**：JSch / Apache MINA SSHD
- **API 文档**：SpringDoc OpenAPI

### 部署架构
```
┌─────────────┐
│   Nginx     │ (反向代理 + 静态资源)
└──────┬──────┘
       │
┌──────┴──────┐
│  Spring Boot │ (核心服务)
└──────┬──────┘
       │
┌──────┴──────┐
│   MySQL     │ (数据持久化)
└─────────────┘
```

---

## 数据库设计（完善版）

### 块类型表
```sql
CREATE TABLE block_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL COMMENT '类型代码',
  name VARCHAR(100) NOT NULL COMMENT '类型名称',
  description VARCHAR(500) COMMENT '类型描述',
  icon VARCHAR(50) COMMENT '图标名称',
  sort_order INT DEFAULT 0 COMMENT '排序',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='块类型表';
```

### 块定义表
```sql
CREATE TABLE blocks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '块名称',
  type_code VARCHAR(50) NOT NULL COMMENT '块类型标识',
  block_type_id BIGINT NOT NULL COMMENT '块类型ID',
  description TEXT COMMENT '块描述',
  color VARCHAR(20) DEFAULT '#5C7CFA' COMMENT '块颜色',
  icon VARCHAR(50) COMMENT '块图标',
  script TEXT NOT NULL COMMENT '执行脚本',
  python_env_id BIGINT COMMENT 'Python环境ID',
  inputs JSON COMMENT '输入参数定义',
  outputs JSON COMMENT '输出参数定义',
  category VARCHAR(50) COMMENT '分类',
  is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
  author_id BIGINT COMMENT '创建者ID',
  usage_count INT DEFAULT 0 COMMENT '使用次数',
  version VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type_code (type_code),
  INDEX idx_block_type (block_type_id),
  INDEX idx_author (author_id),
  FOREIGN KEY (block_type_id) REFERENCES block_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='块定义表';
```

### 上下文变量表
```sql
CREATE TABLE context_variables (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  var_key VARCHAR(100) UNIQUE NOT NULL COMMENT '变量名',
  var_value TEXT NOT NULL COMMENT '变量值',
  var_type ENUM('text', 'secret', 'json', 'file') DEFAULT 'text' COMMENT '变量类型',
  group_name VARCHAR(50) COMMENT '分组名称',
  description VARCHAR(500) COMMENT '变量描述',
  is_encrypted BOOLEAN DEFAULT FALSE COMMENT '是否加密',
  environment VARCHAR(20) DEFAULT 'default' COMMENT '环境(dev/test/prod)',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (var_key),
  INDEX idx_group (group_name),
  INDEX idx_env (environment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上下文变量表';
```

### Python 环境表
```sql
CREATE TABLE python_environments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL COMMENT '环境名称',
  python_version VARCHAR(20) NOT NULL COMMENT 'Python版本',
  description VARCHAR(500) COMMENT '环境描述',
  packages JSON COMMENT '已安装包列表',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认环境',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Python环境表';
```

### 流程定义表
```sql
CREATE TABLE workflows (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '流程名称',
  description TEXT COMMENT '流程描述',
  blockly_xml TEXT NOT NULL COMMENT 'Blockly XML数据',
  blockly_json JSON COMMENT 'Blockly JSON数据',
  author_id BIGINT COMMENT '创建者ID',
  is_template BOOLEAN DEFAULT FALSE COMMENT '是否为模板',
  category VARCHAR(50) COMMENT '流程分类',
  tags JSON COMMENT '标签',
  version VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_author (author_id),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程定义表';
```

### 执行记录表
```sql
CREATE TABLE execution_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  workflow_id BIGINT NOT NULL COMMENT '流程ID',
  workflow_name VARCHAR(100) COMMENT '流程名称快照',
  executor_id BIGINT COMMENT '执行者ID',
  status ENUM('running', 'success', 'failed', 'cancelled') DEFAULT 'running' COMMENT '执行状态',
  trigger_type ENUM('manual', 'schedule', 'webhook', 'api') DEFAULT 'manual' COMMENT '触发方式',
  logs LONGTEXT COMMENT '执行日志',
  error_message TEXT COMMENT '错误信息',
  input_params JSON COMMENT '输入参数',
  output_result JSON COMMENT '输出结果',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  duration INT COMMENT '执行时长(秒)',
  INDEX idx_workflow (workflow_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执行记录表';
```

### 用户表
```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  real_name VARCHAR(50) COMMENT '真实姓名',
  role ENUM('admin', 'user', 'viewer') DEFAULT 'user' COMMENT '角色',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  last_login_time TIMESTAMP NULL COMMENT '最后登录时间',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

## 核心 API 设计

### 认证接口
```http
POST   /api/auth/login           # 用户登录
POST   /api/auth/logout          # 用户登出
POST   /api/auth/refresh         # 刷新Token
GET    /api/auth/me              # 获取当前用户信息
```

### 块类型接口
```http
POST   /api/block-types          # 创建块类型
GET    /api/block-types          # 获取块类型列表
GET    /api/block-types/:id      # 获取块类型详情
PUT    /api/block-types/:id      # 更新块类型
DELETE /api/block-types/:id      # 删除块类型
```

### 块管理接口
```http
POST   /api/blocks               # 创建块
GET    /api/blocks               # 获取块列表(支持分页/搜索/过滤)
GET    /api/blocks/:id           # 获取块详情
PUT    /api/blocks/:id           # 更新块
DELETE /api/blocks/:id           # 删除块
POST   /api/blocks/:id/test      # 测试块执行
GET    /api/blocks/:id/usage     # 获取块使用统计
POST   /api/blocks/:id/clone     # 克隆块
```

### 上下文变量接口
```http
POST   /api/context              # 添加变量
GET    /api/context              # 获取所有变量(支持分组/环境过滤)
GET    /api/context/:key         # 获取单个变量
PUT    /api/context/:key         # 更新变量
DELETE /api/context/:key         # 删除变量
POST   /api/context/import       # 批量导入变量
GET    /api/context/export       # 批量导出变量
```

### Python 环境接口
```http
POST   /api/python-envs          # 创建环境
GET    /api/python-envs          # 获取环境列表
GET    /api/python-envs/:id      # 获取环境详情
PUT    /api/python-envs/:id      # 更新环境
DELETE /api/python-envs/:id      # 删除环境
POST   /api/python-envs/:id/packages  # 安装包
DELETE /api/python-envs/:id/packages/:name  # 卸载包
```

### 流程管理接口
```http
POST   /api/workflows            # 创建流程
GET    /api/workflows            # 获取流程列表
GET    /api/workflows/:id        # 获取流程详情
PUT    /api/workflows/:id        # 更新流程
DELETE /api/workflows/:id        # 删除流程
POST   /api/workflows/:id/clone  # 克隆流程
GET    /api/workflows/templates  # 获取流程模板
```

### 执行接口
```http
POST   /api/executions           # 执行流程
GET    /api/executions           # 获取执行历史
GET    /api/executions/:id       # 获取执行详情
GET    /api/executions/:id/logs  # 获取执行日志(支持流式)
POST   /api/executions/:id/cancel # 取消执行
DELETE /api/executions/:id       # 删除执行记录
```

### AI 接口
```http
POST   /api/ai/generate          # AI生成流程
POST   /api/ai/recommend         # AI推荐块
POST   /api/ai/optimize          # AI优化流程
POST   /api/ai/diagnose          # AI诊断错误
POST   /api/ai/code-gen          # AI生成块代码
```

### 统计接口
```http
GET    /api/stats/dashboard      # 获取仪表盘数据
GET    /api/stats/blocks         # 块使用统计
GET    /api/stats/workflows      # 流程执行统计
GET    /api/stats/executions     # 执行成功率统计
```

---

## 安全设计

### 1. 代码沙箱
- **禁用危险模块**：限制 `os.system`、`subprocess` 等
- **资源限制**：CPU、内存、磁盘 I/O 限制
- **网络隔离**：仅允许访问白名单域名
- **文件系统隔离**：仅能访问指定目录

### 2. 权限控制
- **RBAC 模型**：管理员/普通用户/访客
- **块权限**：公开/私有/团队共享
- **流程权限**：创建者/协作者/查看者
- **操作审计**：记录所有敏感操作

### 3. 数据安全
- **敏感信息加密**：AES-256 加密密码/Token
- **SQL 注入防护**：使用 JPA 预编译
- **XSS 防护**：前端输入过滤
- **CSRF 防护**：Token 验证

### 4. 执行安全
- **超时控制**：单块最大执行 5 分钟
- **并发限制
