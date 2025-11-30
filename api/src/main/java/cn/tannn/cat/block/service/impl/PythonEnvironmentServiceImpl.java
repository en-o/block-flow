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
import cn.tannn.cat.block.util.FileOperationUtil;
import cn.tannn.cat.block.util.PythonEnvDetector;
import cn.tannn.cat.block.util.PythonPackageParser;
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
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
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

        // 处理Python路径（如果手动配置了系统Python路径）
        if (createDTO.getPythonExecutable() != null && !createDTO.getPythonExecutable().trim().isEmpty()) {
            String pythonPath = createDTO.getPythonExecutable().trim();

            // 验证Python路径是否有效
            if (!PythonEnvDetector.verifyPythonExecutable(pythonPath)) {
                throw new ServiceException(500, "Python路径无效或不可执行: " + pythonPath);
            }

            log.info("配置Python路径: {}", pythonPath);

            // 自动检测Python版本
            String version = PythonEnvDetector.detectPythonVersion(pythonPath);
            if (version != null) {
                environment.setPythonVersion(version);
                log.info("检测到Python版本: {}", version);
            }

            // 自动检测site-packages路径（对于系统Python）
            String sitePackages = detectSitePackagesForSystemPython(pythonPath);
            if (sitePackages != null) {
                environment.setSitePackagesPath(sitePackages);
                log.info("检测到site-packages: {}", sitePackages);
            }

            // 检测pip版本
            String pipVersion = PythonEnvDetector.getPipVersion(pythonPath);
            if (pipVersion != null) {
                environment.setPipVersion(pipVersion);
                log.info("检测到pip版本: {}", pipVersion);
            } else {
                log.warn("未检测到pip");
            }
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

        // 处理Python路径更新（关键修复：手动配置系统Python路径）
        if (updateDTO.getPythonExecutable() != null && !updateDTO.getPythonExecutable().equals(environment.getPythonExecutable())) {
            String pythonPath = updateDTO.getPythonExecutable().trim();

            // 验证Python路径是否有效
            if (!PythonEnvDetector.verifyPythonExecutable(pythonPath)) {
                throw new ServiceException(500, "Python路径无效或不可执行: " + pythonPath);
            }

            // 保存Python路径
            environment.setPythonExecutable(pythonPath);
            log.info("更新Python路径: {}", pythonPath);

            // 自动检测Python版本
            String version = PythonEnvDetector.detectPythonVersion(pythonPath);
            if (version != null) {
                environment.setPythonVersion(version);
                log.info("检测到Python版本: {}", version);
            }

            // 自动检测site-packages路径（对于系统Python）
            String sitePackages = detectSitePackagesForSystemPython(pythonPath);
            if (sitePackages != null) {
                environment.setSitePackagesPath(sitePackages);
                log.info("检测到site-packages: {}", sitePackages);
            }

            // 检测pip版本
            String pipVersion = PythonEnvDetector.getPipVersion(pythonPath);
            if (pipVersion != null) {
                environment.setPipVersion(pipVersion);
                log.info("检测到pip版本: {}", pipVersion);
            } else {
                environment.setPipVersion(null);
                log.warn("未检测到pip");
            }
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
                        FileOperationUtil.deleteDirectory(envDir);
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

        // 检查pip是否可用（增强提示）
        boolean hasPip = PythonEnvDetector.checkPipAvailable(environment.getPythonExecutable());
        if (!hasPip) {
            // 构建详细的错误提示
            StringBuilder errorMsg = new StringBuilder();
            errorMsg.append("❌ 当前Python环境不包含pip模块，无法使用在线安装功能\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("📋 环境信息\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("环境名称: ").append(environment.getName()).append("\n");
            errorMsg.append("Python版本: ").append(environment.getPythonVersion() != null ? environment.getPythonVersion() : "未知").append("\n");
            errorMsg.append("Python路径: ").append(environment.getPythonExecutable()).append("\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("✅ 解决方案（3种方式）\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

            errorMsg.append("【方案1 - 推荐】上传包含pip的Python运行时\n");
            errorMsg.append("  1. 访问: https://github.com/astral-sh/python-build-standalone/releases\n");
            errorMsg.append("  2. 下载对应系统的 install_only.tar.gz 文件（默认包含pip）\n");
            errorMsg.append("  3. 在本页面点击'配置/Python运行时'上传\n\n");

            errorMsg.append("【方案2】离线安装pip包\n");
            errorMsg.append("  1. 下载pip安装包:\n");
            errorMsg.append("     • https://pypi.org/project/pip/#files\n");
            errorMsg.append("     • 选择 .whl 或 .tar.gz 格式（推荐: pip-24.3.1-py3-none-any.whl）\n");
            errorMsg.append("  2. 在本页面点击'配置/离线包'上传pip包文件\n");
            errorMsg.append("  3. 安装完成后即可使用在线安装功能\n\n");

            errorMsg.append("【方案3】直接使用离线包安装依赖\n");
            errorMsg.append("  • 下载所需Python包的 .whl 或 .tar.gz 文件\n");
            errorMsg.append("  • 在本页面点击'配置/离线包'逐个上传安装\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("💡 提示\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("python-build-standalone 是预编译的Python运行时，\n");
            errorMsg.append("默认包含pip、setuptools等工具，开箱即用，强烈推荐！\n");

            throw new ServiceException(500, errorMsg.toString());
        }

        String packageName = packageDTO.getPackageName();
        String version = packageDTO.getVersion();

        // 检查包是否已存在（仅验证，不阻止安装）
        String existingVersion = PythonEnvDetector.verifyPackageInstalled(environment.getPythonExecutable(), packageName);
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
            String installedVersion = PythonEnvDetector.verifyPackageInstalled(environment.getPythonExecutable(), packageName);
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

        // 检查site-packages路径
        if (environment.getSitePackagesPath() == null || environment.getSitePackagesPath().isEmpty()) {
            throw new ServiceException(500, "未配置site-packages路径，无法卸载包");
        }

        // 检查包是否在记录中
        JSONObject packages = environment.getPackages();
        if (packages == null || !packages.containsKey(packageName)) {
            throw new ServiceException(500, "包不存在: " + packageName);
        }

        // 获取包信息，判断安装方式
        Object packageInfoObj = packages.get(packageName);
        String installMethod = "unknown";

        if (packageInfoObj instanceof JSONObject packageInfo) {
            installMethod = packageInfo.getString("installMethod");
            if (installMethod == null) {
                installMethod = "unknown";
            }
        }

        log.info("开始卸载包: {}, 安装方式: {}", packageName, installMethod);

        try {
            // 根据安装方式选择卸载方法
            if ("pip".equals(installMethod)) {
                // 使用pip卸载（在线安装的包）
                uninstallViaPip(environment, packageName);
            } else if ("offline".equals(installMethod)) {
                // 直接删除文件（离线安装的包）
                uninstallViaFileSystem(environment, packageName);
            } else {
                // 未知安装方式，尝试两种方法
                log.warn("未知的安装方式: {}, 尝试通过文件系统卸载", installMethod);
                uninstallViaFileSystem(environment, packageName);
            }

            log.info("✓ 包卸载成功: {}", packageName);

        } catch (Exception e) {
            log.error("卸载包失败: {}", packageName, e);
            throw new ServiceException(500, "卸载包失败: " + e.getMessage());
        }

        // 从数据库记录中移除
        packages.remove(packageName);
        environment.setPackages(packages);

        // 如果卸载的是pip包，清空pip版本信息
        if ("pip".equalsIgnoreCase(packageName)) {
            log.info("检测到pip包卸载，清空pip版本信息");
            environment.setPipVersion(null);
        }

        return pythonEnvironmentRepository.save(environment);
    }

    /**
     * 使用pip命令卸载包
     */
    private void uninstallViaPip(PythonEnvironment environment, String packageName)
            throws IOException, InterruptedException {
        log.info("使用pip卸载包: {}", packageName);

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
                log.info("pip uninstall: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            log.error("pip uninstall失败，退出代码: {}, 输出: {}", exitCode, output);
            throw new IOException("pip uninstall命令执行失败: " + output.toString());
        }
    }

    /**
     * 通过直接删除文件系统目录来卸载包（用于离线安装的包）
     */
    private void uninstallViaFileSystem(PythonEnvironment environment, String packageName)
            throws IOException {
        log.info("通过文件系统卸载包: {}", packageName);

        String sitePackagesPath = environment.getSitePackagesPath();

        // 包目录可能的名称格式
        String[] possibleDirNames = {
            packageName,                              // 标准格式：pip
            packageName.replace("-", "_"),           // 下划线格式：some_package
            packageName.replace("_", "-"),           // 横线格式：some-package
        };

        boolean deleted = false;

        for (String dirName : possibleDirNames) {
            File packageDir = new File(sitePackagesPath, dirName);

            if (packageDir.exists() && packageDir.isDirectory()) {
                log.info("找到包目录: {}", packageDir.getAbsolutePath());
                FileOperationUtil.deleteDirectory(packageDir);
                log.info("✓ 已删除包目录: {}", packageDir.getAbsolutePath());
                deleted = true;

                // 删除 .dist-info 或 .egg-info 目录（如果存在）
                String[] infoSuffixes = {".dist-info", ".egg-info"};
                for (String suffix : infoSuffixes) {
                    File infoDir = new File(sitePackagesPath, dirName + suffix);
                    if (infoDir.exists()) {
                        FileOperationUtil.deleteDirectory(infoDir);
                        log.info("✓ 已删除元数据目录: {}", infoDir.getAbsolutePath());
                    }
                }

                break;
            }
        }

        if (!deleted) {
            log.warn("未找到包目录: {}, 可能已被手动删除", packageName);
            // 不抛出异常，因为目标已经达成（包不存在了）
        }
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
            String version = null;

            // packageInfo 可能是 JSONObject 或 Map
            if (packageInfo instanceof JSONObject info) {
                version = info.getString("version");
            } else if (packageInfo instanceof java.util.Map) {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> info = (java.util.Map<String, Object>) packageInfo;
                Object versionObj = info.get("version");
                version = versionObj != null ? versionObj.toString() : null;
            } else if (packageInfo instanceof String) {
                // 兼容旧格式：直接存储版本字符串
                version = (String) packageInfo;
            }

            if (version != null && !version.isEmpty()) {
                requirements.append(packageName).append("==").append(version).append("\n");
            } else {
                requirements.append(packageName).append("\n");
            }
        });

        return requirements.toString();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment importRequirements(Integer id, String requirementsText) {
        PythonEnvironment environment = getById(id);

        // 生成任务ID用于SSE推送
        String taskId = "import-requirements-" + id;

        // 检查环境是否已初始化并配置了Python
        if (environment.getPythonExecutable() == null || environment.getPythonExecutable().isEmpty()) {
            throw new ServiceException(500, "未配置Python解释器路径，无法安装包");
        }

        if (environment.getSitePackagesPath() == null || environment.getSitePackagesPath().isEmpty()) {
            throw new ServiceException(500, "未配置site-packages路径，无法安装包");
        }

        // 检查pip是否可用（增强提示）
        boolean hasPip = PythonEnvDetector.checkPipAvailable(environment.getPythonExecutable());
        if (!hasPip) {
            // 构建详细的错误提示
            StringBuilder errorMsg = new StringBuilder();
            errorMsg.append("❌ 当前Python环境不包含pip模块，无法使用requirements.txt批量安装功能\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("📋 环境信息\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("环境名称: ").append(environment.getName()).append("\n");
            errorMsg.append("Python版本: ").append(environment.getPythonVersion() != null ? environment.getPythonVersion() : "未知").append("\n");
            errorMsg.append("Python路径: ").append(environment.getPythonExecutable()).append("\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("✅ 解决方案（3种方式）\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

            errorMsg.append("【方案1 - 推荐】上传包含pip的Python运行时\n");
            errorMsg.append("  1. 访问: https://github.com/astral-sh/python-build-standalone/releases\n");
            errorMsg.append("  2. 下载对应系统的 install_only.tar.gz 文件（默认包含pip）\n");
            errorMsg.append("  3. 点击'配置/Python运行时'上传\n\n");

            errorMsg.append("【方案2】离线安装pip包\n");
            errorMsg.append("  1. 下载pip安装包:\n");
            errorMsg.append("     • https://pypi.org/project/pip/#files\n");
            errorMsg.append("     • 选择 .whl 或 .tar.gz 格式（推荐: pip-24.3.1-py3-none-any.whl）\n");
            errorMsg.append("  2. 点击'配置/离线包'上传pip包文件\n");
            errorMsg.append("  3. 安装完成后即可使用requirements.txt批量安装\n\n");

            errorMsg.append("【方案3】使用离线包逐个安装依赖\n");
            errorMsg.append("  • 下载requirements.txt中每个包的 .whl 或 .tar.gz 文件\n");
            errorMsg.append("  • 点击'配置/离线包'逐个上传安装\n\n");

            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("💡 提示\n");
            errorMsg.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            errorMsg.append("python-build-standalone 是预编译的Python运行时，\n");
            errorMsg.append("默认包含pip、setuptools等工具，开箱即用，强烈推荐！\n");

            throw new ServiceException(500, errorMsg.toString());
        }

        log.info("========================================");
        log.info("开始批量安装requirements.txt中的包");
        log.info("========================================");
        log.info("环境ID: {}", id);
        log.info("环境名称: {}", environment.getName());

        progressLogService.sendLog(taskId, "========================================");
        progressLogService.sendLog(taskId, "开始批量安装requirements.txt中的包");
        progressLogService.sendLog(taskId, "========================================");

        // 解析requirements.txt格式
        String[] lines = requirementsText.split("\n");
        List<String> packagesToInstall = new ArrayList<>();

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            packagesToInstall.add(line);
        }

        if (packagesToInstall.isEmpty()) {
            throw new ServiceException(400, "requirements.txt内容为空，没有需要安装的包");
        }

        log.info("待安装包数量: {}", packagesToInstall.size());
        log.info("包列表: {}", packagesToInstall);

        progressLogService.sendLog(taskId, "待安装包数量: " + packagesToInstall.size());
        progressLogService.sendLog(taskId, "包列表: " + String.join(", ", packagesToInstall));
        progressLogService.sendProgress(taskId, 10, "准备安装...");

        // 创建临时requirements.txt文件
        String tempRequirementsPath = null;
        try {
            // 在环境目录创建临时文件
            String envRoot = environment.getEnvRootPath();
            if (envRoot == null) {
                throw new ServiceException(500, "环境未初始化");
            }

            Path tempFile = Files.createTempFile(Paths.get(envRoot), "requirements-", ".txt");
            tempRequirementsPath = tempFile.toString();
            Files.write(tempFile, packagesToInstall);
            log.info("创建临时requirements.txt: {}", tempRequirementsPath);
            progressLogService.sendLog(taskId, "✓ 创建临时requirements.txt");

            // 构建pip install -r命令
            List<String> command = new ArrayList<>();
            command.add(environment.getPythonExecutable());
            command.add("-m");
            command.add("pip");
            command.add("install");
            command.add("-r");
            command.add(tempRequirementsPath);
            command.add("--target");
            command.add(environment.getSitePackagesPath());

            log.info("执行pip install命令: {}", String.join(" ", command));
            progressLogService.sendLog(taskId, "执行命令: python -m pip install -r requirements.txt");
            progressLogService.sendProgress(taskId, 20, "开始下载和安装包...");

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // 读取输出
            StringBuilder output = new StringBuilder();
            List<String> successfulPackages = new ArrayList<>();
            List<String> failedPackages = new ArrayList<>();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                int lineCount = 0;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.info("pip output: {}", line);

                    // 发送实时日志到前端
                    if (line.contains("Collecting")) {
                        progressLogService.sendLog(taskId, "📦 " + line);
                    } else if (line.contains("Downloading")) {
                        progressLogService.sendLog(taskId, "⬇️  " + line);
                    } else if (line.contains("Installing")) {
                        progressLogService.sendLog(taskId, "🔧 " + line);
                    } else if (line.contains("Successfully installed")) {
                        progressLogService.sendLog(taskId, "✓ " + line);
                        // 解析成功安装的包
                        String packagesStr = line.substring(line.indexOf("Successfully installed") + 22).trim();
                        String[] installedPackages = packagesStr.split("\\s+");
                        for (String pkg : installedPackages) {
                            if (!pkg.isEmpty()) {
                                successfulPackages.add(pkg);
                            }
                        }
                    } else if (line.contains("Requirement already satisfied")) {
                        progressLogService.sendLog(taskId, "ℹ️  " + line);
                    } else if (line.contains("error") || line.contains("ERROR")) {
                        progressLogService.sendLog(taskId, "❌ " + line);
                    } else if (!line.trim().isEmpty()) {
                        // 其他非空行也发送
                        progressLogService.sendLog(taskId, line);
                    }

                    // 更新进度（20% ~ 80%）
                    lineCount++;
                    if (lineCount % 5 == 0) {
                        int progress = Math.min(80, 20 + lineCount * 2);
                        progressLogService.sendProgress(taskId, progress, "正在安装包...");
                    }
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("pip install -r失败，退出代码: {}, 输出: {}", exitCode, output);
                progressLogService.sendLog(taskId, "❌ 安装失败，退出代码: " + exitCode);
                progressLogService.sendError(taskId, "批量安装包失败: " + output.toString());
                throw new ServiceException(500, "批量安装包失败: " + output.toString());
            }

            log.info("批量安装成功，成功安装的包: {}", successfulPackages);
            progressLogService.sendProgress(taskId, 80, "验证安装结果...");

            // 更新环境的packages字段
            JSONObject packages = environment.getPackages();
            if (packages == null) {
                packages = new JSONObject();
            }

            // 遍历每个包，验证安装并更新记录
            int installedCount = 0;
            int totalPackages = packagesToInstall.size();
            for (int i = 0; i < totalPackages; i++) {
                String packageLine = packagesToInstall.get(i);
                String packageName;
                String requestedVersion = "";

                // 解析包名和版本
                if (packageLine.contains("==")) {
                    String[] parts = packageLine.split("==");
                    packageName = parts[0].trim();
                    requestedVersion = parts.length > 1 ? parts[1].trim() : "";
                } else if (packageLine.contains(">=")) {
                    String[] parts = packageLine.split(">=");
                    packageName = parts[0].trim();
                    requestedVersion = parts.length > 1 ? ">=" + parts[1].trim() : "";
                } else if (packageLine.contains("<=")) {
                    String[] parts = packageLine.split("<=");
                    packageName = parts[0].trim();
                    requestedVersion = parts.length > 1 ? "<=" + parts[1].trim() : "";
                } else {
                    packageName = packageLine.trim();
                }

                // 验证包是否真正安装了
                String installedVersion = PythonEnvDetector.verifyPackageInstalled(environment.getPythonExecutable(), packageName);
                if (installedVersion != null) {
                    JSONObject packageInfo = new JSONObject();
                    packageInfo.put("name", packageName);
                    packageInfo.put("version", installedVersion);
                    packageInfo.put("installMethod", "pip");
                    packageInfo.put("installedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    packageInfo.put("installedFrom", "requirements.txt");
                    packages.put(packageName, packageInfo);
                    installedCount++;
                    log.info("✓ 包 {} 安装成功，版本: {}", packageName, installedVersion);
                    progressLogService.sendLog(taskId, String.format("✓ 验证成功: %s %s", packageName, installedVersion));
                } else {
                    log.warn("⚠ 包 {} 验证失败，可能未正确安装", packageName);
                    progressLogService.sendLog(taskId, "⚠ 验证失败: " + packageName);
                    failedPackages.add(packageName);
                }

                // 更新验证进度（80% ~ 95%）
                int verifyProgress = 80 + (15 * (i + 1) / totalPackages);
                progressLogService.sendProgress(taskId, verifyProgress, String.format("验证中 %d/%d", i + 1, totalPackages));
            }

            environment.setPackages(packages);
            pythonEnvironmentRepository.save(environment);

            log.info("========================================");
            log.info("批量安装完成");
            log.info("========================================");
            log.info("成功安装: {} 个包", installedCount);
            if (!failedPackages.isEmpty()) {
                log.warn("失败/跳过: {} 个包: {}", failedPackages.size(), failedPackages);
            }

            progressLogService.sendProgress(taskId, 100, "安装完成");
            progressLogService.sendLog(taskId, "========================================");
            progressLogService.sendLog(taskId, String.format("✓ 批量安装完成！成功: %d 个包", installedCount));
            if (!failedPackages.isEmpty()) {
                progressLogService.sendLog(taskId, String.format("⚠ 失败/跳过: %d 个包: %s", failedPackages.size(), String.join(", ", failedPackages)));
            }
            progressLogService.sendLog(taskId, "========================================");
            progressLogService.sendComplete(taskId, true, "requirements.txt安装完成");

            return environment;

        } catch (IOException | InterruptedException e) {
            log.error("批量安装包失败", e);
            progressLogService.sendError(taskId, "批量安装包失败: " + e.getMessage());
            throw new ServiceException(500, "批量安装包失败: " + e.getMessage());
        } finally {
            // 清理临时文件
            if (tempRequirementsPath != null) {
                try {
                    Files.deleteIfExists(Paths.get(tempRequirementsPath));
                    log.info("临时requirements.txt已删除");
                } catch (IOException e) {
                    log.warn("删除临时requirements.txt失败: {}", e.getMessage());
                }
            }
        }
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

        // 如果site-packages路径为空，使用默认路径（initializeEnvironment设置的路径）
        String sitePackagesPath = environment.getSitePackagesPath();
        if (sitePackagesPath == null || sitePackagesPath.isEmpty()) {
            sitePackagesPath = environment.getEnvRootPath() + File.separator + "lib" + File.separator + "site-packages";
            log.info("site-packages路径未配置，使用默认路径: {}", sitePackagesPath);

            // 确保目录存在
            try {
                Files.createDirectories(Paths.get(sitePackagesPath));
                // 更新环境配置
                environment.setSitePackagesPath(sitePackagesPath);
                pythonEnvironmentRepository.save(environment);
                log.info("已创建并保存site-packages路径: {}", sitePackagesPath);
            } catch (IOException e) {
                throw new ServiceException(500, "创建site-packages目录失败: " + e.getMessage());
            }
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
            String packageName = PythonPackageParser.extractPackageName(originalFilename);
            String version = PythonPackageParser.extractPackageVersion(originalFilename);

            // 如果安装的是pip包，立即配置._pth文件并更新pip版本
            if ("pip".equalsIgnoreCase(packageName)) {
                log.info("检测到pip包安装，开始配置Python路径...");
                if (environment.getPythonExecutable() != null && environment.getSitePackagesPath() != null) {
                    configurePythonPath(environment.getPythonExecutable(), environment.getSitePackagesPath());
                    log.info("pip安装后，._pth文件已配置");

                    // 更新pip版本
                    String pipVersion = PythonEnvDetector.getPipVersion(environment.getPythonExecutable());
                    if (pipVersion != null) {
                        environment.setPipVersion(pipVersion);
                        log.info("pip版本已更新: {}", pipVersion);
                    }
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
            String packageName = PythonPackageParser.extractPackageName(fileName);
            String version = PythonPackageParser.extractPackageVersion(fileName);

            // 如果安装的是pip包，立即配置._pth文件并更新pip版本
            if ("pip".equalsIgnoreCase(packageName)) {
                log.info("检测到pip包安装，开始配置Python路径...");
                if (environment.getPythonExecutable() != null && environment.getSitePackagesPath() != null) {
                    configurePythonPath(environment.getPythonExecutable(), environment.getSitePackagesPath());
                    log.info("pip安装后，._pth文件已配置");

                    // 更新pip版本
                    String pipVersion = PythonEnvDetector.getPipVersion(environment.getPythonExecutable());
                    if (pipVersion != null) {
                        environment.setPipVersion(pipVersion);
                        log.info("pip版本已更新: {}", pipVersion);
                    }
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
            FileOperationUtil.extractZip(packageFilePath, sitePackagesPath);
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
                        // 处理目录
                        if (!targetFile.exists() && !targetFile.mkdirs()) {
                            throw new IOException("无法创建目录: " + targetFile);
                        }
                    } else if (entry.isSymbolicLink()) {
                        // 处理符号链接（关键修复：保留Python运行时中的符号链接）
                        String linkTarget = entry.getLinkName();
                        Path targetPath = targetFile.toPath();
                        Path linkPath = Paths.get(linkTarget);

                        // 创建父目录
                        File parent = targetFile.getParentFile();
                        if (!parent.exists() && !parent.mkdirs()) {
                            throw new IOException("无法创建父目录: " + parent);
                        }

                        // 创建符号链接
                        try {
                            Files.createSymbolicLink(targetPath, linkPath);
                            log.info("创建符号链接: {} -> {}", targetFile.getName(), linkTarget);
                        } catch (FileAlreadyExistsException e) {
                            log.warn("符号链接已存在，跳过: {}", targetFile.getName());
                        }
                    } else {
                        // 处理普通文件
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

            // tar.gz通常解压出一个包含setup.py的目录（如pip-25.3/）
            File packageRoot = tempFiles[0];
            if (!packageRoot.isDirectory()) {
                // 如果第一个不是目录，尝试查找第一个目录
                for (File f : tempFiles) {
                    if (f.isDirectory()) {
                        packageRoot = f;
                        break;
                    }
                }
            }

            log.info("找到包根目录: {}", packageRoot.getAbsolutePath());

            // 查找实际的Python源代码目录
            // tar.gz包的典型结构：
            // pip-25.3/
            //   ├── setup.py
            //   ├── src/
            //   │   └── pip/           <- 这才是真正的Python包
            //   │       └── __init__.py
            //   └── ...

            File actualSourceDir = findActualPythonPackageDir(packageRoot);
            if (actualSourceDir == null) {
                throw new IOException("未找到有效的Python包目录（包含__init__.py的目录）");
            }

            log.info("找到实际Python包目录: {}", actualSourceDir.getAbsolutePath());

            // 复制到site-packages（只复制包目录，不复制setup.py等）
            File targetDir = new File(sitePackagesPath, actualSourceDir.getName());
            FileOperationUtil.copyDirectory(actualSourceDir, targetDir);
            log.info("包文件已复制到site-packages: {} -> {}", actualSourceDir.getName(), targetDir.getAbsolutePath());

        } finally {
            // 清理临时目录
            try {
                FileOperationUtil.deleteDirectory(tempDir.toFile());
                log.info("临时目录已清理: {}", tempDir);
            } catch (IOException e) {
                log.warn("清理临时目录失败: {}", e.getMessage());
            }
        }
    }

    /**
     * 查找实际的Python包目录（包含__init__.py的目录）
     *
     * tar.gz包的典型结构：
     * 1. src布局：package-1.0/ -> src/ -> package/ -> __init__.py
     * 2. 传统布局：package-1.0/ -> package/ -> __init__.py
     * 3. 单文件模块：package-1.0/ -> package.py
     */
    private File findActualPythonPackageDir(File packageRoot) {
        if (packageRoot == null || !packageRoot.exists() || !packageRoot.isDirectory()) {
            return null;
        }

        log.debug("开始查找Python包目录，根目录: {}", packageRoot.getAbsolutePath());

        // 1. 优先检查src布局（pip, setuptools等使用这种结构）
        File srcDir = new File(packageRoot, "src");
        if (srcDir.exists() && srcDir.isDirectory()) {
            log.debug("找到src目录: {}", srcDir.getAbsolutePath());
            File[] srcFiles = srcDir.listFiles();
            if (srcFiles != null) {
                for (File file : srcFiles) {
                    if (file.isDirectory()) {
                        File initFile = new File(file, "__init__.py");
                        if (initFile.exists()) {
                            log.info("在src布局中找到Python包: {}", file.getName());
                            return file;
                        }
                    }
                }
            }
        }

        // 2. 检查根目录下的Python包（传统布局）
        File[] rootFiles = packageRoot.listFiles();
        if (rootFiles != null) {
            for (File file : rootFiles) {
                if (file.isDirectory() && !file.getName().equals("src")) {
                    File initFile = new File(file, "__init__.py");
                    if (initFile.exists()) {
                        log.info("在根目录下找到Python包: {}", file.getName());
                        return file;
                    }
                }
            }
        }

        // 3. 检查单文件模块（package.py）
        if (rootFiles != null) {
            for (File file : rootFiles) {
                if (file.isFile() && file.getName().endsWith(".py") && !file.getName().startsWith("setup")) {
                    log.info("找到单文件Python模块: {}", file.getName());
                    // 单文件模块需要特殊处理：直接复制到site-packages根目录
                    // 但这里返回文件本身，调用方需要处理
                    return packageRoot; // 返回根目录，让调用方复制整个.py文件
                }
            }
        }

        log.warn("未找到有效的Python包目录: {}", packageRoot.getAbsolutePath());
        return null;
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
                    dto.setFileType(FileOperationUtil.getFileExtension(file.getName()));
                    dto.setUploadTime(file.lastModified());

                    // 检查是否已安装
                    boolean installed = false;
                    if (installedPackages != null) {
                        String packageName = PythonPackageParser.extractPackageName(file.getName());
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

        // 等待SSE连接建立（避免消息丢失）
        try {
            Thread.sleep(1000);  // 增加到1秒，确保SSE连接完全建立
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        progressLogService.sendLog(taskId, "开始上传Python运行时...");
        progressLogService.sendProgress(taskId, 5, "验证文件格式和大小");

        // 如果已有Python运行时配置，先清理旧环境
        String runtimeDir = environment.getEnvRootPath() + File.separator + "runtime";
        File runtimeDirFile = new File(runtimeDir);

        if (runtimeDirFile.exists()) {
            progressLogService.sendLog(taskId, "检测到旧的Python运行时，开始清理...");
            log.info("清理旧的Python运行时目录: {}", runtimeDir);

            try {
                // 删除整个runtime目录
                FileOperationUtil.deleteDirectory(runtimeDirFile);
                progressLogService.sendLog(taskId, "✓ 已清理旧的Python运行时");
                log.info("✓ 成功删除旧运行时目录");
            } catch (IOException e) {
                log.warn("清理旧运行时目录失败: {}, 继续上传新环境", e.getMessage());
                progressLogService.sendLog(taskId, "⚠ 清理旧环境时出现警告，继续上传新环境");
            }
        }

        // 清空环境配置（准备重新检测）
        if (environment.getPythonExecutable() != null ||
            environment.getPythonVersion() != null ||
            environment.getSitePackagesPath() != null ||
            (environment.getPackages() != null && !environment.getPackages().isEmpty())) {

            log.info("清空旧的Python环境配置");
            environment.setPythonExecutable(null);
            environment.setPythonVersion(null);
            environment.setSitePackagesPath(null);

            // 清空已安装的包记录（因为runtime目录已删除）
            if (environment.getPackages() != null && !environment.getPackages().isEmpty()) {
                log.info("清空已安装的包记录（共{}个包）", environment.getPackages().size());
                environment.setPackages(new JSONObject());
            }

            pythonEnvironmentRepository.save(environment);
            progressLogService.sendLog(taskId, "✓ 已清空旧的环境配置");
        }

        // 创建runtime目录
        try {
            Files.createDirectories(Paths.get(runtimeDir));
            progressLogService.sendLog(taskId, "创建runtime目录");
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

            // 创建解压目录（如果存在就先删除，作为二次保险）
            Path extractPathObj = Paths.get(extractPath);
            if (Files.exists(extractPathObj)) {
                log.warn("解压目录已存在（应该在前面已删除），再次删除: {}", extractPath);
                FileOperationUtil.deleteDirectory(extractPathObj.toFile());
            }
            Files.createDirectories(extractPathObj);

            if (isZip) {
                progressLogService.sendLog(taskId, "正在解压 ZIP 文件...");
                FileOperationUtil.extractZip(uploadPath.toString(), extractPath);
            } else {
                progressLogService.sendLog(taskId, "正在解压 TAR.GZ 文件...");
                FileOperationUtil.extractTarGz(uploadPath.toString(), extractPath);
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
                FileOperationUtil.logDirectoryStructure(extractDir, 0, 2);
            } else if (subItems != null) {
                log.info("解压后包含 {} 个项目", subItems.length);
                progressLogService.sendLog(taskId, "解压后包含 " + subItems.length + " 个文件/目录");
            }

            // 仅支持预编译Python包
            log.info("开始设置预编译Python包权限...");
            log.info("  Python根目录: {}", extractPath);
            progressLogService.sendProgress(taskId, 50, "设置执行权限");

            finalExtractPath = extractPath;

            // 确保Python可执行文件和共享库有执行权限
            FileOperationUtil.ensurePythonExecutablePermissions(extractDir);
            // 特别处理bin/lib目录的权限（python-build-standalone需要）
            FileOperationUtil.setBinAndLibPermissions(extractDir);

            log.info("预编译Python包权限设置完成");
            progressLogService.sendLog(taskId, "✓ 权限设置完成");

            // 输出解压后的文件结构（用于调试）
            log.info("最终Python目录结构:");
            FileOperationUtil.logDirectoryStructure(new File(finalExtractPath), 0, 3);
        } catch (Exception e) {
            log.error("解压运行时文件失败", e);
            progressLogService.sendError(taskId, "解压失败: " + e.getMessage());
            throw new ServiceException(500, "解压运行时文件失败: " + e.getMessage());
        }

        // 自动检测Python可执行文件
        progressLogService.sendProgress(taskId, 75, "正在检测Python可执行文件...");
        String pythonExecutable = PythonEnvDetector.detectPythonExecutable(finalExtractPath);
        if (pythonExecutable == null) {
            log.error("========================================");
            log.error("未能检测到Python可执行文件！");
            log.error("========================================");
            log.error("解压目录: {}", finalExtractPath);
            log.error("目录结构:");
            FileOperationUtil.logDirectoryStructure(new File(finalExtractPath), 0, 3);

            // 检查是否存在架构不匹配问题
            String archMismatchHint = PythonEnvDetector.detectArchitectureMismatch(finalExtractPath);

            // 获取当前系统架构
            String osArch = System.getProperty("os.arch").toLowerCase();
            String osName = System.getProperty("os.name").toLowerCase();
            String recommendedArch = PythonEnvDetector.getRecommendedArchitecture(osArch);
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
        String pythonVersion = PythonEnvDetector.detectPythonVersion(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            progressLogService.sendLog(taskId, "Python版本: " + pythonVersion);
        } else {
            // 如果检测失败，尝试从文件名提取版本号
            pythonVersion = PythonEnvDetector.extractPythonVersionFromFilename(originalFilename);
            if (pythonVersion != null && !pythonVersion.isEmpty()) {
                progressLogService.sendLog(taskId, "从文件名提取Python版本: " + pythonVersion);
            } else {
                // 如果仍然失败，使用默认值
                pythonVersion = "unknown";
                progressLogService.sendLog(taskId, "⚠ 无法检测Python版本，使用默认值: unknown");
            }
        }

        // 检测site-packages路径（使用最终的Python目录）
        progressLogService.sendProgress(taskId, 90, "检测site-packages路径...");
        String sitePackagesPath = PythonEnvDetector.detectSitePackagesPath(finalExtractPath);

        // 处理Python embed版本的._pth文件（修复pip无法使用的问题）
        configurePythonPath(pythonExecutable, sitePackagesPath);

        // 在配置._pth文件后重新检测pip（可能已经可用了）
        progressLogService.sendProgress(taskId, 95, "检测pip可用性...");
        boolean hasPip = PythonEnvDetector.checkPipAvailable(pythonExecutable);
        String pipVersion = null;

        if (hasPip) {
            // 获取pip版本号
            pipVersion = PythonEnvDetector.getPipVersion(pythonExecutable);
            progressLogService.sendLog(taskId, "✓ pip可用");
            if (pipVersion != null) {
                progressLogService.sendLog(taskId, "  pip版本: " + pipVersion);
            }
            progressLogService.sendLog(taskId, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            progressLogService.sendLog(taskId, "✅ 可以使用在线安装功能");
            progressLogService.sendLog(taskId, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } else {
            progressLogService.sendLog(taskId, "⚠ pip不可用");
            progressLogService.sendLog(taskId, "");
            progressLogService.sendLog(taskId, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            progressLogService.sendLog(taskId, "⚠️  pip模块检测失败");
            progressLogService.sendLog(taskId, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            progressLogService.sendLog(taskId, "当前Python环境不包含pip模块，无法使用在线安装功能");
            progressLogService.sendLog(taskId, "");
            progressLogService.sendLog(taskId, "解决方案：");
            progressLogService.sendLog(taskId, "");
            progressLogService.sendLog(taskId, "【方案1 - 推荐】重新上传包含pip的Python运行时");
            progressLogService.sendLog(taskId, "  • 访问: https://github.com/astral-sh/python-build-standalone/releases");
            progressLogService.sendLog(taskId, "  • 下载 install_only.tar.gz 文件（默认包含pip）");
            progressLogService.sendLog(taskId, "  • 重新上传该文件");
            progressLogService.sendLog(taskId, "");
            progressLogService.sendLog(taskId, "【方案2】离线安装pip包");
            progressLogService.sendLog(taskId, "  • 下载: https://pypi.org/project/pip/#files");
            progressLogService.sendLog(taskId, "  • 选择 .whl 格式（如: pip-24.3.1-py3-none-any.whl）");
            progressLogService.sendLog(taskId, "  • 在本页面点击'配置/离线包'上传");
            progressLogService.sendLog(taskId, "");
            progressLogService.sendLog(taskId, "【方案3】继续使用离线包安装依赖");
            progressLogService.sendLog(taskId, "  • 下载所需Python包的 .whl 或 .tar.gz 文件");
            progressLogService.sendLog(taskId, "  • 点击'配置/离线包'逐个上传安装");
            progressLogService.sendLog(taskId, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }

        // 更新环境配置
        environment.setPythonExecutable(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            environment.setPythonVersion(pythonVersion);
        }
        if (sitePackagesPath != null && !sitePackagesPath.isEmpty()) {
            environment.setSitePackagesPath(sitePackagesPath);
        }
        if (pipVersion != null) {
            environment.setPipVersion(pipVersion);
        }
        pythonEnvironmentRepository.save(environment);

        // 发送完成消息（在构建返回结果之前，确保SSE连接还在）
        progressLogService.sendProgress(taskId, 100, "配置完成");
        progressLogService.sendComplete(taskId, true, "Python运行时配置成功！");

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

        // 推荐使用python-build-standalone（不再发送sendComplete，已在前面发送）
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
        String pythonExecutable = PythonEnvDetector.detectPythonExecutable(environment.getEnvRootPath());
        if (pythonExecutable == null) {
            throw new ServiceException(500, "未能检测到Python可执行文件");
        }

        // 检测Python版本
        String pythonVersion = PythonEnvDetector.detectPythonVersion(pythonExecutable);

        // 检测site-packages路径
        String sitePackagesPath = PythonEnvDetector.detectSitePackagesPath(environment.getEnvRootPath());

        // 检测pip版本
        String pipVersion = PythonEnvDetector.getPipVersion(pythonExecutable);
        log.info("检测到pip版本: {}", pipVersion != null ? pipVersion : "未安装");

        // 更新环境配置
        environment.setPythonExecutable(pythonExecutable);
        if (pythonVersion != null && !pythonVersion.isEmpty()) {
            environment.setPythonVersion(pythonVersion);
        }
        if (sitePackagesPath != null && !sitePackagesPath.isEmpty()) {
            environment.setSitePackagesPath(sitePackagesPath);
        }
        if (pipVersion != null && !pipVersion.isEmpty()) {
            environment.setPipVersion(pipVersion);
            log.info("已保存pip版本到数据库: {}", pipVersion);
        } else {
            environment.setPipVersion(null);
            log.info("环境中未检测到pip，已清空pip版本字段");
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
                        if (PythonEnvDetector.verifyPythonExecutable(pythonPath)) {
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
                if (PythonEnvDetector.verifyPythonExecutable(found)) {
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
     * 检测系统Python的site-packages路径
     * 通过执行Python命令获取site-packages的实际路径
     *
     * @param pythonExecutable Python可执行文件路径
     * @return site-packages路径，失败返回null
     */
    private String detectSitePackagesForSystemPython(String pythonExecutable) {
        if (pythonExecutable == null || pythonExecutable.trim().isEmpty()) {
            return null;
        }

        try {
            // 使用Python命令获取site-packages路径
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExecutable,
                    "-c",
                    "import site; print(site.getsitepackages()[0])"
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String sitePackages = reader.readLine();
                int exitCode = process.waitFor();

                if (exitCode == 0 && sitePackages != null && !sitePackages.trim().isEmpty()) {
                    String path = sitePackages.trim();

                    // 验证路径是否存在
                    File sitePackagesDir = new File(path);
                    if (sitePackagesDir.exists() && sitePackagesDir.isDirectory()) {
                        log.info("检测到site-packages路径: {}", path);
                        return path;
                    } else {
                        log.warn("site-packages路径不存在: {}", path);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("检测site-packages路径失败: {}", e.getMessage());
        }

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
     * 从文件名提取Python版本
     * 例如: cpython-3.10.19+20251010-x86_64-unknown-linux-gnu-install_only.tar.gz -> 3.10.19
     */
    private String extractPythonVersionFromFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }

        try {
            // 匹配类似 cpython-3.10.19 或 python-3.11.9 的模式
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(cpython|python)[-_](\\d+\\.\\d+\\.\\d+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher matcher = pattern.matcher(filename);

            if (matcher.find()) {
                String version = matcher.group(2);
                log.info("从文件名 {} 提取Python版本: {}", filename, version);
                return version;
            }

            log.warn("无法从文件名提取版本: {}", filename);
        } catch (Exception e) {
            log.warn("解析文件名版本时出错: {}", e.getMessage());
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
                    "需要下载: " + PythonEnvDetector.getRecommendedArchitecture(System.getProperty("os.arch").toLowerCase()) + " 架构的Python\n\n" +
                    "下载地址: https://github.com/astral-sh/python-build-standalone/releases");
            }
            log.warn("检测Python版本时IO错误: {}", errorMsg, e);
        } catch (Exception e) {
            log.warn("检测Python版本失败", e);
        }

        return null;  // 返回null而不是空字符串
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
