package cn.tannn.cat.block.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream;

import java.io.*;
import java.nio.file.Files;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * 文件操作工具类
 * 提供文件压缩/解压、目录操作、权限设置等通用功能
 *
 * @author tnnn
 */
@Slf4j
public class FileOperationUtil {

    /**
     * 解压ZIP文件
     *
     * @param zipFilePath     ZIP文件路径
     * @param destDirectory   目标目录
     * @throws IOException IO异常
     */
    public static void extractZip(String zipFilePath, String destDirectory) throws IOException {
        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        try (ZipInputStream zipIn = new ZipInputStream(new FileInputStream(zipFilePath))) {
            ZipEntry entry = zipIn.getNextEntry();

            while (entry != null) {
                String filePath = destDirectory + File.separator + entry.getName();
                if (!entry.isDirectory()) {
                    extractFile(zipIn, filePath);
                } else {
                    File dir = new File(filePath);
                    dir.mkdirs();
                }
                zipIn.closeEntry();
                entry = zipIn.getNextEntry();
            }
        }

        log.info("ZIP解压完成: {} -> {}", zipFilePath, destDirectory);
    }

    /**
     * 解压tar.gz文件
     *
     * @param tarGzFilePath   tar.gz文件路径
     * @param destDirectory   目标目录
     * @throws IOException IO异常
     */
    public static void extractTarGz(String tarGzFilePath, String destDirectory) throws IOException {
        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        try (FileInputStream fis = new FileInputStream(tarGzFilePath);
             GzipCompressorInputStream gzIn = new GzipCompressorInputStream(fis);
             TarArchiveInputStream tarIn = new TarArchiveInputStream(gzIn)) {

            TarArchiveEntry entry;
            while ((entry = tarIn.getNextTarEntry()) != null) {
                String filePath = destDirectory + File.separator + entry.getName();
                File outputFile = new File(filePath);

                if (entry.isDirectory()) {
                    outputFile.mkdirs();
                } else {
                    File parent = outputFile.getParentFile();
                    if (parent != null && !parent.exists()) {
                        parent.mkdirs();
                    }

                    try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                        byte[] buffer = new byte[8192];
                        int len;
                        while ((len = tarIn.read(buffer)) != -1) {
                            fos.write(buffer, 0, len);
                        }
                    }

                    // 保留原始权限
                    if ((entry.getMode() & 0100) != 0) {
                        outputFile.setExecutable(true);
                    }
                }
            }
        }

        log.info("tar.gz解压完成: {} -> {}", tarGzFilePath, destDirectory);
    }

    /**
     * 从ZIP输入流中提取单个文件
     */
    private static void extractFile(ZipInputStream zipIn, String filePath) throws IOException {
        File file = new File(filePath);
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(filePath))) {
            byte[] bytesIn = new byte[4096];
            int read;
            while ((read = zipIn.read(bytesIn)) != -1) {
                bos.write(bytesIn, 0, read);
            }
        }
    }

    /**
     * 递归删除目录
     *
     * @param directory 要删除的目录
     * @throws IOException IO异常
     */
    public static void deleteDirectory(File directory) throws IOException {
        if (directory.exists()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        deleteDirectory(file);
                    } else {
                        if (!file.delete()) {
                            log.warn("无法删除文件: {}", file.getAbsolutePath());
                        }
                    }
                }
            }
            if (!directory.delete()) {
                throw new IOException("无法删除目录: " + directory.getAbsolutePath());
            }
        }
    }

    /**
     * 递归复制目录
     *
     * @param source      源目录
     * @param destination 目标目录
     * @throws IOException IO异常
     */
    public static void copyDirectory(File source, File destination) throws IOException {
        if (source.isDirectory()) {
            if (!destination.exists()) {
                destination.mkdirs();
            }

            String[] children = source.list();
            if (children != null) {
                for (String child : children) {
                    copyDirectory(
                            new File(source, child),
                            new File(destination, child)
                    );
                }
            }
        } else {
            Files.copy(source.toPath(), destination.toPath());
        }
    }

    /**
     * 设置bin目录下的文件为可执行
     *
     * @param directory 根目录
     */
    public static void setBinExecutable(File directory) {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                if (file.getName().equals("bin") || file.getName().equals("Scripts")) {
                    // 设置bin或Scripts目录下所有文件为可执行
                    File[] binFiles = file.listFiles();
                    if (binFiles != null) {
                        for (File binFile : binFiles) {
                            if (binFile.isFile()) {
                                binFile.setExecutable(true);
                                log.debug("设置可执行权限: {}", binFile.getAbsolutePath());
                            }
                        }
                    }
                } else {
                    // 递归处理子目录
                    setBinExecutable(file);
                }
            }
        }
    }

    /**
     * 确保Python可执行文件有执行权限
     *
     * @param directory 根目录
     */
    public static void ensurePythonExecutablePermissions(File directory) {
        ensurePythonExecutablePermissionsRecursively(directory, 0, 3);
    }

    /**
     * 递归设置Python可执行文件权限
     */
    private static void ensurePythonExecutablePermissionsRecursively(File directory, int depth, int maxDepth) {
        if (depth > maxDepth || !directory.isDirectory()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isFile()) {
                String name = file.getName().toLowerCase();
                // 对Python相关可执行文件设置执行权限
                if (name.equals("python") || name.equals("python3") ||
                        name.equals("python.exe") || name.equals("python3.exe") ||
                        name.startsWith("python3.") ||
                        name.equals("pip") || name.equals("pip3") ||
                        name.equals("pip.exe") || name.equals("pip3.exe")) {
                    boolean result = file.setExecutable(true);
                    if (result) {
                        log.info("设置执行权限成功: {}", file.getAbsolutePath());
                    } else {
                        log.warn("设置执行权限失败: {}", file.getAbsolutePath());
                    }
                }
            } else if (file.isDirectory() && !file.getName().startsWith(".")) {
                ensurePythonExecutablePermissionsRecursively(file, depth + 1, maxDepth);
            }
        }
    }

    /**
     * 设置bin和lib目录的权限
     *
     * @param directory 根目录
     */
    public static void setBinAndLibPermissions(File directory) {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                String dirName = file.getName();
                if (dirName.equals("bin") || dirName.equals("Scripts")) {
                    // 设置bin/Scripts目录下所有文件为可执行
                    File[] binFiles = file.listFiles();
                    if (binFiles != null) {
                        for (File binFile : binFiles) {
                            if (binFile.isFile()) {
                                binFile.setExecutable(true);
                            }
                        }
                    }
                } else if (dirName.equals("lib") || dirName.equals("lib64")) {
                    // 设置lib目录下的.so文件为可执行
                    setLibraryPermissionsRecursively(file, 0, 2);
                } else {
                    // 递归处理其他子目录
                    setBinAndLibPermissions(file);
                }
            }
        }
    }

    /**
     * 递归设置库文件权限
     */
    private static void setLibraryPermissionsRecursively(File directory, int depth, int maxDepth) {
        if (depth > maxDepth || !directory.isDirectory()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isFile()) {
                String name = file.getName().toLowerCase();
                if (name.endsWith(".so") || name.endsWith(".dylib") || name.endsWith(".dll")) {
                    file.setExecutable(true);
                    log.debug("设置库文件可执行: {}", file.getAbsolutePath());
                }
            } else if (file.isDirectory()) {
                setLibraryPermissionsRecursively(file, depth + 1, maxDepth);
            }
        }
    }

    /**
     * 记录目录结构（用于调试）
     *
     * @param directory 目录
     * @param depth     当前深度
     * @param maxDepth  最大深度
     */
    public static void logDirectoryStructure(File directory, int depth, int maxDepth) {
        if (depth > maxDepth || !directory.exists()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        String indent = "  ".repeat(depth);
        for (File file : files) {
            if (file.isDirectory()) {
                log.info("{}[DIR] {}", indent, file.getName());
                logDirectoryStructure(file, depth + 1, maxDepth);
            } else {
                String permissions = String.format("[%s%s%s]",
                        file.canRead() ? "r" : "-",
                        file.canWrite() ? "w" : "-",
                        file.canExecute() ? "x" : "-");
                log.info("{}[FILE] {} {} ({}bytes)", indent, file.getName(), permissions, file.length());
            }
        }
    }

    /**
     * 获取文件扩展名
     *
     * @param fileName 文件名
     * @return 扩展名（小写，不含点）
     */
    public static String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }

        // 处理 .tar.gz 特殊情况
        if (fileName.toLowerCase().endsWith(".tar.gz")) {
            return "tar.gz";
        }

        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0 && lastDot < fileName.length() - 1) {
            return fileName.substring(lastDot + 1).toLowerCase();
        }

        return "";
    }
}
