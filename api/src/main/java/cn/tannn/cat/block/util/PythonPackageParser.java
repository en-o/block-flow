package cn.tannn.cat.block.util;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Python包名解析工具类
 * 提供Python包文件名解析、版本提取等功能
 *
 * @author tnnn
 */
@Slf4j
public class PythonPackageParser {

    /**
     * 从文件名中提取包名
     * 支持格式:
     * - requests-2.28.0-py3-none-any.whl
     * - numpy-1.24.0-cp39-cp39-win_amd64.whl
     * - Django-4.2.0.tar.gz
     *
     * @param fileName 文件名
     * @return 包名，无法解析返回null
     */
    public static String extractPackageName(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }

        // 处理.whl文件
        if (fileName.endsWith(".whl")) {
            // wheel文件格式: {distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl
            // 示例: requests-2.28.0-py3-none-any.whl
            int firstDash = fileName.indexOf('-');
            if (firstDash > 0) {
                String packageName = fileName.substring(0, firstDash);
                log.debug("从whl文件提取包名: {} -> {}", fileName, packageName);
                return packageName;
            }
        }

        // 处理.tar.gz文件
        if (fileName.endsWith(".tar.gz")) {
            // tar.gz格式: {distribution}-{version}.tar.gz
            // 示例: requests-2.28.0.tar.gz
            String nameWithoutExt = fileName.substring(0, fileName.length() - 7); // 去掉.tar.gz
            int lastDash = nameWithoutExt.lastIndexOf('-');
            if (lastDash > 0) {
                String packageName = nameWithoutExt.substring(0, lastDash);
                log.debug("从tar.gz文件提取包名: {} -> {}", fileName, packageName);
                return packageName;
            }
        }

        // 处理.zip文件
        if (fileName.endsWith(".zip")) {
            // zip格式: {distribution}-{version}.zip
            String nameWithoutExt = fileName.substring(0, fileName.length() - 4); // 去掉.zip
            int lastDash = nameWithoutExt.lastIndexOf('-');
            if (lastDash > 0) {
                String packageName = nameWithoutExt.substring(0, lastDash);
                log.debug("从zip文件提取包名: {} -> {}", fileName, packageName);
                return packageName;
            }
        }

        log.warn("无法从文件名提取包名: {}", fileName);
        return null;
    }

    /**
     * 从文件名中提取版本号
     * 支持格式:
     * - requests-2.28.0-py3-none-any.whl -> 2.28.0
     * - numpy-1.24.0-cp39-cp39-win_amd64.whl -> 1.24.0
     * - Django-4.2.0.tar.gz -> 4.2.0
     *
     * @param fileName 文件名
     * @return 版本号，无法解析返回null
     */
    public static String extractPackageVersion(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }

        // 处理.whl文件
        if (fileName.endsWith(".whl")) {
            // wheel文件格式: {distribution}-{version}(-{build tag})?-{python tag}-{abi tag}-{platform tag}.whl
            int firstDash = fileName.indexOf('-');
            if (firstDash > 0) {
                int secondDash = fileName.indexOf('-', firstDash + 1);
                if (secondDash > firstDash) {
                    String version = fileName.substring(firstDash + 1, secondDash);
                    log.debug("从whl文件提取版本: {} -> {}", fileName, version);
                    return version;
                }
            }
        }

        // 处理.tar.gz和.zip文件
        String nameWithoutExt = fileName;
        if (fileName.endsWith(".tar.gz")) {
            nameWithoutExt = fileName.substring(0, fileName.length() - 7);
        } else if (fileName.endsWith(".zip")) {
            nameWithoutExt = fileName.substring(0, fileName.length() - 4);
        }

        // 查找最后一个横线后的版本号
        int lastDash = nameWithoutExt.lastIndexOf('-');
        if (lastDash > 0 && lastDash < nameWithoutExt.length() - 1) {
            String version = nameWithoutExt.substring(lastDash + 1);
            // 验证是否为版本号格式 (如: 2.28.0, 1.0, 3.9.7)
            if (version.matches("\\d+(\\.\\d+)*")) {
                log.debug("从文件提取版本: {} -> {}", fileName, version);
                return version;
            }
        }

        log.warn("无法从文件名提取版本: {}", fileName);
        return null;
    }

    /**
     * 查找包的源代码目录
     * 解压后的包通常包含setup.py或PKG-INFO
     *
     * @param packageRoot 包解压后的根目录
     * @return 源代码目录，未找到返回null
     */
    public static File findPackageSourceDir(File packageRoot) {
        if (packageRoot == null || !packageRoot.exists()) {
            return null;
        }

        // 检查当前目录是否包含setup.py
        File setupPy = new File(packageRoot, "setup.py");
        if (setupPy.exists()) {
            log.debug("找到setup.py: {}", setupPy.getAbsolutePath());
            return packageRoot;
        }

        // 检查子目录
        File[] files = packageRoot.listFiles();
        if (files == null || files.length == 0) {
            return null;
        }

        // 如果只有一个子目录，进入该子目录查找
        if (files.length == 1 && files[0].isDirectory()) {
            File subSetupPy = new File(files[0], "setup.py");
            if (subSetupPy.exists()) {
                log.debug("在子目录找到setup.py: {}", subSetupPy.getAbsolutePath());
                return files[0];
            }
        }

        // 查找包含setup.py的子目录
        for (File file : files) {
            if (file.isDirectory()) {
                File subSetupPy = new File(file, "setup.py");
                if (subSetupPy.exists()) {
                    log.debug("在子目录找到setup.py: {}", subSetupPy.getAbsolutePath());
                    return file;
                }
            }
        }

        log.warn("未找到setup.py: {}", packageRoot.getAbsolutePath());
        return packageRoot; // 返回根目录作为fallback
    }

    /**
     * 检测包是否为pip包
     *
     * @param packageName 包名
     * @return 是否为pip包
     */
    public static boolean isPipPackage(String packageName) {
        if (packageName == null) {
            return false;
        }
        return packageName.equalsIgnoreCase("pip");
    }

    /**
     * 检测包是否为setuptools包
     *
     * @param packageName 包名
     * @return 是否为setuptools包
     */
    public static boolean isSetuptoolsPackage(String packageName) {
        if (packageName == null) {
            return false;
        }
        return packageName.equalsIgnoreCase("setuptools");
    }

    /**
     * 检测包是否为wheel包
     *
     * @param packageName 包名
     * @return 是否为wheel包
     */
    public static boolean isWheelPackage(String packageName) {
        if (packageName == null) {
            return false;
        }
        return packageName.equalsIgnoreCase("wheel");
    }

    /**
     * 规范化包名（转为小写，将下划线转为连字符）
     *
     * @param packageName 原始包名
     * @return 规范化的包名
     */
    public static String normalizePackageName(String packageName) {
        if (packageName == null || packageName.isEmpty()) {
            return packageName;
        }
        // Python包名不区分大小写，且 - 和 _ 被视为等价
        return packageName.toLowerCase().replace('_', '-');
    }

    /**
     * 从METADATA文件中提取包信息
     *
     * @param metadataFile METADATA文件
     * @return 包名，未找到返回null
     */
    public static String extractPackageNameFromMetadata(File metadataFile) {
        if (metadataFile == null || !metadataFile.exists()) {
            return null;
        }

        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.FileReader(metadataFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("Name:")) {
                    String packageName = line.substring(5).trim();
                    log.debug("从METADATA提取包名: {}", packageName);
                    return packageName;
                }
            }
        } catch (Exception e) {
            log.warn("读取METADATA文件失败: {}", metadataFile.getAbsolutePath(), e);
        }

        return null;
    }

    /**
     * 从METADATA文件中提取版本信息
     *
     * @param metadataFile METADATA文件
     * @return 版本号，未找到返回null
     */
    public static String extractVersionFromMetadata(File metadataFile) {
        if (metadataFile == null || !metadataFile.exists()) {
            return null;
        }

        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.FileReader(metadataFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("Version:")) {
                    String version = line.substring(8).trim();
                    log.debug("从METADATA提取版本: {}", version);
                    return version;
                }
            }
        } catch (Exception e) {
            log.warn("读取METADATA文件失败: {}", metadataFile.getAbsolutePath(), e);
        }

        return null;
    }

    /**
     * 判断是否为Python源代码包（.tar.gz）
     *
     * @param fileName 文件名
     * @return 是否为源代码包
     */
    public static boolean isSourcePackage(String fileName) {
        if (fileName == null) {
            return false;
        }
        return fileName.endsWith(".tar.gz") || fileName.endsWith(".zip");
    }

    /**
     * 判断是否为Wheel包（.whl）
     *
     * @param fileName 文件名
     * @return 是否为Wheel包
     */
    public static boolean isWheelFile(String fileName) {
        if (fileName == null) {
            return false;
        }
        return fileName.endsWith(".whl");
    }
}
