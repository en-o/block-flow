@echo off
REM Block Flow Docker 镜像构建脚本
REM 功能：自动化完成清理环境、Maven 打包、Docker 镜像构建的全流程

setlocal enabledelayedexpansion

echo ==========================================
echo   Block Flow - Docker 镜像构建脚本
echo ==========================================
echo.

REM 配置变量
set IMAGE_NAME=tannnn/block-flow
set IMAGE_TAG=latest
set FULL_IMAGE_NAME=%IMAGE_NAME%:%IMAGE_TAG%

echo [信息] Docker 镜像信息：
echo    镜像名称: %FULL_IMAGE_NAME%
echo.

REM 步骤 1: 清理环境
echo [步骤 1/4] 清理环境
echo 清理 node_modules、dist、target 目录...

if exist "web\node_modules" rd /s /q "web\node_modules"
if exist "web\dist" rd /s /q "web\dist"
if exist "api\target" rd /s /q "api\target"

echo [完成] 清理完成
echo.

REM 步骤 2: 执行本地 Maven 打包
echo [步骤 2/4] 执行本地 Maven 打包
echo.

if not exist "build-local.bat" (
    echo [错误] 未找到 build-local.bat 脚本
    exit /b 1
)

call build-local.bat
if %errorlevel% neq 0 (
    echo [错误] 本地构建失败
    exit /b 1
)

echo.

REM 步骤 3: 验证构建产物
echo [步骤 3/4] 验证构建产物

if not exist "api\target\block-flow-0.0.1-SNAPSHOT.jar" (
    echo [错误] 未找到 JAR 文件
    echo    期望位置: api\target\block-flow-0.0.1-SNAPSHOT.jar
    exit /b 1
)

echo [完成] 构建产物验证通过
echo.

REM 步骤 4: 构建 Docker 镜像
echo [步骤 4/4] 构建 Docker 镜像
echo 执行命令: docker build -t %FULL_IMAGE_NAME% -f api\Dockerfile .
echo.

docker build -t "%FULL_IMAGE_NAME%" -f api\Dockerfile .
if %errorlevel% neq 0 (
    echo.
    echo [错误] Docker 镜像构建失败
    exit /b 1
)

echo.
echo ==========================================
echo   [成功] Docker 镜像构建成功！
echo ==========================================
echo.
echo [镜像] 镜像信息：
echo    名称: %FULL_IMAGE_NAME%
echo.
echo [提示] 下一步操作：
echo.
echo    1. 直接运行容器（快速启动）：
echo       docker run -d -p 8777:8777 --name block-flow %FULL_IMAGE_NAME%
echo.
echo    2. 使用 Docker Compose（推荐）：
echo       docker-compose up -d
echo.
echo    3. 查看日志：
echo       docker logs -f block-flow
echo.
echo    4. 访问应用：
echo       应用首页: http://localhost:8777
echo       API文档:  http://localhost:8777/doc.html
echo.
echo ==========================================

endlocal
