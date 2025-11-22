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
import cn.tannn.cat.block.service.ProgressLogService;
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
    private final ProgressLogService progressLogService;

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

        // 不允许删除默认环境（但如果环境刚创建还没有保存isDefault，允许删除）
        if (Boolean.TRUE.equals(environment.getIsDefault())) {
            // 检查是否是刚创建的环境（没有Python配置的视为刚创建）
            boolean isNewlyCreated = (environment.getPythonExecutable() == null ||
                                      environment.getPythonExecutable().isEmpty());
            if (!isNewlyCreated) {
                throw new ServiceException(500, "不能删除默认环境");
            }
            log.warn("删除刚创建的默认环境（回滚操作）: {}", id);
        }

        // 保存环境路径用于异步删除
        final String envRootPath = environment.getEnvRootPath();

        // 删除数据库记录（在事务内完成）
        pythonEnvironmentRepository.deleteById(id);

        // 异步删除文件系统目录（避免阻塞事务，特别是在Docker映射目录的情况下）
        if (envRootPath != null && !envRootPath.isEmpty()) {
            // 使用新线程异步删除，避免事务超时
            new Thread(() -> {
                try {
                    // 等待事务提交完成
                    Thread.sleep(500);

                    File envDir = new File(envRootPath);
                    if (envDir.exists()) {
                        log.info("开始异步删除环境目录: {}", envRootPath);
                        deleteDirectory(envDir);
                        log.info("✓ 已删除环境目录: {}", envRootPath);
                    }
                } catch (IOException e) {
                    log.error("❌ 删除环境目录失败: {}", envRootPath, e);
                    log.error("   提示: 如果使用了Docker卷映射，请手动删除该目录");
                } catch (InterruptedException e) {
                    log.warn("删除目录线程被中断: {}", envRootPath);
                    Thread.currentThread().interrupt();
                }
            }, "delete-env-" + id).start();
        }
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

            // 检查是否已安装相同包（覆盖旧记录）
            if (packages.containsKey(packageName)) {
                Object existingPkg = packages.get(packageName);
                existingVersion = "未知";
                if (existingPkg instanceof JSONObject) {
                    existingVersion = ((JSONObject) existingPkg).getString("version");
                }
                log.info("包 {} 已存在（版本: {}），将被覆盖为版本: {}", packageName, existingVersion, installedVersion);
            }

            // 保存安装信息（使用验证后的版本）
            JSONObject packageInfo = new JSONObject();
            packageInfo.put("name", packageName);
            packageInfo.put("version", installedVersion);
            packageInfo.put("installMethod", "pip");
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

            // 如果安装的是pip包，立即配置._pth文件
            if ("pip".equalsIgnoreCase(packageName)) {
                log.info("检测到pip包安装，开始配置Python路径...");
                if (environment.getPythonExecutable() != null && environment.getSitePackagesPath() != null) {
                    configurePythonPath(environment.getPythonExecutable(), environment.getSitePackagesPath());
                    log.info("pip安装后，._pth文件已配置");
                } else {
                    log.warn("Python路径或site-packages路径未配置，无法自动配置._pth文件");
                }
            }

            // 更新环境的packages字段
            JSONObject packages = environment.getPackages();
            if (packages == null) {
                packages = new JSONObject();
            }

            // 检查是否已安装相同包
            if (packages.containsKey(packageName)) {
                Object existingPkg = packages.get(packageName);
                String existingVersion = "未知";
                if (existingPkg instanceof JSONObject) {
                    existingVersion = ((JSONObject) existingPkg).getString("version");
                }
                log.info("包 {} 已存在（版本: {}），将被覆盖为版本: {}", packageName, existingVersion, version);
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

            // 如果安装的是pip包，立即配置._pth文件
            if ("pip".equalsIgnoreCase(packageName)) {
                log.info("检测到pip包安装，开始配置Python路径...");
                if (environment.getPythonExecutable() != null && environment.getSitePackagesPath() != null) {
                    configurePythonPath(environment.getPythonExecutable(), environment.getSitePackagesPath());
                    log.info("pip安装后，._pth文件已配置");
                } else {
                    log.warn("Python路径或site-packages路径未配置，无法自动配置._pth文件");
                }
            }

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

        } catch (IOException e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("Exec format error") ||
                                     errorMsg.contains("error=8"))) {
                log.error("❌ 架构不匹配：无法执行Python检查pip - {}", errorMsg);
            } else {
                log.warn("检查pip可用性时IO错误: {}", errorMsg);
            }
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

        } catch (IOException e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("Exec format error") ||
                                     errorMsg.contains("error=8"))) {
                log.error("❌ 架构不匹配：无法执行Python验证包 - {}", errorMsg);
            } else {
                log.warn("验证包 {} 时IO错误: {}", packageName, errorMsg);
            }
            return null;
        } catch (Exception e) {
            log.warn("验证包 {} 是否安装时出错", packageName, e);
            return null;
        }
    }

    /**
     * 从文件名提取包名
     * whl文件名格式: {distribution}-{version}(-{build})?-{python}-{abi}-{platform}.whl
     * tar.gz文件名格式: {distribution}-{version}.tar.gz
     */
    private String extractPackageName(String fileName) {
        String packageName = fileName;

        if (fileName.endsWith(".whl")) {
            // whl文件: 取第一个-之前的部分作为包名
            // 例如: openpyxl-3.1.5-py2.py3-none-any.whl -> openpyxl
            int firstDash = fileName.indexOf("-");
            if (firstDash > 0) {
                packageName = fileName.substring(0, firstDash);
            }
        } else if (fileName.endsWith(".tar.gz")) {
            // tar.gz文件: 移除.tar.gz后取最后一个-之前的部分
            // 例如: requests-2.32.5.tar.gz -> requests
            packageName = fileName.replace(".tar.gz", "");
            int lastDash = packageName.lastIndexOf("-");
            if (lastDash > 0) {
                packageName = packageName.substring(0, lastDash);
            }
        }

        // 标准化包名：小写，下划线转连字符
        return packageName.toLowerCase().replace("_", "-");
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
        // 生成任务ID
        String taskId = "upload-python-" + id;

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

        progressLogService.sendLog(taskId, "开始上传Python运行时...");
        progressLogService.sendProgress(taskId, 5, "验证文件格式和大小");

        // 创建runtime目录
        String runtimeDir = environment.getEnvRootPath() + File.separator + "runtime";
        try {
            Files.createDirectories(Paths.get(runtimeDir));
            progressLogService.sendLog(taskId, "创建runtime目录成功");
        } catch (IOException e) {
            log.error("创建runtime目录失败", e);
            progressLogService.sendError(taskId, "创建runtime目录失败: " + e.getMessage());
            throw new ServiceException(500, "创建runtime目录失败: " + e.getMessage());
        }

        // 保存上传的压缩包
        Path uploadPath = Paths.get(runtimeDir, originalFilename);
        try {
            Files.copy(file.getInputStream(), uploadPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Python运行时上传成功: {}", uploadPath);
            progressLogService.sendProgress(taskId, 15, "文件上传成功 (" + (file.getSize() / 1024 / 1024) + " MB)");
        } catch (IOException e) {
            log.error("保存运行时文件失败", e);
            progressLogService.sendError(taskId, "保存运行时文件失败: " + e.getMessage());
            throw new ServiceException(500, "保存运行时文件失败: " + e.getMessage());
        }

        // 解压到runtime目录
        String extractPath = runtimeDir + File.separator + "python";
        String finalExtractPath = extractPath;
        try {
            progressLogService.sendProgress(taskId, 20, "开始解压压缩包...");

            // 如果已存在解压目录，先删除
            Path extractPathObj = Paths.get(extractPath);
            if (Files.exists(extractPathObj)) {
                deleteDirectory(extractPathObj.toFile());
            }
            Files.createDirectories(extractPathObj);

            if (isZip) {
                progressLogService.sendLog(taskId, "正在解压 ZIP 文件...");
                extractZip(uploadPath.toString(), extractPath);
            } else {
                progressLogService.sendLog(taskId, "正在解压 TAR.GZ 文件...");
                extractTarGz(uploadPath.toString(), extractPath);
            }

            log.info("Python运行时解压成功: {}", extractPath);
            progressLogService.sendProgress(taskId, 40, "解压完成");

            // 检查是否需要进入子目录（tar.gz 解压可能多一层目录）
            File extractDir = new File(extractPath);
            File[] subItems = extractDir.listFiles();

            // 如果解压后只有一个子目录，进入该目录
            if (subItems != null && subItems.length == 1 && subItems[0].isDirectory()) {
                File singleSubDir = subItems[0];
                log.info("检测到解压后只有一个子目录: {}", singleSubDir.getName());
                progressLogService.sendLog(taskId, "检测到解压后的子目录: " + singleSubDir.getName());

                // 无论目录名是什么，都进入单一子目录
                extractPath = singleSubDir.getAbsolutePath();
                extractDir = singleSubDir;
                log.info("进入单一子目录作为Python根目录: {}", extractPath);

                // 输出目录结构用于调试
                log.info("Python根目录内容:");
                logDirectoryStructure(extractDir, 0, 2);
            } else if (subItems != null) {
                log.info("解压后包含 {} 个项目", subItems.length);
                progressLogService.sendLog(taskId, "解压后包含 " + subItems.length + " 个文件/目录");
            }

            // 先尝试检测Python可执行文件（预编译包）
            progressLogService.sendProgress(taskId, 50, "检测Python可执行文件...");
            String detectedPython = detectPythonExecutableInDirectory(extractPath);

            // 如果找不到Python可执行文件，再检测是否为源代码包
            File configureFile = new File(extractDir, "configure");
            boolean isSourcePackage = (detectedPython == null) && configureFile.exists();

            if (isSourcePackage) {
                log.info("检测到Python源代码包（包含configure文件），开始自动编译...");
                progressLogService.sendProgress(taskId, 45, "检测到源代码包，开始编译（可能需要10-30分钟）");
                try {
                    finalExtractPath = compilePythonSource(extractPath, taskId);
                    log.info("Python源代码编译完成: {}", finalExtractPath);
                    progressLogService.sendProgress(taskId, 70, "编译完成");
                } catch (Exception e) {
                    log.error("编译Python源代码失败", e);
                    progressLogService.sendError(taskId, "编译Python源代码失败: " + e.getMessage());
                    throw new ServiceException(500, "编译Python源代码失败: " + e.getMessage());
                }
            } else {
                log.info("检测到预编译Python包，开始设置执行权限...");
                log.info("  Python根目录: {}", extractPath);
                progressLogService.sendProgress(taskId, 55, "设置执行权限");

                finalExtractPath = extractPath;

                // 确保Python可执行文件和共享库有执行权限
                ensurePythonExecutablePermissions(extractDir);
                // 特别处理bin/lib目录的权限（python-build-standalone需要）
                setBinAndLibPermissions(extractDir);

                log.info("预编译Python包权限设置完成");
                progressLogService.sendLog(taskId, "✓ 权限设置完成");
            }

            // 输出解压后的文件结构（用于调试）
            log.info("最终Python目录结构:");
            logDirectoryStructure(new File(finalExtractPath), 0, 3);
        } catch (Exception e) {
            log.error("解压运行时文件失败", e);
            progressLogService.sendError(taskId, "解压失败: " + e.getMessage());
            throw new ServiceException(500, "解压运行时文件失败: " + e.getMessage());
        }

        // 自动检测Python可执行文件
        progressLogService.sendProgress(taskId, 75, "正在检测Python可执行文件...");
        String pythonExecutable = detectPythonExecutableInDirectory(finalExtractPath);
        if (pythonExecutable == null) {
            log.error("========================================");
            log.error("未能检测到Python可执行文件！");
            log.error("========================================");
            log.error("解压目录: {}", finalExtractPath);
            log.error("目录结构:");
            logDirectoryStructure(new File(finalExtractPath), 0, 3);

            // 检查是否存在架构不匹配问题
            String archMismatchHint = detectArchitectureMismatch(finalExtractPath);

            // 获取当前系统架构
            String osArch = System.getProperty("os.arch").toLowerCase();
            String osName = System.getProperty("os.name").toLowerCase();
            String recommendedArch = getRecommendedArchitecture(osArch);
            String downloadUrl = "https://github.com/astral-sh/python-build-standalone/releases";

            StringBuilder errorMsg = new StringBuilder();
            errorMsg.append("❌ 未能检测到可用的Python可执行文件\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("📋 系统信息\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("操作系统: ").append(osName).append("\n");
            errorMsg.append("系统架构: ").append(osArch).append("\n");
            errorMsg.append("需要下载: ").append(recommendedArch).append(" 架构的Python\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("🔍 问题诊断\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append(archMismatchHint).append("\n\n");

            // 检查是否是Windows Docker环境
            if (osName.contains("linux") && new File("/proc/version").exists()) {
                try {
                    String procVersion = Files.readString(new File("/proc/version").toPath()).toLowerCase();
                    if (procVersion.contains("microsoft") || procVersion.contains("wsl")) {
                        errorMsg.append("⚠️  检测到WSL/Windows Docker环境\n");
                        errorMsg.append("   - 符号链接可能在Windows环境下损坏\n");
                        errorMsg.append("   - 建议：使用完整的install_only版本，避免使用包含符号链接的包\n\n");
                    }
                } catch (Exception e) {
                    // 忽略读取错误
                }
            }

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("✅ 解决方案：使用 python-build-standalone\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("1. 访问下载页面:\n");
            errorMsg.append("   ").append(downloadUrl).append("\n\n");

            errorMsg.append("2. 选择正确的文件（文件名格式说明）:\n");
            errorMsg.append("   cpython-{版本}+{日期}-{架构}-{平台}-install_only.tar.gz\n\n");

            errorMsg.append("3. 根据您的系统选择对应文件:\n\n");

            if (osName.contains("linux")) {
                errorMsg.append("   【Linux 系统】\n");
                if (osArch.contains("aarch") || osArch.contains("arm")) {
                    errorMsg.append("   ✓ ARM64架构，选择包含 'aarch64' 的文件:\n");
                    errorMsg.append("     📦 cpython-3.10.19+20251120-aarch64-unknown-linux-gnu-install_only.tar.gz\n");
                    errorMsg.append("     📦 cpython-3.11.10+20241016-aarch64-unknown-linux-gnu-install_only.tar.gz\n");
                    errorMsg.append("     📦 cpython-3.12.7+20241016-aarch64-unknown-linux-gnu-install_only.tar.gz\n");
                } else {
                    errorMsg.append("   ✓ x86_64架构，选择包含 'x86_64' 的文件:\n");
                    errorMsg.append("     📦 cpython-3.10.19+20251010-x86_64-unknown-linux-gnu-install_only.tar.gz\n");
                    errorMsg.append("     📦 cpython-3.11.10+20241016-x86_64-unknown-linux-gnu-install_only.tar.gz\n");
                    errorMsg.append("     📦 cpython-3.12.7+20241016-x86_64-unknown-linux-gnu-install_only.tar.gz\n");
                }
            } else if (osName.contains("win")) {
                errorMsg.append("   【Windows 系统】\n");
                errorMsg.append("   ✓ 选择包含 'windows' 的文件:\n");
                errorMsg.append("     📦 cpython-3.11.10+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz\n");
                errorMsg.append("     📦 cpython-3.12.7+...-x86_64-pc-windows-msvc-shared-install_only.tar.gz\n");
            } else if (osName.contains("mac") || osName.contains("darwin")) {
                errorMsg.append("   【macOS 系统】\n");
                errorMsg.append("   ✓ 选择包含 'darwin' 的文件:\n");
                errorMsg.append("     📦 cpython-3.11.10+...-x86_64-apple-darwin-install_only.tar.gz\n");
                errorMsg.append("     📦 cpython-3.11.10+...-aarch64-apple-darwin-install_only.tar.gz (Apple Silicon)\n");
            }

            errorMsg.append("\n");
            errorMsg.append("4. 关键要点:\n");
            errorMsg.append("   • 文件名必须包含 'install_only'\n");
            errorMsg.append("   • 架构必须匹配（x86_64 或 aarch64）\n");
            errorMsg.append("   • 平台必须匹配（linux-gnu, windows-msvc, apple-darwin）\n");
            errorMsg.append("   • 版本号可以选择 3.10, 3.11, 3.12 等\n\n");

            errorMsg.append("5. 下载后重新上传该文件\n");

            progressLogService.sendError(taskId, errorMsg.toString());
            throw new ServiceException(500, errorMsg.toString());
        }

        progressLogService.sendLog(taskId, "检测到Python: " + pythonExecutable);

        // 检测Python版本
        progressLogService.sendProgress(taskId, 85, "检测Python版本...");
        String pythonVersion = detectPythonVersion(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            progressLogService.sendLog(taskId, "Python版本: " + pythonVersion);
        }

        // 检测site-packages路径（使用最终的Python目录）
        progressLogService.sendProgress(taskId, 90, "检测site-packages路径...");
        String sitePackagesPath = detectSitePackagesPath(finalExtractPath);

        // 处理Python embed版本的._pth文件（修复pip无法使用的问题）
        configurePythonPath(pythonExecutable, sitePackagesPath);

        // 在配置._pth文件后重新检测pip（可能已经可用了）
        progressLogService.sendProgress(taskId, 95, "检测pip可用性...");
        boolean hasPip = checkPipAvailable(pythonExecutable);
        if (hasPip) {
            progressLogService.sendLog(taskId, "✓ pip可用");
        } else {
            progressLogService.sendLog(taskId, "⚠ pip不可用，需要手动安装");
        }

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
        result.setExtractPath(finalExtractPath);  // 使用最终路径
        result.setPythonExecutable(pythonExecutable);
        result.setPythonVersion(pythonVersion);
        result.setSitePackagesPath(sitePackagesPath);
        result.setHasPip(hasPip);

        // 提供友好提示信息
        StringBuilder message = new StringBuilder();
        message.append("Python运行时上传成功！");

        // 推荐使用python-build-standalone
        progressLogService.sendComplete(taskId, true, "Python运行时配置成功！");
        message.append("\n\n【推荐】使用预编译Python运行时（python-build-standalone）:");
        message.append("\n  下载地址: https://github.com/astral-sh/python-build-standalone/releases");
        message.append("\n  选择对应平台的cpython版本（如: cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz）");
        message.append("\n  优点: 完整、可移植、无需系统依赖");

        if (!hasPip) {
            message.append("\n\n【提示】当前Python环境不包含pip模块，无法使用在线安装功能。");
            message.append("\n  解决方案:");
            message.append("\n  1. 推荐重新上传包含pip的Python运行时（python-build-standalone默认包含pip）");
            message.append("\n  2. 或通过\"配置/离线包\"上传pip.whl包（如pip-24.0-py3-none-any.whl）来启用pip");
            message.append("\n  3. 或继续使用离线包安装其他Python依赖");
        }

        result.setMessage(message.toString());

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
            log.warn("目录不存在或不是目录: {}", directory);
            return null;
        }

        log.info("开始在目录中查找Python可执行文件: {}", directory);

        // 常见的Python可执行文件名（优先级从高到低）
        // 注意：python-build-standalone 通常包含 python3.10, python3.11 等带版本号的
        String[] pythonNames = {
                "python3.13", "python3.12", "python3.11", "python3.10", "python3.9",  // 带版本号的优先
                "python3",                                                              // 通用python3
                "python",                                                               // 通用python
                "python.exe", "python3.exe"                                            // Windows
        };

        // 常见的Python可执行文件路径（相对于根目录）
        String[] commonPaths = {
                "bin",                                 // Unix/Linux标准路径（python-build-standalone使用这个）
                "",                                    // 根目录
                "Scripts",                             // Windows虚拟环境
                "install" + File.separator + "bin",   // 某些安装包的install目录
                "python" + File.separator + "bin",     // 嵌套结构
                "python" + File.separator + "Scripts"
        };

        // 先在常见路径查找
        for (String path : commonPaths) {
            String searchDir = path.isEmpty() ? directory : directory + File.separator + path;
            File searchDirFile = new File(searchDir);

            if (!searchDirFile.exists() || !searchDirFile.isDirectory()) {
                log.debug("搜索目录不存在: {}", searchDir);
                continue;
            }

            log.info("正在搜索目录: {}", searchDir);

            // 列出目录内容用于调试
            File[] files = searchDirFile.listFiles();
            if (files != null && files.length > 0) {
                log.info("  目录包含 {} 个文件:", files.length);
                for (File f : files) {
                    if (f.isFile()) {
                        log.info("    - {} ({}字节, 可执行:{})", f.getName(), f.length(), f.canExecute());
                    }
                }
            } else {
                log.warn("  目录为空或无法访问");
            }

            for (String pythonName : pythonNames) {
                String pythonPath = searchDir + File.separator + pythonName;
                File pythonFile = new File(pythonPath);

                if (pythonFile.exists()) {
                    log.info("找到Python文件: {}", pythonPath);

                    // 检查文件大小（避免空文件或损坏的符号链接）
                    if (pythonFile.length() == 0) {
                        log.warn("Python文件大小为0（可能是损坏的符号链接）: {}", pythonPath);
                        log.warn("  这通常发生在Windows Docker环境下，符号链接无法正确处理");
                        continue;
                    }

                    // 如果文件存在但没有执行权限，尝试设置执行权限
                    if (!pythonFile.canExecute()) {
                        log.warn("Python文件没有执行权限，尝试设置: {}", pythonPath);
                        boolean setResult = pythonFile.setExecutable(true, false);  // false = 所有用户
                        if (setResult) {
                            log.info("✓ 成功设置执行权限: {}", pythonPath);
                        } else {
                            log.error("✗ 设置执行权限失败: {}", pythonPath);
                        }
                    }

                    // 再次检查是否可执行（Windows下.exe文件总是可执行）
                    if (pythonFile.canExecute() || pythonName.endsWith(".exe")) {
                        log.info("✓ 检测到可用的Python可执行文件: {}", pythonPath);

                        // 尝试执行 python --version 验证是否可以运行
                        if (verifyPythonExecutable(pythonPath)) {
                            log.info("✓ Python可执行文件验证成功: {}", pythonPath);
                            return pythonPath;
                        } else {
                            log.warn("⚠ Python可执行文件验证失败（可能是架构不匹配）: {}", pythonPath);
                            // 继续尝试其他文件
                        }
                    } else {
                        log.warn("文件存在但无法设置为可执行: {}", pythonPath);
                    }
                }
            }
        }

        // 递归搜索（限制深度为3层）
        log.info("在常见路径未找到，开始递归搜索（深度3层）...");
        try {
            String found = findPythonExecutableRecursively(dir, 0, 3);
            if (found != null) {
                log.info("通过递归搜索检测到Python可执行文件: {}", found);

                // 验证可执行文件
                if (verifyPythonExecutable(found)) {
                    return found;
                } else {
                    log.warn("递归找到的Python文件验证失败: {}", found);
                }
            }
        } catch (Exception e) {
            log.warn("递归搜索Python可执行文件时出错", e);
        }

        log.error("❌ 未能找到可用的Python可执行文件");
        return null;
    }

    /**
     * 验证Python可执行文件是否可以正常运行
     */
    private boolean verifyPythonExecutable(String pythonPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(pythonPath, "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean completed = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

            if (!completed) {
                process.destroyForcibly();
                log.warn("Python验证超时: {}", pythonPath);
                return false;
            }

            int exitCode = process.exitValue();
            if (exitCode == 0) {
                return true;
            } else {
                log.warn("Python执行失败，退出码: {}", exitCode);
                return false;
            }
        } catch (IOException e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("Exec format error") || errorMsg.contains("error=8"))) {
                log.error("❌ 架构不匹配：Python可执行文件无法在当前系统运行 - {}", errorMsg);
            } else {
                log.warn("验证Python可执行文件时IO错误: {}", errorMsg);
            }
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } catch (Exception e) {
            log.warn("验证Python可执行文件失败", e);
            return false;
        }
    }

    /**
     * 检测Python可执行文件架构是否与系统匹配
     */
    private String detectArchitectureMismatch(String directory) {
        try {
            // 获取系统架构
            String osArch = System.getProperty("os.arch").toLowerCase();
            log.info("系统架构: {}", osArch);

            // 查找bin目录
            File dir = new File(directory);
            File binDir = findBinDirectory(dir, 0, 3);

            if (binDir != null) {
                // 查找python可执行文件
                File[] pythonFiles = binDir.listFiles((d, name) -> {
                    String n = name.toLowerCase();
                    return n.equals("python3.10") || n.equals("python3.11") ||
                           n.equals("python3.12") || n.equals("python3.13");
                });

                if (pythonFiles != null && pythonFiles.length > 0) {
                    File pythonExe = pythonFiles[0];

                    // 检查文件大小（空文件说明是损坏的符号链接）
                    if (pythonExe.length() == 0) {
                        return "⚠️  上传的Python文件损坏\n" +
                               "   - 发现Python可执行文件但大小为0\n" +
                               "   - 可能原因：符号链接在Windows/跨平台传输时损坏\n" +
                               "   - 建议：重新下载完整的tar.gz包";
                    }

                    // 尝试使用file命令检测架构
                    ProcessBuilder pb = new ProcessBuilder("file", pythonExe.getAbsolutePath());
                    Process process = pb.start();
                    StringBuilder output = new StringBuilder();

                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(process.getInputStream()))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            output.append(line);
                        }
                    }

                    process.waitFor();
                    String fileInfo = output.toString().toLowerCase();
                    log.info("Python可执行文件信息: {}", fileInfo);

                    // 检测架构不匹配
                    if (fileInfo.contains("aarch64") || fileInfo.contains("arm64")) {
                        if (osArch.contains("x86") || osArch.contains("amd64")) {
                            return "❌ 架构不匹配错误\n" +
                                   "   - 上传的Python: ARM aarch64 架构\n" +
                                   "   - 当前系统: x86_64 (Intel/AMD) 架构\n" +
                                   "   - 无法执行：ARM程序无法在x86_64系统上运行";
                        }
                    } else if (fileInfo.contains("x86-64") || fileInfo.contains("x86_64")) {
                        if (osArch.contains("aarch") || osArch.contains("arm")) {
                            return "❌ 架构不匹配错误\n" +
                                   "   - 上传的Python: x86_64 (Intel/AMD) 架构\n" +
                                   "   - 当前系统: ARM aarch64 架构\n" +
                                   "   - 无法执行：x86_64程序无法在ARM系统上运行";
                        }
                    }

                    if (fileInfo.contains("cannot execute")) {
                        return "❌ 可执行文件格式错误\n" +
                               "   - 文件无法执行\n" +
                               "   - 可能原因：文件损坏或架构不匹配";
                    }

                    // 找到了文件但架构匹配，可能是权限问题
                    return "⚠️  权限或其他问题\n" +
                           "   - 找到Python可执行文件\n" +
                           "   - 架构匹配但无法执行\n" +
                           "   - 可能原因：文件权限不足";
                }

                return "⚠️  未找到Python可执行文件\n" +
                       "   - 在bin目录中未找到python3.x文件\n" +
                       "   - 可能原因：不完整的Python包或目录结构异常";
            }

            return "⚠️  目录结构异常\n" +
                   "   - 未找到bin目录\n" +
                   "   - 可能原因：不完整的Python包或解压失败";
        } catch (Exception e) {
            log.warn("检测架构时出错: {}", e.getMessage());
            return "⚠️  无法检测架构信息\n" +
                   "   - 检测过程出错: " + e.getMessage();
        }
    }

    /**
     * 根据系统架构推荐下载版本
     */
    private String getRecommendedArchitecture(String osArch) {
        if (osArch.contains("aarch") || osArch.contains("arm")) {
            return "aarch64";
        } else if (osArch.contains("x86") || osArch.contains("amd64")) {
            return "x86_64";
        } else {
            return "unknown (请根据系统选择)";
        }
    }

    /**
     * 查找bin目录
     */
    private File findBinDirectory(File dir, int depth, int maxDepth) {
        if (depth > maxDepth || !dir.isDirectory()) {
            return null;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return null;
        }

        for (File file : files) {
            if (file.isDirectory() && file.getName().equals("bin")) {
                return file;
            }
        }

        for (File file : files) {
            if (file.isDirectory()) {
                File found = findBinDirectory(file, depth + 1, maxDepth);
                if (found != null) {
                    return found;
                }
            }
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
            if (file.isFile()) {
                String name = file.getName().toLowerCase();
                if (name.equals("python") || name.equals("python3") ||
                        name.equals("python.exe") || name.equals("python3.exe")) {

                    // 尝试设置执行权限
                    if (!file.canExecute()) {
                        file.setExecutable(true);
                    }

                    // Windows下.exe文件或可执行的文件
                    if (file.canExecute() || name.endsWith(".exe")) {
                        log.info("✓ 递归搜索找到Python可执行文件: {}", file.getAbsolutePath());
                        return file.getAbsolutePath();
                    }
                }
            }
        }

        // 然后递归检查子目录（优先检查bin和Scripts目录）
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String dirName = file.getName().toLowerCase();
                // 优先搜索bin和Scripts目录
                if (dirName.equals("bin") || dirName.equals("scripts")) {
                    String found = findPythonExecutableRecursively(file, depth + 1, maxDepth);
                    if (found != null) {
                        return found;
                    }
                }
            }
        }

        // 然后检查其他子目录
        for (File file : files) {
            if (file.isDirectory() && !file.getName().startsWith(".")) {
                String dirName = file.getName().toLowerCase();
                if (!dirName.equals("bin") && !dirName.equals("scripts")) {
                    String found = findPythonExecutableRecursively(file, depth + 1, maxDepth);
                    if (found != null) {
                        return found;
                    }
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

        } catch (IOException e) {
            // 捕获架构不匹配错误
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("Exec format error") ||
                                     errorMsg.contains("error=8"))) {
                log.error("❌ 架构不匹配：无法执行Python - {}", errorMsg);
                log.error("   请确认上传的Python架构与系统架构一致");
                throw new ServiceException(500,
                    "❌ Python可执行文件架构不匹配\n\n" +
                    "错误详情: " + errorMsg + "\n\n" +
                    "这通常表示：\n" +
                    "  - 上传了ARM架构的Python但系统是x86_64架构\n" +
                    "  - 或者上传了x86_64架构的Python但系统是ARM架构\n\n" +
                    "系统架构: " + System.getProperty("os.arch") + "\n" +
                    "需要下载: " + getRecommendedArchitecture(System.getProperty("os.arch").toLowerCase()) + " 架构的Python\n\n" +
                    "下载地址: https://github.com/astral-sh/python-build-standalone/releases");
            }
            log.warn("检测Python版本时IO错误: {}", errorMsg, e);
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
                    String entryName = entry.getName().toLowerCase();
                    // 对bin/Scripts目录下的文件和python可执行文件设置执行权限
                    if (entryName.contains("/bin/") || entryName.contains("/scripts/") ||
                            entryName.endsWith("python") || entryName.endsWith("python3") ||
                            entryName.endsWith("python.exe") || entryName.endsWith("python3.exe") ||
                            entryName.endsWith("pip") || entryName.endsWith("pip3") ||
                            entryName.endsWith("pip.exe") || entryName.endsWith("pip3.exe")) {
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
     * 确保目录中的Python可执行文件有执行权限（递归搜索，限制深度为3层）
     */
    private void ensurePythonExecutablePermissions(File directory) {
        ensurePythonExecutablePermissionsRecursively(directory, 0, 3);
    }

    /**
     * 编译Python源代码
     * @param sourceDir 源代码目录
     * @param taskId 任务ID（用于进度推送）
     * @return 编译后的安装目录
     */
    private String compilePythonSource(String sourceDir, String taskId) throws IOException, InterruptedException {
        // 检测操作系统
        String osName = System.getProperty("os.name").toLowerCase();
        boolean isWindows = osName.contains("win");

        // Windows 不支持从源代码编译 Python
        if (isWindows) {
            throw new ServiceException(500,
                "Windows系统不支持从源代码编译Python。" +
                "请下载Windows预编译版本（如python-3.x.x-embed-amd64.zip）或完整安装版。" +
                "下载地址: https://www.python.org/downloads/windows/");
        }

        String installDir = sourceDir + "_compiled";

        log.info("========================================");
        log.info("开始编译Python源代码");
        log.info("========================================");
        log.info("  操作系统: {}", osName);
        log.info("  源代码目录: {}", sourceDir);
        log.info("  安装目录: {}", installDir);
        log.warn("  ⚠️  注意：编译Python需要较长时间（10-30分钟）和大量CPU/内存资源");
        log.warn("  ⚠️  推荐使用预编译版本：https://github.com/astral-sh/python-build-standalone/releases");

        // 创建安装目录
        Files.createDirectories(Paths.get(installDir));

        // 检测CPU核心数
        int processors = Runtime.getRuntime().availableProcessors();
        log.info("  CPU核心数: {}", processors);

        // 构建编译命令（不使用 --enable-optimizations 加快编译，不安装pip避免ensurepip失败）
        // 注意：使用 --without-ensurepip 避免因缺少某些标准库模块（如html.parser）导致make install失败
        // 用户可以稍后通过"离线包"功能手动上传pip.whl
        String compileCommand = String.format(
            "cd '%s' && " +
            "./configure --prefix='%s' --without-ensurepip 2>&1 && " +
            "make -j%d 2>&1 && " +
            "make install 2>&1",
            sourceDir, installDir, processors
        );

        log.info("执行编译命令: {}", compileCommand);
        log.info("  注意：使用 --without-ensurepip 避免ensurepip失败");
        log.info("  提示：编译后可通过‘配置/离线包’上传pip.whl手动安装pip");
        log.info("----------------------------------------");
        progressLogService.sendLog(taskId, "开始执行configure配置...");

        // 根据系统选择 shell
        String shell = osName.contains("mac") || osName.contains("darwin") ? "bash" : "sh";
        ProcessBuilder pb = new ProcessBuilder(shell, "-c", compileCommand);
        pb.redirectErrorStream(true);

        Process process = pb.start();
        progressLogService.sendLog(taskId, "configure执行中，这可能需要几分钟...");

        // 读取并输出所有编译信息
        StringBuilder fullOutput = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder();
        boolean hasCriticalError = false; // 标记是否有关键致命错误

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream()))) {
            String line;
            int lineCount = 0;
            while ((line = reader.readLine()) != null) {
                fullOutput.append(line).append("\n");
                lineCount++;

                // 检测关键致命错误（只检测configure阶段的错误）
                String lowerLine = line.toLowerCase();

                // 只有configure阶段的错误才是真正致命的
                if (lowerLine.contains("configure: error:") ||
                    lowerLine.contains("cannot find sources")) {
                    hasCriticalError = true;
                    log.error("[关键错误] {}", line);
                    errorOutput.append(line).append("\n");
                    progressLogService.sendLog(taskId, "✗ configure错误: " + line);
                }

                // 输出关键信息到日志（修复：不把gcc命令和make过程的错误当作致命错误）
                // 真正的错误：configure阶段的错误
                boolean isConfigureError = (lowerLine.contains("configure: error") ||
                                           lowerLine.contains("cannot find sources"));

                if (isConfigureError) {
                    log.error("[配置错误] {}", line);
                    errorOutput.append(line).append("\n");
                } else if (lowerLine.contains("configure:") || lowerLine.contains("checking")) {
                    log.info("[配置进度] {}", line);
                    // 每隔50行configure检查输出一次进度
                    if (lineCount % 50 == 0) {
                        progressLogService.sendLog(taskId, "configure检查中...");
                    }
                } else if (lowerLine.contains("creating") || lowerLine.contains("installing") ||
                          lowerLine.contains("successfully") || lowerLine.contains("done")) {
                    log.info("[编译进度] {}", line);
                } else if (lowerLine.startsWith("make[") || lowerLine.contains("gcc ") ||
                          lowerLine.contains("ar rcs")) {
                    // make过程的正常输出，降低日志级别
                    log.debug("[Make] {}", line);
                    // 每隔200行make输出一次进度
                    if (lineCount % 200 == 0) {
                        progressLogService.sendLog(taskId, "编译中... 已处理 " + lineCount + " 行");
                    }
                }

                // 如果检测到关键错误（仅configure阶段），提前中断读取
                if (hasCriticalError && lineCount > 10) {
                    log.error("检测到configure阶段的关键错误，停止读取编译输出");
                    progressLogService.sendError(taskId, "configure配置失败");
                    break;
                }
            }
        }

        // 如果检测到关键错误，立即终止进程
        if (hasCriticalError) {
            log.error("检测到configure阶段的关键错误，终止编译进程");
            process.destroy();
            try {
                process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            } catch (Exception e) {
                process.destroyForcibly();
            }
        }

        int exitCode = process.waitFor();
        log.info("----------------------------------------");
        log.info("编译命令执行完成，退出码: {}", exitCode);

        if (exitCode != 0) {
            log.error("========================================");
            log.error("Python源代码编译失败！");
            log.error("========================================");
            log.error("退出码: {}", exitCode);
            progressLogService.sendError(taskId, "编译失败，退出码: " + exitCode);

            // 输出最后50行日志
            String[] lines = fullOutput.toString().split("\n");
            int startLine = Math.max(0, lines.length - 50);
            log.error("最后50行编译输出:");
            for (int i = startLine; i < lines.length; i++) {
                log.error("  {}", lines[i]);
            }

            // 构建错误消息
            StringBuilder errorMsg = new StringBuilder();
            errorMsg.append("Python源代码编译失败（退出码: ").append(exitCode).append("）\n\n");

            // 分析退出码
            if (exitCode == 143) {
                errorMsg.append("⚠️  编译进程被意外终止 (SIGTERM)\n");
                errorMsg.append("可能原因:\n");
                errorMsg.append("  - Docker容器内存不足被OOM Killer终止\n");
                errorMsg.append("  - 编译超时被系统终止\n");
                errorMsg.append("  - 手动取消了编译操作\n\n");
            }

            if (errorOutput.length() > 0) {
                errorMsg.append("错误信息:\n").append(errorOutput.toString()).append("\n");
            }

            // 检查常见错误模式
            String fullOutputStr = fullOutput.toString();
            if (fullOutputStr.contains("can't create") || fullOutputStr.contains("No such file or directory")) {
                errorMsg.append("\n⚠️  检测到文件创建错误\n");
                errorMsg.append("可能原因:\n");
                errorMsg.append("  - Docker容器磁盘空间不足\n");
                errorMsg.append("  - 挂载的卷权限不足\n");
                errorMsg.append("  - 临时目录空间不足\n\n");
            }

            if (fullOutputStr.contains("fatal error") && fullOutputStr.contains(".h:")) {
                errorMsg.append("\n⚠️  检测到缺少头文件\n");
                errorMsg.append("需要安装编译依赖:\n");
                errorMsg.append("  - build-essential (gcc, make等)\n");
                errorMsg.append("  - libssl-dev, zlib1g-dev, libbz2-dev\n");
                errorMsg.append("  - libreadline-dev, libsqlite3-dev\n");
                errorMsg.append("  - libffi-dev, liblzma-dev\n\n");
            }

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("【强烈推荐】使用预编译Python运行时:\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("1. 下载地址: https://github.com/astral-sh/python-build-standalone/releases\n");
            errorMsg.append("2. 选择对应平台:\n");
            errorMsg.append("   • Linux x86_64: cpython-3.11.9+20240726-x86_64-unknown-linux-gnu-install_only.tar.gz\n");
            errorMsg.append("   • Linux ARM64:  cpython-3.11.9+20240726-aarch64-unknown-linux-gnu-install_only.tar.gz\n");
            errorMsg.append("3. 优点:\n");
            errorMsg.append("   ✓ 无需编译，直接使用\n");
            errorMsg.append("   ✓ 包含完整Python和pip\n");
            errorMsg.append("   ✓ 无需系统依赖\n");
            errorMsg.append("   ✓ 上传后1分钟内完成配置\n\n");

            errorMsg.append("【如果必须编译源代码】\n");
            errorMsg.append("需要在Dockerfile中添加编译依赖:\n");
            errorMsg.append("RUN apt-get update && apt-get install -y \\\n");
            errorMsg.append("    build-essential libssl-dev zlib1g-dev \\\n");
            errorMsg.append("    libbz2-dev libreadline-dev libsqlite3-dev \\\n");
            errorMsg.append("    libffi-dev liblzma-dev tk-dev\n");

            throw new IOException(errorMsg.toString());
        }

        log.info("编译命令执行成功");
        progressLogService.sendLog(taskId, "✓ Python源代码编译成功");
        progressLogService.sendLog(taskId, "ℹ️  注意：编译时未安装pip（避免ensurepip失败）");
        progressLogService.sendLog(taskId, "ℹ️  稍后可通过‘配置/离线包’上传pip.whl手动安装pip");

        // 验证编译结果
        File pythonBin = new File(installDir, "bin/python3");
        if (!pythonBin.exists()) {
            log.error("编译完成但未找到python3可执行文件");
            log.error("预期位置: {}", pythonBin.getAbsolutePath());
            log.error("安装目录内容:");
            logDirectoryStructure(new File(installDir), 0, 3);

            throw new IOException(
                "编译完成但未找到python3可执行文件。\n" +
                "这通常表示编译过程未正确完成。\n\n" +
                "【推荐】使用预编译Python运行时:\n" +
                "  https://github.com/astral-sh/python-build-standalone/releases"
            );
        }

        // 设置可执行权限
        pythonBin.setExecutable(true);
        log.info("✓ 找到Python可执行文件: {}", pythonBin.getAbsolutePath());

        // 删除源代码目录以节省空间
        try {
            deleteDirectory(new File(sourceDir));
            log.info("✓ 已清理源代码目录");
        } catch (Exception e) {
            log.warn("清理源代码目录失败: {}", e.getMessage());
        }

        log.info("========================================");
        log.info("Python源代码编译成功！");
        log.info("========================================");
        log.info("ℹ️  提示：编译时使用了 --without-ensurepip");
        log.info("ℹ️  如需使用pip，请通过‘配置/离线包’上传 pip.whl");
        log.info("ℹ️  pip下载地址: https://pypi.org/project/pip/#files");

        return installDir;
    }

    /**
     * 记录目录结构（用于调试）
     */
    private void logDirectoryStructure(File directory, int depth, int maxDepth) {
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

    private void ensurePythonExecutablePermissionsRecursively(File directory, int depth, int maxDepth) {
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
     * 设置bin和lib目录的权限（针对python-build-standalone等预编译包）
     */
    private void setBinAndLibPermissions(File directory) {
        if (!directory.exists() || !directory.isDirectory()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                String dirName = file.getName().toLowerCase();

                // 处理bin目录：所有文件设置执行权限
                if (dirName.equals("bin") || dirName.equals("scripts")) {
                    log.info("处理{}目录，设置所有文件执行权限: {}", dirName, file.getAbsolutePath());
                    File[] binFiles = file.listFiles();
                    if (binFiles != null) {
                        for (File binFile : binFiles) {
                            if (binFile.isFile()) {
                                boolean result = binFile.setExecutable(true);
                                if (!result) {
                                    log.warn("设置执行权限失败: {}", binFile.getAbsolutePath());
                                }
                            }
                        }
                    }
                }
                // 处理lib目录：递归设置.so/.dylib文件的执行权限（共享库需要）
                else if (dirName.equals("lib") || dirName.equals("lib64")) {
                    log.info("处理{}目录，设置共享库文件执行权限: {}", dirName, file.getAbsolutePath());
                    setLibraryPermissionsRecursively(file, 0, 5);
                }
                // 递归处理子目录（限制深度避免过深）
                else if (!dirName.startsWith(".")) {
                    setBinAndLibPermissions(file);
                }
            }
        }
    }

    /**
     * 递归设置共享库文件权限
     */
    private void setLibraryPermissionsRecursively(File directory, int depth, int maxDepth) {
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
                // 共享库文件需要执行权限
                if (name.endsWith(".so") || name.contains(".so.") ||
                    name.endsWith(".dylib") || name.endsWith(".dll")) {
                    boolean result = file.setExecutable(true);
                    if (!result) {
                        log.debug("设置共享库执行权限失败: {}", file.getAbsolutePath());
                    }
                }
            } else if (file.isDirectory() && !file.getName().startsWith(".")) {
                setLibraryPermissionsRecursively(file, depth + 1, maxDepth);
            }
        }
    }

    /**
     * 递归删除目录（增强版，支持重试和强制删除，兼容Windows Docker和卷映射）
     */
    private void deleteDirectory(File directory) throws IOException {
        if (!directory.exists()) {
            return;
        }

        if (directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    deleteDirectory(file);
                }
            }
        }

        // 尝试删除文件/目录，失败时重试
        int maxRetries = 3;  // 减少重试次数（因为是异步执行）
        boolean deleted = false;

        for (int i = 0; i < maxRetries; i++) {
            // 先尝试使用Java API删除
            if (directory.delete()) {
                deleted = true;
                break;
            }

            // Java删除失败，尝试设置权限后重试
            if (i < maxRetries - 1) {
                try {
                    // 设置可写权限
                    directory.setWritable(true, false);  // false = 所有用户
                    directory.setReadable(true, false);
                    directory.setExecutable(true, false);

                    // 短暂延迟后重试（Docker映射目录可能需要同步时间）
                    Thread.sleep(100);

                } catch (Exception e) {
                    log.debug("设置权限时出错 (第{}次): {}", i + 1, e.getMessage());
                }
            }
        }

        // 如果普通方式删除失败，尝试使用系统命令（仅最后一次尝试）
        if (!deleted && directory.exists()) {
            try {
                String osName = System.getProperty("os.name").toLowerCase();
                Process process;

                if (osName.contains("win")) {
                    // Windows命令
                    process = Runtime.getRuntime().exec(new String[]{"cmd", "/c", "del", "/F", "/Q", directory.getAbsolutePath()});
                } else {
                    // Linux命令
                    process = Runtime.getRuntime().exec(new String[]{"rm", "-rf", directory.getAbsolutePath()});
                }

                // 等待命令执行完成，最多等待5秒
                boolean completed = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);

                if (completed && !directory.exists()) {
                    deleted = true;
                    log.debug("使用系统命令成功删除: {}", directory.getAbsolutePath());
                } else if (!completed) {
                    process.destroyForcibly();
                    log.warn("系统命令超时，强制终止: {}", directory.getAbsolutePath());
                }

            } catch (Exception e) {
                log.debug("系统命令删除失败: {}", e.getMessage());
            }
        }

        if (!deleted && directory.exists()) {
            // 对于Docker映射目录，删除失败是正常的，只记录debug级别日志
            log.debug("⚠️  无法删除: {} (已重试{}次)", directory.getAbsolutePath(), maxRetries);
            log.debug("   可能原因: Docker卷映射导致的文件系统同步延迟或权限限制");
            // 不抛出异常，只记录日志
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
