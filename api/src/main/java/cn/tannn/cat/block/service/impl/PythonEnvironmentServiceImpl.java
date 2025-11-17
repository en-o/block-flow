package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageOperationDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentCreateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentPage;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentUpdateDTO;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.entity.PythonEnvironment;
import cn.tannn.cat.block.repository.PythonEnvironmentRepository;
import cn.tannn.cat.block.service.PythonEnvironmentService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Python环境Service实现
 *
 * @author tnnn
 */
@Service
@RequiredArgsConstructor
public class PythonEnvironmentServiceImpl implements PythonEnvironmentService {

    private final PythonEnvironmentRepository pythonEnvironmentRepository;

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
}
