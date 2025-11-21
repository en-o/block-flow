@echo off
REM Block Flow 本地构建脚本
REM 功能：在宿主机上执行 Maven 打包，包含前端构建，生成 Docker 构建所需的产物

setlocal enabledelayedexpansion

echo ==========================================
echo   Block Flow - 本地构建脚本
echo ==========================================
echo.

REM 检查 Java 环境
echo [检查] 检查 Java 环境...
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Java 命令
    echo 请安装 JDK 17 或更高版本
    exit /b 1
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VERSION=%%g
)
set JAVA_VERSION=%JAVA_VERSION:"=%
for /f "delims=. tokens=1" %%v in ("%JAVA_VERSION%") do set JAVA_MAJOR=%%v
echo Java 版本: %JAVA_VERSION%

if %JAVA_MAJOR% lss 17 (
    echo [错误] 需要 Java 17 或更高版本
    echo 当前版本: %JAVA_VERSION%
    exit /b 1
)

REM 检查 Maven 环境
echo.
echo [检查] 检查 Maven 环境...
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Maven 命令
    echo 请安装 Maven 3.6 或更高版本
    exit /b 1
)

for /f "tokens=3" %%g in ('mvn -version ^| findstr /i "Apache Maven"') do (
    set MVN_VERSION=%%g
    goto :found_version
)
:found_version
echo Maven 版本: %MVN_VERSION%

REM 进入 api 目录
echo.
echo [构建] 进入 api 目录...
cd api
if %errorlevel% neq 0 (
    echo [错误] 无法进入 api 目录
    exit /b 1
)

REM 执行 Maven 打包（会自动构建前端）
echo.
echo [构建] 开始 Maven 打包（包含前端构建）...
echo 执行命令: mvn clean package -DskipTests
echo.
echo 提示：Maven 会自动执行以下步骤：
echo   1. 安装 Node.js 和 npm
echo   2. 安装前端依赖 (npm install)
echo   3. 构建前端项目 (npm run build:merged)
echo   4. 编译 Java 代码
echo   5. 打包 JAR 文件
echo   6. 打包完整的可执行 JAR（包含所有依赖）
echo.

call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [错误] Maven 打包失败
    cd ..
    exit /b 1
)

REM 检查构建结果
echo.
echo [检查] 检查构建产物...

if not exist "target\block-flow-0.0.1-SNAPSHOT.jar" (
    echo [错误] 构建失败：未找到 JAR 文件
    cd ..
    exit /b 1
)

REM 返回项目根目录
cd ..

echo.
echo [成功] 本地构建完成！
echo.
echo [产物] 构建产物位置：
echo    - api\target\block-flow-0.0.1-SNAPSHOT.jar (完整的可执行 JAR)
echo.
echo [提示] 下一步：
echo    方式1：直接运行 JAR：
echo           cd api\target ^&^& java -jar block-flow-0.0.1-SNAPSHOT.jar
echo.
echo    方式2：构建 Docker 镜像：
echo           docker-build.bat
echo.
echo ==========================================

endlocal

