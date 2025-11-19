package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageOperationDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageUploadResultDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentCreateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentPage;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentUpdateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonRuntimeUploadResultDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.UploadedPackageFileDTO;
import cn.tannn.cat.block.entity.PythonEnvironment;
import cn.tannn.cat.block.repository.PythonEnvironmentRepository;
import cn.tannn.cat.block.service.PythonEnvironmentService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.stream.Stream;

/**
 * Python环境Service实现
 *
 * @author tnnn
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PythonEnvironmentServiceImpl implements PythonEnvironmentService {

    private final PythonEnvironmentRepository pythonEnvironmentRepository;

    @Value("${python.env.root-path:${user.dir}/python-envs}")
    private String pythonEnvRootPath;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment create(PythonEnvironmentCreateDTO createDTO) {
        // 检查名称是否已存在
        if (pythonEnvironmentRepository.existsByName(createDTO.getName())) {
            throw new ServiceException(500, "环境名称已存在");
        }

        PythonEnvironment environment = new PythonEnvironment();
        BeanUtils.copyProperties(createDTO, environment);

        // 初始化packages为空对象
        if (environment.getPackages() == null) {
            environment.setPackages(new JSONObject());
        }

        // 如果设置为默认环境，需要取消其他默认环境
        if (Boolean.TRUE.equals(createDTO.getIsDefault())) {
            clearDefaultEnvironments();
        }

        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment update(PythonEnvironmentUpdateDTO updateDTO) {
        PythonEnvironment environment = getById(updateDTO.getId());

        // 检查名称是否与其他环境冲突
        if (updateDTO.getName() != null && !updateDTO.getName().equals(environment.getName())) {
            if (pythonEnvironmentRepository.existsByName(updateDTO.getName())) {
                throw new ServiceException(500, "环境名称已存在");
            }
            environment.setName(updateDTO.getName());
        }

        if (updateDTO.getPythonVersion() != null) {
            environment.setPythonVersion(updateDTO.getPythonVersion());
        }
        if (updateDTO.getDescription() != null) {
            environment.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getIsDefault() != null) {
            if (Boolean.TRUE.equals(updateDTO.getIsDefault())) {
                clearDefaultEnvironments();
            }
            environment.setIsDefault(updateDTO.getIsDefault());
        }

        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        PythonEnvironment environment = getById(id);

        // 不允许删除默认环境
        if (Boolean.TRUE.equals(environment.getIsDefault())) {
            throw new ServiceException(500, "不能删除默认环境");
        }

        pythonEnvironmentRepository.deleteById(id);
    }

    @Override
    public PythonEnvironment getById(Integer id) {
        return pythonEnvironmentRepository.findById(id)
                .orElseThrow(() -> new ServiceException(500, "Python环境不存在"));
    }

    @Override
    public PythonEnvironment getByName(String name) {
        return pythonEnvironmentRepository.findByName(name)
                .orElseThrow(() -> new ServiceException(500, "Python环境不存在"));
    }

    @Override
    public List<PythonEnvironment> listAll() {
        return pythonEnvironmentRepository.findAll();
    }

    @Override
    public Page<PythonEnvironment> findPage(PythonEnvironmentPage where) {
        Specification<PythonEnvironment> select = EnhanceSpecification.beanWhere(where);
        return pythonEnvironmentRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public List<PythonEnvironment> search(String keyword) {
        List<PythonEnvironment> resultByName = pythonEnvironmentRepository.findByNameContaining(keyword);
        List<PythonEnvironment> resultByDesc = pythonEnvironmentRepository.findByDescriptionContaining(keyword);

        // 合并结果并去重
        List<PythonEnvironment> result = new ArrayList<>(resultByName);
        for (PythonEnvironment env : resultByDesc) {
            if (!result.contains(env)) {
                result.add(env);
            }
        }
        return result;
    }

    @Override
    public PythonEnvironment getDefaultEnvironment() {
        return pythonEnvironmentRepository.findFirstByIsDefaultTrue()
                .orElseThrow(() -> new ServiceException(500, "未设置默认Python环境"));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment setAsDefault(Integer id) {
        PythonEnvironment environment = getById(id);

        // 清除其他默认环境
        clearDefaultEnvironments();

        // 设置当前环境为默认
        environment.setIsDefault(true);
        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment installPackage(Integer id, PackageOperationDTO packageDTO) {
        PythonEnvironment environment = getById(id);

        // 检查环境是否已初始化并配置了Python
        if (environment.getPythonExecutable() == null || environment.getPythonExecutable().isEmpty()) {
            throw new ServiceException(500, "未配置Python解释器路径，无法安装包");
        }

        if (environment.getSitePackagesPath() == null || environment.getSitePackagesPath().isEmpty()) {
            throw new ServiceException(500, "未配置site-packages路径，无法安装包");
        }

        // 检查pip是否可用
        if (!checkPipAvailable(environment.getPythonExecutable())) {
            throw new ServiceException(500, "当前Python环境不包含pip模块，无法在线安装包。请使用\"配置/离线包\"功能上传.whl或.tar.gz包文件进行离线安装。");
        }

        String packageName = packageDTO.getPackageName();
        String version = packageDTO.getVersion();

        // 检查包是否已存在（仅验证，不阻止安装）
        String existingVersion = verifyPackageInstalled(environment.getPythonExecutable(), packageName);
        if (existingVersion != null) {
            log.info("包 {} 已存在，当前版本: {}，用户请求安装版本: {}",
                    packageName, existingVersion, version != null ? version : "最新版本");
        }

        // 构建pip install命令
        List<String> command = new ArrayList<>();
        command.add(environment.getPythonExecutable());
        command.add("-m");
        command.add("pip");
        command.add("install");
        command.add("--target");
        command.add(environment.getSitePackagesPath());

        // 添加包名和版本
        if (version != null && !version.isEmpty()) {
            command.add(packageName + "==" + version);
        } else {
            command.add(packageName);
        }

        try {
            log.info("执行pip install命令: {}", String.join(" ", command));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 读取输出
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.info("pip output: {}", line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("pip install失败，退出代码: {}, 输出: {}", exitCode, output);
                throw new ServiceException(500, "包安装失败: " + output.toString());
            }

            log.info("包安装成功: {} {}", packageName, version);

            // 安装成功后，验证包是否确实安装了
            String installedVersion = verifyPackageInstalled(environment.getPythonExecutable(), packageName);
            if (installedVersion == null) {
                log.warn("包安装后验证失败: {}", packageName);
                installedVersion = version != null ? version : "unknown";
            }

            // 更新环境的packages字段
            JSONObject packages = environment.getPackages();
            if (packages == null) {
                packages = new JSONObject();
            }

            // 保存安装信息（使用验证后的版本）
            JSONObject packageInfo = new JSONObject();
            packageInfo.put("name", packageName);
            packageInfo.put("version", installedVersion);
            packageInfo.put("installedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            packages.put(packageName, packageInfo);

            environment.setPackages(packages);
            return pythonEnvironmentRepository.save(environment);

        } catch (IOException | InterruptedException e) {
            log.error("安装包失败", e);
            throw new ServiceException(500, "安装包失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment uninstallPackage(Integer id, String packageName) {
        PythonEnvironment environment = getById(id);

        // 检查环境是否已配置Python
        if (environment.getPythonExecutable() == null || environment.getPythonExecutable().isEmpty()) {
            throw new ServiceException(500, "未配置Python解释器路径，无法卸载包");
        }

        // 检查包是否在记录中
        JSONObject packages = environment.getPackages();
        if (packages == null || !packages.containsKey(packageName)) {
            throw new ServiceException(500, "包不存在: " + packageName);
        }

        try {
            // 执行pip uninstall命令
            ProcessBuilder pb = new ProcessBuilder(
                    environment.getPythonExecutable(),
                    "-m",
                    "pip",
                    "uninstall",
                    "-y",  // 自动确认
                    packageName
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 读取输出
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.info("pip uninstall output: {}", line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.warn("pip uninstall警告，退出代码: {}, 输出: {}", exitCode, output);
                // 即使pip uninstall失败，也继续从数据库中移除记录
            }

            log.info("包卸载成功: {}", packageName);

        } catch (IOException | InterruptedException e) {
            log.error("卸载包失败", e);
            // 即使命令执行失败，也继续从数据库中移除记录
        }

        // 从数据库记录中移除
        packages.remove(packageName);
        environment.setPackages(packages);
        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    public String exportRequirements(Integer id) {
        PythonEnvironment environment = getById(id);
        JSONObject packages = environment.getPackages();

        if (packages == null || packages.isEmpty()) {
            return "";
        }

        StringBuilder requirements = new StringBuilder();
        packages.forEach((packageName, packageInfo) -> {
            if (packageInfo instanceof JSONObject) {
                JSONObject info = (JSONObject) packageInfo;
                String version = info.getString("version");
                if (version != null && !version.isEmpty()) {
                    requirements.append(packageName).append("==").append(version).append("\n");
                } else {
                    requirements.append(packageName).append("\n");
                }
            }
        });

        return requirements.toString();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment importRequirements(Integer id, String requirementsText) {
        PythonEnvironment environment = getById(id);

        JSONObject packages = environment.getPackages();
        if (packages == null) {
            packages = new JSONObject();
        }

        // 解析requirements.txt格式
        String[] lines = requirementsText.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }

            String packageName;
            String version = "";

            if (line.contains("==")) {
                String[] parts = line.split("==");
                packageName = parts[0].trim();
                version = parts.length > 1 ? parts[1].trim() : "";
            } else if (line.contains(">=")) {
                String[] parts = line.split(">=");
                packageName = parts[0].trim();
                version = parts.length > 1 ? ">=" + parts[1].trim() : "";
            } else if (line.contains("<=")) {
                String[] parts = line.split("<=");
                packageName = parts[0].trim();
                version = parts.length > 1 ? "<=" + parts[1].trim() : "";
            } else {
                packageName = line;
            }

            JSONObject packageInfo = new JSONObject();
            packageInfo.put("name", packageName);
            packageInfo.put("version", version);
            packages.put(packageName, packageInfo);
        }

        environment.setPackages(packages);
        return pythonEnvironmentRepository.save(environment);
    }

    /**
     * 清除所有默认环境标记
     */
    private void clearDefaultEnvironments() {
        List<PythonEnvironment> defaultEnvs = pythonEnvironmentRepository.findByIsDefault(true);
        for (PythonEnvironment env : defaultEnvs) {
            env.setIsDefault(false);
            pythonEnvironmentRepository.save(env);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment initializeEnvironment(Integer id) {
        PythonEnvironment environment = getById(id);

        // 设置环境根目录
        String envRootPath = pythonEnvRootPath + File.separator + id;
        environment.setEnvRootPath(envRootPath);

        // 设置site-packages路径
        String sitePackagesPath = envRootPath + File.separator + "lib" + File.separator + "site-packages";
        environment.setSitePackagesPath(sitePackagesPath);

        // 创建目录结构
        try {
            // 创建环境根目录
            Files.createDirectories(Paths.get(envRootPath));

            // 创建lib/site-packages目录
            Files.createDirectories(Paths.get(sitePackagesPath));

            // 创建packages目录（用于存放上传的包文件）
            String packagesDir = envRootPath + File.separator + "packages";
            Files.createDirectories(Paths.get(packagesDir));

            log.info("环境目录初始化成功: {}", envRootPath);
        } catch (IOException e) {
            log.error("创建环境目录失败", e);
            throw new ServiceException(500, "创建环境目录失败: " + e.getMessage());
        }

        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PackageUploadResultDTO uploadPackageFile(Integer id, MultipartFile file) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null) {
            throw new ServiceException(500, "环境未初始化，请先初始化环境");
        }

        if (environment.getSitePackagesPath() == null || environment.getSitePackagesPath().isEmpty()) {
            throw new ServiceException(500, "未配置site-packages路径，无法离线安装包");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new ServiceException(400, "文件名不能为空");
        }

        // 验证文件类型
        if (!originalFilename.endsWith(".whl") && !originalFilename.endsWith(".tar.gz")) {
            throw new ServiceException(400, "仅支持.whl和.tar.gz格式的包文件");
        }

        // 验证文件大小（最大500MB）
        long maxSize = 500 * 1024 * 1024L;
        if (file.getSize() > maxSize) {
            throw new ServiceException(400, "文件大小不能超过500MB");
        }

        // 先保存到packages目录
        String packagesDir = environment.getEnvRootPath() + File.separator + "packages";
        Path targetPath = Paths.get(packagesDir, originalFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("包文件上传成功: {}", targetPath);

            // 立即执行离线安装
            installPackageFileOffline(environment, targetPath.toString(), originalFilename);
            log.info("包离线安装成功: {}", originalFilename);

            // 提取包名和版本
            String packageName = extractPackageName(originalFilename);
            String version = extractPackageVersion(originalFilename);

            // 更新环境的packages字段
            JSONObject packages = environment.getPackages();
            if (packages == null) {
                packages = new JSONObject();
            }

            JSONObject packageInfo = new JSONObject();
            packageInfo.put("name", packageName);
            packageInfo.put("version", version);
            packageInfo.put("installedFrom", originalFilename);
            packageInfo.put("installMethod", "offline");
            packageInfo.put("installedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            packages.put(packageName, packageInfo);

            environment.setPackages(packages);
            pythonEnvironmentRepository.save(environment);

            PackageUploadResultDTO result = new PackageUploadResultDTO();
            result.setFileName(originalFilename);
            result.setFileSize(file.getSize());
            result.setUploadTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            result.setSavePath(targetPath.toString());
            return result;

        } catch (IOException | InterruptedException e) {
            log.error("离线安装包失败", e);
            throw new ServiceException(500, "离线安装包失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment installPackageFile(Integer id, String fileName) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null || environment.getSitePackagesPath() == null) {
            throw new ServiceException(500, "环境未初始化，请先初始化环境");
        }

        String packageFilePath = environment.getEnvRootPath() + File.separator + "packages" + File.separator + fileName;
        File packageFile = new File(packageFilePath);

        if (!packageFile.exists()) {
            throw new ServiceException(404, "包文件不存在: " + fileName);
        }

        try {
            // 直接使用离线安装方式
            installPackageFileOffline(environment, packageFilePath, fileName);
            log.info("包离线安装成功: {}", fileName);

            // 提取包名和版本
            String packageName = extractPackageName(fileName);
            String version = extractPackageVersion(fileName);

            // 更新环境的packages字段
            JSONObject packages = environment.getPackages();
            if (packages == null) {
                packages = new JSONObject();
            }

            JSONObject packageInfo = new JSONObject();
            packageInfo.put("name", packageName);
            packageInfo.put("version", version);
            packageInfo.put("installedFrom", fileName);
            packageInfo.put("installMethod", "offline");
            packageInfo.put("installedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            packages.put(packageName, packageInfo);

            environment.setPackages(packages);
            return pythonEnvironmentRepository.save(environment);

        } catch (Exception e) {
            log.error("离线安装包失败", e);
            throw new ServiceException(500, "离线安装包失败: " + e.getMessage());
        }
    }

    /**
     * 离线安装包文件（不使用pip）
     */
    private void installPackageFileOffline(PythonEnvironment environment, String packageFilePath, String fileName) throws IOException, InterruptedException {
        String sitePackagesPath = environment.getSitePackagesPath();

        if (fileName.endsWith(".whl")) {
            // .whl文件本质是zip格式，直接解压到site-packages
            log.info("使用离线方式安装.whl包: {}", fileName);
            extractZip(packageFilePath, sitePackagesPath);
        } else if (fileName.endsWith(".tar.gz")) {
            // .tar.gz文件需要解压
            log.info("使用离线方式安装.tar.gz包: {}", fileName);
            installTarGzOffline(packageFilePath, sitePackagesPath);
        } else {
            throw new ServiceException(400, "不支持的包格式: " + fileName);
        }
    }

    /**
     * 离线安装tar.gz包（使用纯Java实现，跨平台兼容）
     */
    private void installTarGzOffline(String tarGzPath, String sitePackagesPath) throws IOException {
        // 创建临时解压目录
        Path tempDir = Files.createTempDirectory("package-extract");
        try {
            log.info("开始解压tar.gz文件: {}", tarGzPath);

            // 使用Apache Commons Compress解压tar.gz
            try (FileInputStream fis = new FileInputStream(tarGzPath);
                 BufferedInputStream bis = new BufferedInputStream(fis);
                 GzipCompressorInputStream gzis = new GzipCompressorInputStream(bis);
                 TarArchiveInputStream tis = new TarArchiveInputStream(gzis)) {

                TarArchiveEntry entry;
                while ((entry = tis.getNextTarEntry()) != null) {
                    if (!tis.canReadEntryData(entry)) {
                        log.warn("无法读取tar entry: {}", entry.getName());
                        continue;
                    }

                    File targetFile = new File(tempDir.toFile(), entry.getName());

                    // 安全检查：防止路径遍历攻击
                    if (!targetFile.toPath().normalize().startsWith(tempDir)) {
                        log.warn("检测到可疑路径，跳过: {}", entry.getName());
                        continue;
                    }

                    if (entry.isDirectory()) {
                        if (!targetFile.exists() && !targetFile.mkdirs()) {
                            throw new IOException("无法创建目录: " + targetFile);
                        }
                    } else {
                        File parent = targetFile.getParentFile();
                        if (!parent.exists() && !parent.mkdirs()) {
                            throw new IOException("无法创建父目录: " + parent);
                        }

                        try (FileOutputStream fos = new FileOutputStream(targetFile);
                             BufferedOutputStream bos = new BufferedOutputStream(fos)) {
                            byte[] buffer = new byte[8192];
                            int len;
                            while ((len = tis.read(buffer)) != -1) {
                                bos.write(buffer, 0, len);
                            }
                        }
                    }
                }
            }

            log.info("tar.gz解压完成: {}", tempDir);

            // 查找包的根目录（通常是第一层子目录）
            File[] tempFiles = tempDir.toFile().listFiles();
            if (tempFiles == null || tempFiles.length == 0) {
                throw new IOException("解压后未找到包文件");
            }

            File packageRoot = tempFiles[0];
            if (!packageRoot.isDirectory()) {
                throw new IOException("解压后的包格式异常");
            }

            // 查找包的Python代码目录（通常与包名相同，或在根目录下）
            File sourceDir = findPackageSourceDir(packageRoot);
            if (sourceDir == null) {
                throw new IOException("未找到包的源代码目录");
            }

            // 复制到site-packages
            copyDirectory(sourceDir, new File(sitePackagesPath, sourceDir.getName()));
            log.info("包文件已复制到site-packages: {}", sourceDir.getName());

        } finally {
            // 清理临时目录
            try {
                deleteDirectory(tempDir.toFile());
                log.info("临时目录已清理: {}", tempDir);
            } catch (IOException e) {
                log.warn("清理临时目录失败: {}", e.getMessage());
            }
        }
    }

    /**
     * 查找包的源代码目录
     */
    private File findPackageSourceDir(File packageRoot) {
        File[] files = packageRoot.listFiles();
        if (files == null) {
            return null;
        }

        // 1. 优先查找src目录下的Python包
        File srcDir = new File(packageRoot, "src");
        if (srcDir.exists() && srcDir.isDirectory()) {
            File[] srcFiles = srcDir.listFiles();
            if (srcFiles != null) {
                for (File file : srcFiles) {
                    if (file.isDirectory()) {
                        File initFile = new File(file, "__init__.py");
                        if (initFile.exists()) {
                            log.info("在src目录下找到包: {}", file.getName());
                            return file;
                        }
                    }
                }
            }
        }

        // 2. 查找根目录下的Python包（包含__init__.py的目录）
        for (File file : files) {
            if (file.isDirectory() && !file.getName().equals("src")) {
                File initFile = new File(file, "__init__.py");
                if (initFile.exists()) {
                    log.info("在根目录下找到包: {}", file.getName());
                    return file;
                }
            }
        }

        // 3. 如果没有找到，检查是否有单个py文件的简单包
        log.warn("未找到标准Python包结构，返回根目录");
        return packageRoot;
    }

    /**
     * 递归复制目录
     */
    private void copyDirectory(File source, File destination) throws IOException {
        if (!destination.exists()) {
            destination.mkdirs();
        }

        File[] files = source.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            File destFile = new File(destination, file.getName());
            if (file.isDirectory()) {
                copyDirectory(file, destFile);
            } else {
                Files.copy(file.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }

    @Override
    public List<UploadedPackageFileDTO> listUploadedPackageFiles(Integer id) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null) {
            return new ArrayList<>();
        }

        String packagesDir = environment.getEnvRootPath() + File.separator + "packages";
        File packagesDirFile = new File(packagesDir);

        if (!packagesDirFile.exists() || !packagesDirFile.isDirectory()) {
            return new ArrayList<>();
        }

        File[] files = packagesDirFile.listFiles();
        if (files == null || files.length == 0) {
            return new ArrayList<>();
        }

        JSONObject installedPackages = environment.getPackages();

        return Arrays.stream(files)
                .filter(File::isFile)
                .map(file -> {
                    UploadedPackageFileDTO dto = new UploadedPackageFileDTO();
                    dto.setFileName(file.getName());
                    dto.setFileSize(file.length());
                    dto.setFileType(getFileExtension(file.getName()));
                    dto.setUploadTime(file.lastModified());

                    // 检查是否已安装
                    boolean installed = false;
                    if (installedPackages != null) {
                        String packageName = extractPackageName(file.getName());
                        installed = installedPackages.containsKey(packageName);
                    }
                    dto.setInstalled(installed);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePackageFile(Integer id, String fileName) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null) {
            throw new ServiceException(500, "环境未初始化");
        }

        String packageFilePath = environment.getEnvRootPath() + File.separator + "packages" + File.separator + fileName;
        File packageFile = new File(packageFilePath);

        if (!packageFile.exists()) {
            throw new ServiceException(404, "包文件不存在: " + fileName);
        }

        try {
            Files.delete(packageFile.toPath());
            log.info("包文件删除成功: {}", fileName);
        } catch (IOException e) {
            log.error("删除包文件失败", e);
            throw new ServiceException(500, "删除包文件失败: " + e.getMessage());
        }
    }

    /**
     * 检查pip是否可用
     */
    private boolean checkPipAvailable(String pythonExecutable) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExecutable,
                    "-m",
                    "pip",
                    "--version"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("pip可用: {}", output.toString().trim());
                return true;
            }

            log.warn("pip不可用，退出代码: {}, 输出: {}", exitCode, output);
            return false;

        } catch (Exception e) {
            log.warn("检查pip可用性时出错", e);
            return false;
        }
    }

    /**
     * 验证包是否已安装并获取版本
     * 使用 python -m pip show <package> 命令
     */
    private String verifyPackageInstalled(String pythonExecutable, String packageName) {
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

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                // 解析输出获取版本号
                String[] lines = output.toString().split("\n");
                for (String line : lines) {
                    if (line.startsWith("Version:")) {
                        String version = line.substring(8).trim();
                        log.info("验证包 {} 已安装，版本: {}", packageName, version);
                        return version;
                    }
                }
            }

            log.warn("包 {} 验证失败，pip show 退出代码: {}", packageName, exitCode);
            return null;

        } catch (Exception e) {
            log.warn("验证包 {} 是否安装时出错", packageName, e);
            return null;
        }
    }

    /**
     * 从文件名提取包名
     */
    private String extractPackageName(String fileName) {
        String nameWithoutExt = fileName;
        if (fileName.endsWith(".whl")) {
            nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("-"));
        } else if (fileName.endsWith(".tar.gz")) {
            nameWithoutExt = fileName.replace(".tar.gz", "");
            if (nameWithoutExt.contains("-")) {
                nameWithoutExt = nameWithoutExt.substring(0, nameWithoutExt.lastIndexOf("-"));
            }
        }
        return nameWithoutExt.toLowerCase().replace("_", "-");
    }

    /**
     * 从文件名提取版本号
     */
    private String extractPackageVersion(String fileName) {
        String version = "";
        if (fileName.endsWith(".whl")) {
            String[] parts = fileName.split("-");
            if (parts.length > 1) {
                version = parts[1];
            }
        } else if (fileName.endsWith(".tar.gz")) {
            String nameWithoutExt = fileName.replace(".tar.gz", "");
            if (nameWithoutExt.contains("-")) {
                version = nameWithoutExt.substring(nameWithoutExt.lastIndexOf("-") + 1);
            }
        }
        return version;
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String fileName) {
        if (fileName.endsWith(".tar.gz")) {
            return "tar.gz";
        }
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1) : "";
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonRuntimeUploadResultDTO uploadPythonRuntime(Integer id, MultipartFile file) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null) {
            throw new ServiceException(500, "环境未初始化，请先初始化环境");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new ServiceException(400, "文件名不能为空");
        }

        // 验证文件类型 - 支持 zip 和 tar.gz
        boolean isZip = originalFilename.endsWith(".zip");
        boolean isTarGz = originalFilename.endsWith(".tar.gz") || originalFilename.endsWith(".tgz");

        if (!isZip && !isTarGz) {
            throw new ServiceException(400, "仅支持.zip和.tar.gz格式的压缩包");
        }

        // 验证文件大小（最大2GB）
        long maxSize = 2L * 1024 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new ServiceException(400, "文件大小不能超过2GB");
        }

        // 创建runtime目录
        String runtimeDir = environment.getEnvRootPath() + File.separator + "runtime";
        try {
            Files.createDirectories(Paths.get(runtimeDir));
        } catch (IOException e) {
            log.error("创建runtime目录失败", e);
            throw new ServiceException(500, "创建runtime目录失败: " + e.getMessage());
        }

        // 保存上传的压缩包
        Path uploadPath = Paths.get(runtimeDir, originalFilename);
        try {
            Files.copy(file.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Python运行时上传成功: {}", uploadPath);
        } catch (IOException e) {
            log.error("保存运行时文件失败", e);
            throw new ServiceException(500, "保存运行时文件失败: " + e.getMessage());
        }

        // 解压到runtime目录
        String extractPath = runtimeDir + File.separator + "python";
        try {
            // 如果已存在解压目录，先删除
            Path extractPathObj = Paths.get(extractPath);
            if (Files.exists(extractPathObj)) {
                deleteDirectory(extractPathObj.toFile());
            }
            Files.createDirectories(extractPathObj);

            if (isZip) {
                extractZip(uploadPath.toString(), extractPath);
            } else {
                extractTarGz(uploadPath.toString(), extractPath);
            }

            log.info("Python运行时解压成功: {}", extractPath);
        } catch (Exception e) {
            log.error("解压运行时文件失败", e);
            throw new ServiceException(500, "解压运行时文件失败: " + e.getMessage());
        }

        // 自动检测Python可执行文件
        String pythonExecutable = detectPythonExecutableInDirectory(extractPath);
        if (pythonExecutable == null) {
            throw new ServiceException(500, "未能在解压目录中检测到Python可执行文件");
        }

        // 检测Python版本
        String pythonVersion = detectPythonVersion(pythonExecutable);

        // 检测site-packages路径
        String sitePackagesPath = detectSitePackagesPath(extractPath);

        // 处理Python embed版本的._pth文件（修复pip无法使用的问题）
        configurePythonPath(pythonExecutable, sitePackagesPath);

        // 在配置._pth文件后重新检测pip（可能已经可用了）
        boolean hasPip = checkPipAvailable(pythonExecutable);

        // 更新环境配置
        environment.setPythonExecutable(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            environment.setPythonVersion(pythonVersion);
        }
        if (sitePackagesPath != null && !sitePackagesPath.isEmpty()) {
            environment.setSitePackagesPath(sitePackagesPath);
        }
        pythonEnvironmentRepository.save(environment);

        // 返回结果
        PythonRuntimeUploadResultDTO result = new PythonRuntimeUploadResultDTO();
        result.setFileName(originalFilename);
        result.setFileSize(file.getSize());
        result.setUploadTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        result.setExtractPath(extractPath);
        result.setPythonExecutable(pythonExecutable);
        result.setPythonVersion(pythonVersion);
        result.setSitePackagesPath(sitePackagesPath);
        result.setHasPip(hasPip);

        // 如果没有pip，提供友好提示
        if (!hasPip) {
            result.setMessage("上传的Python环境不包含pip模块，无法使用在线安装功能。" +
                    "您可以通过\"配置/离线包\"功能上传pip的.whl包（如pip-24.0-py3-none-any.whl）来启用pip功能，" +
                    "或继续使用离线包安装其他依赖。");
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment detectPythonExecutable(Integer id) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null) {
            throw new ServiceException(500, "环境未初始化，请先初始化环境");
        }

        // 检测Python可执行文件
        String pythonExecutable = detectPythonExecutableInDirectory(environment.getEnvRootPath());
        if (pythonExecutable == null) {
            throw new ServiceException(500, "未能检测到Python可执行文件");
        }

        // 检测Python版本
        String pythonVersion = detectPythonVersion(pythonExecutable);

        // 检测site-packages路径
        String sitePackagesPath = detectSitePackagesPath(environment.getEnvRootPath());

        // 更新环境配置
        environment.setPythonExecutable(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            environment.setPythonVersion(pythonVersion);
        }
        if (sitePackagesPath != null && !sitePackagesPath.isEmpty()) {
            environment.setSitePackagesPath(sitePackagesPath);
        }

        return pythonEnvironmentRepository.save(environment);
    }

    /**
     * 在指定目录中检测Python可执行文件
     */
    private String detectPythonExecutableInDirectory(String directory) {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) {
            return null;
        }

        // 常见的Python可执行文件名
        String[] pythonNames = {"python3", "python", "python.exe", "python3.exe"};

        // 常见的Python可执行文件路径（相对于根目录）
        String[] commonPaths = {
                "",                                    // 根目录
                "bin",                                 // Unix/Linux标准路径
                "Scripts",                             // Windows虚拟环境
                "python" + File.separator + "bin",     // 可能的嵌套结构
                "python" + File.separator + "Scripts"
        };

        for (String path : commonPaths) {
            String searchDir = path.isEmpty() ? directory : directory + File.separator + path;
            for (String pythonName : pythonNames) {
                String pythonPath = searchDir + File.separator + pythonName;
                File pythonFile = new File(pythonPath);
                if (pythonFile.exists() && pythonFile.canExecute()) {
                    log.info("检测到Python可执行文件: {}", pythonPath);
                    return pythonPath;
                }
            }
        }

        // 递归搜索（限制深度为3层）
        try {
            String found = findPythonExecutableRecursively(dir, 0, 3);
            if (found != null) {
                log.info("通过递归搜索检测到Python可执行文件: {}", found);
                return found;
            }
        } catch (Exception e) {
            log.warn("递归搜索Python可执行文件时出错", e);
        }

        return null;
    }

    /**
     * 递归搜索Python可执行文件
     */
    private String findPythonExecutableRecursively(File dir, int depth, int maxDepth) {
        if (depth > maxDepth) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        // 先检查当前目录
        for (File file : files) {
            if (file.isFile() && file.canExecute()) {
                String name = file.getName().toLowerCase();
                if (name.equals("python") || name.equals("python3") ||
                        name.equals("python.exe") || name.equals("python3.exe")) {
                    return file.getAbsolutePath();
                }
            }
        }

        // 然后递归检查子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String found = findPythonExecutableRecursively(file, depth + 1, maxDepth);
                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * 检测Python版本
     */
    private String detectPythonVersion(String pythonExecutable) {
        try {
            ProcessBuilder pb = new ProcessBuilder(pythonExecutable, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }

            process.waitFor();

            // 解析版本号（例如：Python 3.11.0）
            String versionOutput = output.toString().trim();
            if (versionOutput.startsWith("Python ")) {
                String version = versionOutput.substring(7).trim();
                log.info("检测到Python版本: {}", version);
                return version;
            }

        } catch (Exception e) {
            log.warn("检测Python版本失败", e);
        }

        return "";
    }

    /**
     * 检测site-packages路径
     */
    private String detectSitePackagesPath(String directory) {
        File dir = new File(directory);
        if (!dir.exists() || !dir.isDirectory()) {
            return null;
        }

        // 常见的site-packages路径
        String[] commonPaths = {
                "lib" + File.separator + "site-packages",
                "Lib" + File.separator + "site-packages",
                "lib" + File.separator + "python3" + File.separator + "site-packages",
                "python" + File.separator + "lib" + File.separator + "site-packages",
                "python" + File.separator + "Lib" + File.separator + "site-packages"
        };

        for (String path : commonPaths) {
            String fullPath = directory + File.separator + path;
            File sitePackagesDir = new File(fullPath);
            if (sitePackagesDir.exists() && sitePackagesDir.isDirectory()) {
                log.info("检测到site-packages路径: {}", fullPath);
                return fullPath;
            }
        }

        // 递归搜索site-packages目录（限制深度）
        try {
            String found = findSitePackagesRecursively(dir, 0, 5);
            if (found != null) {
                log.info("通过递归搜索检测到site-packages路径: {}", found);
                return found;
            }
        } catch (Exception e) {
            log.warn("递归搜索site-packages时出错", e);
        }

        return null;
    }

    /**
     * 递归搜索site-packages目录
     */
    private String findSitePackagesRecursively(File dir, int depth, int maxDepth) {
        if (depth > maxDepth) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        // 检查当前目录
        for (File file : files) {
            if (file.isDirectory() && file.getName().equals("site-packages")) {
                return file.getAbsolutePath();
            }
        }

        // 递归检查子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String found = findSitePackagesRecursively(file, depth + 1, maxDepth);
                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * 解压ZIP文件
     */
    private void extractZip(String zipFilePath, String destDirectory) throws IOException {
        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        try (ZipInputStream zipIn = new ZipInputStream(Files.newInputStream(Paths.get(zipFilePath)))) {
            ZipEntry entry = zipIn.getNextEntry();
            while (entry != null) {
                String filePath = destDirectory + File.separator + entry.getName();
                if (!entry.isDirectory()) {
                    // 确保父目录存在
                    File parent = new File(filePath).getParentFile();
                    if (!parent.exists()) {
                        parent.mkdirs();
                    }
                    // 提取文件
                    Files.copy(zipIn, Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);

                    // 在Unix/Linux系统上设置可执行权限
                    File extractedFile = new File(filePath);
                    if (entry.getName().contains("/bin/") || entry.getName().contains("/Scripts/")) {
                        extractedFile.setExecutable(true);
                    }
                } else {
                    File dir = new File(filePath);
                    dir.mkdirs();
                }
                zipIn.closeEntry();
                entry = zipIn.getNextEntry();
            }
        }
    }

    /**
     * 解压tar.gz文件（使用纯Java实现，跨平台兼容）
     */
    private void extractTarGz(String tarGzFilePath, String destDirectory) throws IOException {
        File destDir = new File(destDirectory);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }

        log.info("开始解压tar.gz文件: {} 到 {}", tarGzFilePath, destDirectory);

        // 使用Apache Commons Compress解压tar.gz
        try (FileInputStream fis = new FileInputStream(tarGzFilePath);
             BufferedInputStream bis = new BufferedInputStream(fis);
             GzipCompressorInputStream gzis = new GzipCompressorInputStream(bis);
             TarArchiveInputStream tis = new TarArchiveInputStream(gzis)) {

            TarArchiveEntry entry;
            while ((entry = tis.getNextTarEntry()) != null) {
                if (!tis.canReadEntryData(entry)) {
                    log.warn("无法读取tar entry: {}", entry.getName());
                    continue;
                }

                File targetFile = new File(destDir, entry.getName());

                // 安全检查：防止路径遍历攻击
                if (!targetFile.toPath().normalize().startsWith(destDir.toPath())) {
                    log.warn("检测到可疑路径，跳过: {}", entry.getName());
                    continue;
                }

                if (entry.isDirectory()) {
                    if (!targetFile.exists() && !targetFile.mkdirs()) {
                        throw new IOException("无法创建目录: " + targetFile);
                    }
                } else {
                    File parent = targetFile.getParentFile();
                    if (!parent.exists() && !parent.mkdirs()) {
                        throw new IOException("无法创建父目录: " + parent);
                    }

                    try (FileOutputStream fos = new FileOutputStream(targetFile);
                         BufferedOutputStream bos = new BufferedOutputStream(fos)) {
                        byte[] buffer = new byte[8192];
                        int len;
                        while ((len = tis.read(buffer)) != -1) {
                            bos.write(buffer, 0, len);
                        }
                    }

                    // 保留Unix权限
                    if (entry.getMode() != 0) {
                        targetFile.setExecutable((entry.getMode() & 0100) != 0);
                        targetFile.setReadable((entry.getMode() & 0400) != 0);
                        targetFile.setWritable((entry.getMode() & 0200) != 0);
                    }
                }
            }
        }

        log.info("tar.gz解压完成: {}", destDirectory);

        // 设置bin目录下的文件为可执行
        setBinExecutable(destDir);
    }

    /**
     * 设置bin目录下的文件为可执行
     */
    private void setBinExecutable(File directory) {
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
     * 递归删除目录
     */
    private void deleteDirectory(File directory) throws IOException {
        if (directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    deleteDirectory(file);
                }
            }
        }
        if (!directory.delete()) {
            throw new IOException("无法删除: " + directory.getAbsolutePath());
        }
    }

    /**
     * 配置Python路径（处理embed版本的._pth文件）
     * Python embed版本有._pth文件限制模块搜索路径，需要添加site-packages路径
     */
    private void configurePythonPath(String pythonExecutable, String sitePackagesPath) {
        if (pythonExecutable == null || sitePackagesPath == null) {
            return;
        }

        try {
            File pythonExeFile = new File(pythonExecutable);
            File pythonDir = pythonExeFile.getParentFile();
            if (pythonDir == null || !pythonDir.exists()) {
                return;
            }

            // 查找._pth文件（如python312._pth）
            File[] pthFiles = pythonDir.listFiles((dir, name) -> name.endsWith("._pth"));
            if (pthFiles == null || pthFiles.length == 0) {
                log.info("未找到._pth文件，Python可能不是embed版本");
                return;
            }

            File pthFile = pthFiles[0];
            log.info("找到._pth文件: {}", pthFile.getAbsolutePath());

            // 读取现有内容
            List<String> lines = Files.readAllLines(pthFile.toPath());
            boolean hasSitePackages = false;
            boolean hasImportSite = false;

            // 检查是否已经包含site-packages和import site
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.contains("site-packages")) {
                    hasSitePackages = true;
                }
                if (trimmed.equals("import site") || trimmed.startsWith("import site")) {
                    hasImportSite = true;
                }
            }

            // 如果已经配置好了，就不需要修改
            if (hasSitePackages && hasImportSite) {
                log.info("._pth文件已正确配置");
                return;
            }

            // 构建新的内容
            List<String> newLines = new ArrayList<>();
            boolean addedSitePackages = false;
            boolean addedImportSite = false;

            for (String line : lines) {
                String trimmed = line.trim();

                // 移除注释的import site行
                if (trimmed.startsWith("#") && trimmed.contains("import site")) {
                    // 取消注释
                    newLines.add("import site");
                    addedImportSite = true;
                    continue;
                }

                newLines.add(line);

                // 在python3xx.zip之后添加site-packages路径
                if (!addedSitePackages && (trimmed.endsWith(".zip") || trimmed.equals("."))) {
                    // 使用绝对路径（相对路径在Windows下容易出错）
                    newLines.add(sitePackagesPath);
                    addedSitePackages = true;
                }
            }

            // 如果还没有添加import site，在末尾添加
            if (!addedImportSite) {
                newLines.add("import site");
            }

            // 写回文件
            Files.write(pthFile.toPath(), newLines);
            log.info("._pth文件已更新，添加了site-packages路径和import site");

        } catch (Exception e) {
            log.warn("配置Python路径时出错，但不影响继续: {}", e.getMessage());
        }
    }
}
