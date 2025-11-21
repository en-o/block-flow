# BlockFlow - 可视化流程编排平台

## 📋 项目概述

BlockFlow 是一个基于可视化节点编排的脚本执行平台，允许用户通过拖拽<实现中>自定义块（Block）来编排 Python 脚本执行流程，降低重复性操作成本，提升工作效率。


### 核心价值

1. **可视化编排** - 通过拖拽节点方式构建流程，无需手写复杂的脚本逻辑
2. **脚本复用** - 将常用脚本封装为可复用的块，支持参数化配置
3. **环境隔离** - 支持多个独立的 Python 环境，不同块可使用不同环境
4. **知识沉淀** - 将运维经验、自动化流程固化为可复用的块和流程模板
5. **灵活扩展** - 支持代码模式和可视化模式，满足不同复杂度需求

### 技术栈

**后端**
- Java 17 + Spring Boot 3.4.11
- Spring Data JPA + MySQL 8
- Python 脚本执行引擎

**前端**
- React 19 + TypeScript
- Ant Design 5（UI 组件）
- XYFlow 12（流程图编排）
- Blockly 12（可视化编程，仅预览用）
- Monaco Editor 4（代码编辑器）

---

## 🎯 核心功能模块

### 1. 块管理（Block Management）

块是 BlockFlow 的基本执行单元，封装了一段可执行的 Python 脚本。

#### 主要功能

- **块 CRUD** - 创建、编辑、删除、克隆块
- **双定义模式**
  - 代码模式：使用 Monaco Editor 直接编写 Python 脚本
  - 可视化模式：使用 Blockly 预览脚本逻辑（仅预览，不保存）
- **参数配置** - 定义块的输入参数和输出参数（支持类型：string, number, boolean, object）
- **标签管理** - 为块添加标签，支持标签统计和快速筛选
- **Python 环境绑定** - 为每个块指定运行的 Python 环境
- **公开/私有** - 控制块的可见性，支持团队共享
- **测试执行** - 在块编辑器中直接测试块的执行结果

#### 块的数据结构

```json
{
  "id": 1,
  "name": "数据清洗",
  "typeCode": "data_process",
  "description": "清洗和格式化数据",
  "color": "#5C7CFA",
  "icon": "🔧",
  "definitionMode": "CODE",
  "script": "# Python 脚本内容...",
  "pythonEnvId": 1,
  "inputs": {
    "data": {
      "type": "object",
      "defaultValue": "",
      "description": "输入的原始数据"
    }
  },
  "outputs": {
    "result": {
      "type": "object",
      "description": "清洗后的数据"
    }
  },
  "tags": ["数据处理", "清洗"],
  "isPublic": true,
  "version": "1.0.0"
}
```

---

### 2. 块类型管理（Block Type Management）

块类型用于对块进行分类，便于组织和查找。

#### 主要功能

- 创建、编辑、删除块类型
- 设置类型图标和颜色
- 设置排序顺序

#### 预置块类型建议

- **构建类**（BUILD）- Maven 构建、NPM 构建、Docker 构建
- **部署类**（DEPLOY）- SSH 部署、Docker 部署、K8s 部署
- **通知类**（NOTIFY）- 钉钉通知、邮件通知、企业微信通知
- **数据处理类**（DATA）- 数据清洗、格式转换、数据分析
- **工具类**（UTIL）- 条件判断、循环、延迟等待

---

### 3. 流程编排（Workflow Orchestration）

流程是由多个块通过连接线组成的有向无环图（DAG），定义了块的执行顺序和数据流向。

#### 主要功能

- **可视化编排** - 使用 XYFlow 拖拽块到画布，连接块的输入输出
- **参数配置** - 为流程中的每个块配置输入参数值
- **流程保存** - 保存流程定义（JSON 格式）
- **流程分类** - 为流程设置分类，便于管理
- **公开流程** - 将流程设为公开，其他用户可使用（复制为新流程）
- **导入导出** - 支持导入导出流程 JSON 文件
- **流程执行** - 执行流程并查看执行结果

#### 流程的数据结构

```json
{
  "id": 1,
  "name": "数据处理流程",
  "description": "从数据库读取数据，清洗后发送通知",
  "category": "data_process",
  "flowDefinition": {
    "nodes": [
      {
        "id": "node-1",
        "type": "blockNode",
        "position": {"x": 100, "y": 100},
        "data": {
          "blockId": 10,
          "blockName": "读取数据",
          "inputValues": {
            "query": "SELECT * FROM users"
          }
        }
      },
      {
        "id": "node-2",
        "type": "blockNode",
        "position": {"x": 300, "y": 100},
        "data": {
          "blockId": 11,
          "blockName": "数据清洗"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2",
        "sourceHandle": "output-data",
        "targetHandle": "input-data"
      }
    ]
  },
  "isPublic": true,
  "version": "1.0.0"
}
```

#### 流程执行逻辑

1. 解析流程的 nodes 和 edges
2. 构建块之间的依赖关系（DAG）
3. 拓扑排序确定执行顺序
4. 按顺序执行每个块的 Python 脚本
5. 通过连接线传递块之间的数据（上一个块的输出 → 下一个块的输入）
6. 记录执行日志和结果

---

### 4. Python 环境管理（Python Environment Management）

支持配置多个独立的 Python 运行环境，每个环境包含独立的依赖包和配置。

#### 主要功能

- **环境创建** - 创建新的 Python 环境
- **运行时配置** - 支持两种方式：
  - 手动配置：指定系统已安装的 Python 路径
  - 上传运行时：上传 Python 嵌入式版本（.zip/.tar.gz）
- **依赖包管理**
  - 在线安装：通过 pip 在线安装包（需要网络）
  - 离线安装：上传 .whl/.tar.gz 包文件
- **默认环境** - 设置默认 Python 环境（新建块时自动选择）
- **包列表查看** - 查看已安装的包及其版本
- **导出 requirements.txt** - 导出环境的依赖列表

#### 环境隔离原理

BlockFlow 的环境隔离通过三层实现：

1. **目录隔离** - 每个环境有独立的根目录和 site-packages
2. **进程隔离** - 每次执行使用独立的 Python 进程
3. **数据隔离** - 每个环境的包列表独立存储

---

### 5. 上下文变量管理（Context Variables）

上下文变量是全局配置变量，会自动注入到所有块的执行环境中。

#### 主要功能

- **变量 CRUD** - 创建、编辑、删除上下文变量
- **变量类型** - 支持字符串、数字等类型
- **自动注入** - 块执行时自动注入，通过 `ctx.` 前缀访问

#### 使用示例

```python
# 在块脚本中访问上下文变量
db_host = inputs.get('ctx.DB_HOST', 'localhost')
db_port = safe_int(inputs.get('ctx.DB_PORT'), 3306)
api_key = inputs.get('ctx.API_KEY', '')
```

---

### 6. 用户管理（User Management）

支持多用户协作，提供基于角色的访问控制。

#### 用户角色

- **ADMIN（管理员）** - 拥有所有权限，包括用户管理、Python 环境管理
- **USER（普通用户）** - 可创建/编辑块和流程，访问管理后台
- **VIEWER（访客）** - 仅可浏览和执行流程，不可编辑

#### 主要功能

- 用户注册/登录
- 用户信息管理
- 角色和权限控制
- 个人资料修改

---

## 🏗️ 系统架构

### 前端页面结构

```
/                    - 首页（重定向到 /flow）
/login               - 登录页
/register            - 注册页
/flow                - 流程编排页（核心）
/block-editor        - 块编辑器页
/block-editor/:id    - 编辑现有块
/manage              - 管理后台
  ├─ /blocks         - 块管理
  ├─ /block-types    - 块类型管理
  ├─ /workflow-categories  - 流程分类管理
  ├─ /python-envs    - Python 环境管理
  ├─ /context        - 上下文变量管理
  ├─ /users          - 用户管理（仅 ADMIN）
  └─ /profile        - 个人资料
```

### 后端 API 结构

```
/api/auth/*          - 认证接口（登录、注册）
/api/blocks/*        - 块管理接口
/api/block-types/*   - 块类型接口
/api/workflows/*     - 流程管理接口
/api/workflow-categories/*  - 流程分类接口
/api/python-envs/*   - Python 环境接口
/api/context/*       - 上下文变量接口
/api/users/*         - 用户管理接口
```

### 核心技术组件

| 组件 | 技术 | 用途 |
|------|------|------|
| 流程编排引擎 | XYFlow (ReactFlow) | 可视化流程编排工作区 |
| 块编辑器（可视化） | Blockly | 块脚本的可视化预览（不保存） |
| 代码编辑器 | Monaco Editor | 编写 Python 脚本 |
| Python 执行引擎 | ProcessBuilder | 独立进程执行 Python 脚本 |
| 认证 | JWT | 用户认证和授权 |

---

## 💡 核心设计理念

### 1. 块（Block）

块是最小的执行单元，包含：
- **脚本** - Python 代码（通过 `inputs` 获取参数，通过 `outputs` 返回结果）
- **参数定义** - 输入参数和输出参数的类型和描述
- **环境绑定** - 指定运行的 Python 环境

### 2. 流程（Workflow）

流程是块的有序组合，通过连接线定义数据流：
- **节点（Node）** - 代表一个块的实例
- **连接线（Edge）** - 定义块之间的数据传递关系
- **执行顺序** - 通过拓扑排序自动确定

### 3. 数据流转

```
Block A (outputs.result = "hello")
   ↓ (连接线: output-result → input-data)
Block B (inputs.data = "hello")
   ↓ (执行逻辑)
Block B (outputs.processed = "HELLO")
```

---

## 🔧 Python 脚本规范

### 脚本模板

```python
# -*- coding: utf-8 -*-

# ========== 安全转换函数 ==========
def safe_int(value, default=0):
    """安全转换为整数"""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

# ========== 获取输入参数 ==========
# 字符串参数
name = inputs.get('name', '')

# 数字参数（使用安全转换）
count = safe_int(inputs.get('count'), 0)

# 上下文变量（自动注入）
db_host = inputs.get('ctx.DB_HOST', 'localhost')

# ========== 执行业务逻辑 ==========
result = f"处理 {count} 条数据"
print(f"开始处理: {name}")  # print 输出会显示在控制台输出区域

# ========== 设置输出结果（必需） ==========
outputs = {
    "success": True,
    "result": result,
    "data": {"name": name, "count": count}
}
```

### 关键要点

1. **inputs 字典** - 所有参数通过 `inputs.get('参数名', 默认值)` 获取
2. **上下文变量** - 使用 `ctx.` 前缀（如 `ctx.DB_HOST`）
3. **类型转换** - JSON 传输时参数可能是字符串，使用 `safe_int/safe_float/safe_bool` 转换
4. **outputs 字典** - 必须定义 `outputs` 变量（字典类型），作为块的执行结果
5. **print 输出** - print() 的内容会单独显示，不影响 outputs 的 JSON 格式

---

## 🚀 典型使用场景

### 场景 1：数据处理流程

1. 创建 "读取数据库" 块（输出：data）
2. 创建 "数据清洗" 块（输入：data，输出：cleaned_data）
3. 创建 "发送通知" 块（输入：cleaned_data）
4. 在流程编排页拖拽三个块，连接数据流
5. 配置参数后执行流程

### 场景 2：自动化部署流程

1. 创建 "Maven 构建" 块
2. 创建 "Docker 打包" 块
3. 创建 "SSH 部署" 块
4. 创建 "钉钉通知" 块
5. 编排流程：构建 → 打包 → 部署 → 通知
6. 保存为公开流程模板供团队使用

### 场景 3：定时任务

1. 创建 "数据统计" 流程
2. 设置流程为公开
3. 通过外部调度工具（如 cron）调用流程执行 API
4. 查看执行日志

---

## 📊 数据库设计

### 核心表

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| blocks | 块定义 | name, script, inputs, outputs, pythonEnvId, tags |
| block_types | 块类型 | code, name, description |
| workflows | 流程定义 | name, flowDefinition (JSON), category, isPublic |
| workflow_categories | 流程分类 | code, name, sortOrder |
| python_environments | Python 环境 | name, pythonExecutable, sitePackagesPath, packages |
| context_variables | 上下文变量 | name, value, varType |
| users | 用户 | username, password (BCrypt), role |
| execution_logs | 执行日志 | workflowId, status, logs, startTime |

---

## 🔐 安全设计

### 1. 脚本执行安全

- **进程隔离** - 每次执行使用独立的 Python 进程
- **超时控制** - 默认 60 秒超时，防止死循环
- **资源限制** - 通过 Python 环境隔离限制可用资源
- **异常捕获** - 自动捕获脚本异常并返回友好错误

### 2. 用户认证

- **密码加密** - 使用 BCrypt 加密存储
- **JWT Token** - 前端存储在 localStorage
- **角色控制** - 基于 RBAC 的权限管理

### 3. 数据安全

- **SQL 注入防护** - 使用 JPA 预编译语句
- **XSS 防护** - 前端输入过滤和转义
- **HTTPS** - 生产环境强制使用 HTTPS

---

## 📈 未来扩展方向

### 1. 定时任务

- 支持 Cron 表达式定时执行流程
- 集成调度引擎（Quartz）

### 2. Webhook 触发

- 提供 Webhook URL
- 支持外部系统触发流程执行

### 3. 流程监控

- 实时执行状态监控
- 执行成功率统计
- 失败告警通知

### 4. 协作功能

- 流程多人协作编辑
- 评论和审批机制
- 版本历史对比

### 5. 块市场

- 开放块分享市场
- 块评分和评论
- 官方认证块

---

## 📚 快速开始

### 开发环境准备

**后端**
```bash
# 要求 Java 17+, Maven 3.8+, MySQL 8+
cd api
mvn clean install
mvn spring-boot:run
```

**前端**
```bash
# 要求 Node.js 18+
cd web
npm install
npm run dev
```

### 首次使用

1. 访问 `http://localhost:5173`
2. 注册管理员账号
3. 登录后进入管理后台
4. 配置 Python 环境
5. 创建块
6. 在流程编排页拖拽块创建流程
7. 执行流程查看结果


