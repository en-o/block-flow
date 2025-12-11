package cn.tannn.cat.block.util;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Python环境检测工具类
 * 提供Python解释器检测、版本检测、site-packages路径检测等功能
 *
 * @author tnnn
 */
@Slf4j
public class PythonEnvDetector {

    /**
     * 在目录中检测Python可执行文件
     *
     * @param directory 目录路径
     * @return Python可执行文件的绝对路径，未找到返回null
     */
    public static String detectPythonExecutable(String directory) {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) {
            log.warn("目录不存在或不是目录: {}", directory);
            return null;
        }

        // 先查找bin目录
        File binDir = findBinDirectory(dir, 0, 3);
        if (binDir != null) {
            String pythonPath = findPythonExecutableInBin(binDir);
            if (pythonPath != null) {
                log.info("在bin目录中找到Python: {}", pythonPath);
                return pythonPath;
            }
        }

        // 递归查找
        String pythonPath = findPythonExecutableRecursively(dir, 0, 3);
        if (pythonPath != null) {
            log.info("递归搜索找到Python: {}", pythonPath);
            return pythonPath;
        }

        log.warn("未找到Python可执行文件: {}", directory);
        return null;
    }

    /**
     * 查找bin目录
     */
    private static File findBinDirectory(File dir, int depth, int maxDepth) {
        if (depth > maxDepth || !dir.isDirectory()) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        // 优先查找当前层级的bin目录
        for (File file : files) {
            if (file.isDirectory() && (file.getName().equals("bin") || file.getName().equals("Scripts"))) {
                return file;
            }
        }

        // 递归查找子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                File result = findBinDirectory(file, depth + 1, maxDepth);
                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    /**
     * 在bin目录中查找Python可执行文件
     */
    private static String findPythonExecutableInBin(File binDir) {
        File[] files = binDir.listFiles();
        if (files == null) {
            return null;
        }

        // 优先级: python3 > python > python3.x
        File python3 = null;
        File python = null;
        File python3x = null;

        for (File file : files) {
            if (file.isFile()) {
                String name = file.getName();
                if (name.equals("python3") || name.equals("python3.exe")) {
                    python3 = file;
                } else if (name.equals("python") || name.equals("python.exe")) {
                    python = file;
                } else if (name.matches("python3\\.\\d+(\\.exe)?")) {
                    if (python3x == null) {
                        python3x = file;
                    }
                }
            }
        }

        File selected = python3 != null ? python3 : (python != null ? python : python3x);
        return selected != null ? selected.getAbsolutePath() : null;
    }

    /**
     * 递归查找Python可执行文件
     */
    private static String findPythonExecutableRecursively(File dir, int depth, int maxDepth) {
        if (depth > maxDepth || !dir.isDirectory()) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        // 先检查当前目录
        for (File file : files) {
            if (file.isFile()) {
                String name = file.getName();
                if (name.equals("python3") || name.equals("python3.exe") ||
                        name.equals("python") || name.equals("python.exe")) {
                    return file.getAbsolutePath();
                }
            }
        }

        // 递归搜索子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String result = findPythonExecutableRecursively(file, depth + 1, maxDepth);
                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    /**
     * 验证Python可执行文件
     *
     * @param pythonPath Python路径
     * @return 是否有效
     */
    public static boolean verifyPythonExecutable(String pythonPath) {
        if (pythonPath == null || pythonPath.trim().isEmpty()) {
            return false;
        }

        File file = new File(pythonPath);
        if (!file.exists() || !file.isFile()) {
            log.warn("Python文件不存在: {}", pythonPath);
            return false;
        }

        // 尝试执行 python --version
        try {
            ProcessBuilder pb = new ProcessBuilder(pythonPath, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine();
                int exitCode = process.waitFor();

                if (exitCode == 0 && line != null && line.toLowerCase().contains("python")) {
                    log.info("Python验证成功: {} -> {}", pythonPath, line);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("验证Python可执行文件失败: {}", pythonPath, e);
        }

        return false;
    }

    /**
     * 检测Python版本
     *
     * @param pythonExecutable Python可执行文件路径
     * @return Python版本号，如"3.9.7"
     */
    public static String detectPythonVersion(String pythonExecutable) {
        if (pythonExecutable == null || pythonExecutable.trim().isEmpty()) {
            return null;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine();
                process.waitFor();

                if (line != null) {
                    // 匹配版本号: Python 3.9.7
                    Pattern pattern = Pattern.compile("Python\\s+(\\d+\\.\\d+\\.\\d+)");
                    Matcher matcher = pattern.matcher(line);
                    if (matcher.find()) {
                        String version = matcher.group(1);
                        log.info("检测到Python版本: {}", version);
                        return version;
                    }
                }
            }
        } catch (Exception e) {
            log.error("检测Python版本失败: {}", pythonExecutable, e);
        }

        return null;
    }

    /**
     * 从文件名中提取Python版本号
     *
     * @param filename 文件名
     * @return 版本号，如"3.9.7"
     */
    public static String extractPythonVersionFromFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }

        // 匹配 python-3.9.7 或 cpython-3.9.7 或 Python-3.9.7
        Pattern pattern = Pattern.compile("(?i)(?:c?python)?[-_]?(\\d+\\.\\d+(?:\\.\\d+)?)");
        Matcher matcher = pattern.matcher(filename);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    /**
     * 检测site-packages路径
     *
     * @param directory Python环境目录
     * @return site-packages路径
     */
    public static String detectSitePackagesPath(String directory) {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) {
            return null;
        }

        String sitePackages = findSitePackagesRecursively(dir, 0, 5);
        if (sitePackages != null) {
            log.info("找到site-packages: {}", sitePackages);
        } else {
            log.warn("未找到site-packages目录: {}", directory);
        }

        return sitePackages;
    }

    /**
     * 递归查找site-packages目录
     */
    private static String findSitePackagesRecursively(File dir, int depth, int maxDepth) {
        if (depth > maxDepth || !dir.isDirectory()) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        // 检查当前目录是否为site-packages
        if (dir.getName().equals("site-packages")) {
            return dir.getAbsolutePath();
        }

        // 递归搜索子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String result = findSitePackagesRecursively(file, depth + 1, maxDepth);
                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    /**
     * 检测架构不匹配问题
     *
     * @param directory Python环境目录
     * @return 错误信息，无问题返回null
     */
    public static String detectArchitectureMismatch(String directory) {
        File dir = new File(directory);
        if (!dir.exists()) {
            return null;
        }

        // 检测文件名中的架构标识
        String filename = dir.getName();

        // 常见架构标识
        String[] x86Markers = {"x86_64", "amd64", "x64"};
        String[] armMarkers = {"aarch64", "arm64", "armv7"};
        String[] windowsMarkers = {"win32", "win_amd64", "windows"};
        String[] linuxMarkers = {"linux", "gnu", "musl"};
        String[] macMarkers = {"darwin", "macos", "osx"};

        // 获取当前系统架构
        String osArch = System.getProperty("os.arch").toLowerCase();
        String osName = System.getProperty("os.name").toLowerCase();

        boolean isX86 = osArch.contains("amd64") || osArch.contains("x86_64");
        boolean isArm = osArch.contains("aarch64") || osArch.contains("arm");
        boolean isWindows = osName.contains("win");
        boolean isLinux = osName.contains("linux");
        boolean isMac = osName.contains("mac");

        // 检查架构匹配
        String filenameLower = filename.toLowerCase();

        if (isX86 && containsAny(filenameLower, armMarkers)) {
            return String.format("架构不匹配: 当前系统为x86_64，但Python包为ARM架构 (%s)", osArch);
        }

        if (isArm && containsAny(filenameLower, x86Markers)) {
            return String.format("架构不匹配: 当前系统为ARM，但Python包为x86_64架构 (%s)", osArch);
        }

        if (isWindows && !containsAny(filenameLower, windowsMarkers) && containsAny(filenameLower, linuxMarkers)) {
            return "平台不匹配: 当前系统为Windows，但Python包为Linux版本";
        }

        if (isLinux && !containsAny(filenameLower, linuxMarkers) && containsAny(filenameLower, windowsMarkers)) {
            return "平台不匹配: 当前系统为Linux，但Python包为Windows版本";
        }

        return null;
    }

    /**
     * 检查字符串是否包含数组中的任意一个元素
     */
    private static boolean containsAny(String str, String[] markers) {
        for (String marker : markers) {
            if (str.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取推荐的架构标识
     *
     * @param osArch 系统架构
     * @return 推荐的架构标识
     */
    public static String getRecommendedArchitecture(String osArch) {
        if (osArch.contains("amd64") || osArch.contains("x86_64")) {
            return "x86_64";
        } else if (osArch.contains("aarch64") || osArch.contains("arm64")) {
            return "aarch64";
        } else if (osArch.contains("arm")) {
            return "armv7";
        } else {
            return osArch;
        }
    }

    /**
     * 检查pip是否可用
     *
     * @param pythonExecutable Python可执行文件路径
     * @return pip是否可用
     */
    public static boolean checkPipAvailable(String pythonExecutable) {
        if (pythonExecutable == null || pythonExecutable.trim().isEmpty()) {
            return false;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, "-m", "pip", "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine();
                int exitCode = process.waitFor();

                if (exitCode == 0 && line != null && line.toLowerCase().contains("pip")) {
                    log.info("pip可用: {}", line);
                    return true;
                }
            }
        } catch (Exception e) {
            log.debug("pip不可用: {}", e.getMessage());
        }

        return false;
    }

    /**
     * 获取pip版本号
     *
     * @param pythonExecutable Python可执行文件路径
     * @return pip版本号，例如 "24.3.1"，未安装或检测失败返回null
     */
    public static String getPipVersion(String pythonExecutable) {
        if (pythonExecutable == null || pythonExecutable.trim().isEmpty()) {
            return null;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, "-m", "pip", "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line = reader.readLine();
                int exitCode = process.waitFor();

                if (exitCode == 0 && line != null) {
                    // 解析版本号，格式如: "pip 24.3.1 from /path/to/pip (python 3.11)"
                    Pattern pattern = Pattern.compile("pip\\s+(\\d+\\.\\d+(?:\\.\\d+)?)");
                    Matcher matcher = pattern.matcher(line);
                    if (matcher.find()) {
                        String version = matcher.group(1);
                        log.info("检测到pip版本: {}", version);
                        return version;
                    }
                }
            }
        } catch (Exception e) {
            log.debug("获取pip版本失败: {}", e.getMessage());
        }

        return null;
    }

    /**
     * 验证包是否已安装
     *
     * @param pythonExecutable Python可执行文件路径
     * @param packageName      包名
     * @return 包版本号，未安装返回null
     */
    public static String verifyPackageInstalled(String pythonExecutable, String packageName) {
        // 优先使用 pip show 获取版本 (最可靠)
        String versionViaPip = getPackageVersionViaPip(pythonExecutable, packageName);
        if (versionViaPip != null) {
            return versionViaPip;
        }

        // 如果 pip show 失败，尝试 import 方式 (兼容性)
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExecutable,
                    "-c",
                    "import " + packageName + "; print(getattr(" + packageName + ", '__version__', 'unknown'))"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String version = reader.readLine();
                int exitCode = process.waitFor();

                if (exitCode == 0 && version != null && !version.trim().isEmpty() && !"unknown".equals(version.trim())) {
                    log.info("包 {} 已安装，版本: {}", packageName, version);
                    return version.trim();
                }
            }
        } catch (Exception e) {
            log.debug("包 {} 未安装或检测失败: {}", packageName, e.getMessage());
        }

        return null;
    }

    /**
     * 通过 pip show 命令获取包版本 (最可靠的方法)
     *
     * @param pythonExecutable Python可执行文件路径
     * @param packageName      包名
     * @return 包版本号，未安装返回null
     */
    public static String getPackageVersionViaPip(String pythonExecutable, String packageName) {
        if (pythonExecutable == null || pythonExecutable.trim().isEmpty() ||
            packageName == null || packageName.trim().isEmpty()) {
            return null;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExecutable,
                    "-m",
                    "pip",
                    "show",
                    packageName
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            log.debug("开始执行 pip show {} 命令", packageName);

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                int lineCount = 0;
                while ((line = reader.readLine()) != null) {
                    lineCount++;
                    // 移除ANSI颜色代码（Linux环境下可能包含）并trim
                    String cleanLine = removeAnsiCodes(line).trim();

                    // 调试：打印前5行输出
                    if (lineCount <= 5) {
                        log.debug("pip show 输出第{}行: 原始=[{}], 清理后=[{}]", lineCount, line, cleanLine);
                    }

                    // 查找 "Version: x.x.x" 行
                    if (cleanLine.startsWith("Version:")) {
                        String version = cleanLine.substring("Version:".length()).trim();
                        if (!version.isEmpty()) {
                            log.info("通过pip show检测到包 {} 版本: {}", packageName, version);
                            return version;
                        }
                    }
                }

                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    log.debug("pip show {} 失败，退出代码: {}, 共读取{}行输出", packageName, exitCode, lineCount);
                } else {
                    log.debug("pip show {} 执行成功但未找到Version行，共读取{}行输出", packageName, lineCount);
                }
            }
        } catch (Exception e) {
            log.debug("通过pip show获取包 {} 版本失败: {}", packageName, e.getMessage(), e);
        }

        return null;
    }

    /**
     * 移除字符串中的ANSI颜色代码
     *
     * @param text 原始文本
     * @return 清理后的文本
     */
    private static String removeAnsiCodes(String text) {
        if (text == null) {
            return null;
        }
        // ANSI转义序列的正则表达式：\u001B\[[0-9;]*m 或 \x1b\[[0-9;]*m
        // 也匹配 [0;39m 这种格式（不带ESC前缀的）
        return text.replaceAll("\u001B\\[[0-9;]*m", "")
                   .replaceAll("\\x1b\\[[0-9;]*m", "")
                   .replaceAll("\\[\\d+;\\d+m", "")
                   .replaceAll("\\[\\d+m", "");
    }
}
