package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageOperationDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageUploadResultDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentCreateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentPage;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentUpdateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.UploadedPackageFileDTO;
import cn.tannn.cat.block.entity.PythonEnvironment;
import cn.tannn.cat.block.repository.PythonEnvironmentRepository;
import cn.tannn.cat.block.service.PythonEnvironmentService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        JSONObject packages = environment.getPackages();
        if (packages == null) {
            packages = new JSONObject();
        }

        // 添加包信息
        JSONObject packageInfo = new JSONObject();
        packageInfo.put("name", packageDTO.getPackageName());
        packageInfo.put("version", packageDTO.getVersion());
        packages.put(packageDTO.getPackageName(), packageInfo);

        environment.setPackages(packages);
        return pythonEnvironmentRepository.save(environment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment uninstallPackage(Integer id, String packageName) {
        PythonEnvironment environment = getById(id);

        JSONObject packages = environment.getPackages();
        if (packages != null && packages.containsKey(packageName)) {
            packages.remove(packageName);
            environment.setPackages(packages);
            return pythonEnvironmentRepository.save(environment);
        }

        throw new ServiceException(500, "包不存在: " + packageName);
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

        String packagesDir = environment.getEnvRootPath() + File.separator + "packages";
        Path targetPath = Paths.get(packagesDir, originalFilename);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("包文件上传成功: {}", targetPath);

            PackageUploadResultDTO result = new PackageUploadResultDTO();
            result.setFileName(originalFilename);
            result.setFileSize(file.getSize());
            result.setUploadTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            result.setSavePath(targetPath.toString());
            return result;

        } catch (IOException e) {
            log.error("保存包文件失败", e);
            throw new ServiceException(500, "保存包文件失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PythonEnvironment installPackageFile(Integer id, String fileName) {
        PythonEnvironment environment = getById(id);

        if (environment.getEnvRootPath() == null || environment.getSitePackagesPath() == null) {
            throw new ServiceException(500, "环境未初始化，请先初始化环境");
        }

        if (environment.getPythonExecutable() == null || environment.getPythonExecutable().isEmpty()) {
            throw new ServiceException(500, "未配置Python解释器路径");
        }

        String packageFilePath = environment.getEnvRootPath() + File.separator + "packages" + File.separator + fileName;
        File packageFile = new File(packageFilePath);

        if (!packageFile.exists()) {
            throw new ServiceException(404, "包文件不存在: " + fileName);
        }

        try {
            // 使用pip安装到指定目录
            ProcessBuilder pb = new ProcessBuilder(
                    environment.getPythonExecutable(),
                    "-m",
                    "pip",
                    "install",
                    "--target",
                    environment.getSitePackagesPath(),
                    packageFilePath);

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
                throw new ServiceException(500, "包安装失败，pip退出代码: " + exitCode + "，输出: " + output);
            }

            log.info("包安装成功: {}", fileName);

            // 提取包名和版本（简单实现）
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
            packages.put(packageName, packageInfo);

            environment.setPackages(packages);
            return pythonEnvironmentRepository.save(environment);

        } catch (IOException | InterruptedException e) {
            log.error("安装包失败", e);
            throw new ServiceException(500, "安装包失败: " + e.getMessage());
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
}
