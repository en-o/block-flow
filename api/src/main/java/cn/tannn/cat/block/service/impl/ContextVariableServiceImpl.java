package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableCreateDTO;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableUpdateDTO;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.repository.ContextVariableRepository;
import cn.tannn.cat.block.service.ContextVariableService;
import cn.tannn.jdevelops.exception.built.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 上下文变量Service实现类
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContextVariableServiceImpl implements ContextVariableService {

    private final ContextVariableRepository contextVariableRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContextVariable create(ContextVariableCreateDTO createDTO) {
        // 检查变量名是否已存在
        if (contextVariableRepository.existsByVarKey(createDTO.getVarKey())) {
            throw new BusinessException("变量名已存在: " + createDTO.getVarKey());
        }

        ContextVariable contextVariable = new ContextVariable();
        BeanUtils.copyProperties(createDTO, contextVariable);
        contextVariable.setCreateTime(LocalDateTime.now());
        contextVariable.setUpdateTime(LocalDateTime.now());

        // 设置默认值
        if (contextVariable.getVarType() == null) {
            contextVariable.setVarType(cn.tannn.cat.block.enums.VarType.TEXT);
        }
        if (contextVariable.getEnvironment() == null) {
            contextVariable.setEnvironment(Environment.DEFAULT);
        }
        if (contextVariable.getIsEncrypted() == null) {
            contextVariable.setIsEncrypted(false);
        }

        // TODO: 如果是加密类型或isEncrypted=true，需要加密varValue
        if (contextVariable.getIsEncrypted()) {
            // 实现加密逻辑
            log.info("需要加密变量: {}", contextVariable.getVarKey());
        }

        return contextVariableRepository.save(contextVariable);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ContextVariable update(ContextVariableUpdateDTO updateDTO) {
        ContextVariable contextVariable = contextVariableRepository.findById(updateDTO.getId().longValue())
                .orElseThrow(() -> new BusinessException("上下文变量不存在: " + updateDTO.getId()));

        // 检查变量名是否被其他记录使用
        if (updateDTO.getVarKey() != null && !updateDTO.getVarKey().equals(contextVariable.getVarKey())) {
            if (contextVariableRepository.existsByVarKey(updateDTO.getVarKey())) {
                throw new BusinessException("变量名已存在: " + updateDTO.getVarKey());
            }
        }

        // 更新字段
        if (updateDTO.getVarKey() != null) {
            contextVariable.setVarKey(updateDTO.getVarKey());
        }
        if (updateDTO.getVarValue() != null) {
            contextVariable.setVarValue(updateDTO.getVarValue());
            // TODO: 如果是加密类型，需要加密varValue
            if (contextVariable.getIsEncrypted()) {
                log.info("需要加密变量: {}", contextVariable.getVarKey());
            }
        }
        if (updateDTO.getVarType() != null) {
            contextVariable.setVarType(updateDTO.getVarType());
        }
        if (updateDTO.getGroupName() != null) {
            contextVariable.setGroupName(updateDTO.getGroupName());
        }
        if (updateDTO.getDescription() != null) {
            contextVariable.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getIsEncrypted() != null) {
            contextVariable.setIsEncrypted(updateDTO.getIsEncrypted());
        }
        if (updateDTO.getEnvironment() != null) {
            contextVariable.setEnvironment(updateDTO.getEnvironment());
        }
        contextVariable.setUpdateTime(LocalDateTime.now());

        return contextVariableRepository.save(contextVariable);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!contextVariableRepository.existsById(id.longValue())) {
            throw new BusinessException("上下文变量不存在: " + id);
        }
        contextVariableRepository.deleteById(id.longValue());
    }

    @Override
    public ContextVariable getById(Integer id) {
        return contextVariableRepository.findById(id.longValue())
                .orElseThrow(() -> new BusinessException("上下文变量不存在: " + id));
    }

    @Override
    public ContextVariable getByKey(String varKey) {
        return contextVariableRepository.findByVarKey(varKey)
                .orElseThrow(() -> new BusinessException("上下文变量不存在: " + varKey));
    }

    @Override
    public Page<ContextVariable> listPage(Pageable pageable) {
        return contextVariableRepository.findAll(pageable);
    }

    @Override
    public Page<ContextVariable> listByGroup(String groupName, Pageable pageable) {
        return contextVariableRepository.findByGroupName(groupName, pageable);
    }

    @Override
    public Page<ContextVariable> listByEnvironment(Environment environment, Pageable pageable) {
        return contextVariableRepository.findByEnvironment(environment, pageable);
    }

    @Override
    public Page<ContextVariable> listByGroupAndEnvironment(String groupName, Environment environment, Pageable pageable) {
        return contextVariableRepository.findByGroupNameAndEnvironment(groupName, environment, pageable);
    }

    @Override
    public Page<ContextVariable> search(String keyword, Pageable pageable) {
        return contextVariableRepository.searchByKeyword(keyword, pageable);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int importVariables(Map<String, String> variables, String groupName, Environment environment) {
        int count = 0;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            // 检查变量是否已存在
            if (contextVariableRepository.existsByVarKey(key)) {
                log.warn("变量已存在，跳过: {}", key);
                continue;
            }

            ContextVariable contextVariable = new ContextVariable();
            contextVariable.setVarKey(key);
            contextVariable.setVarValue(value);
            contextVariable.setGroupName(groupName);
            contextVariable.setEnvironment(environment != null ? environment : Environment.DEFAULT);
            contextVariable.setVarType(cn.tannn.cat.block.enums.VarType.TEXT);
            contextVariable.setIsEncrypted(false);
            contextVariable.setCreateTime(LocalDateTime.now());
            contextVariable.setUpdateTime(LocalDateTime.now());

            contextVariableRepository.save(contextVariable);
            count++;
        }
        return count;
    }

    @Override
    public Map<String, String> exportVariables(String groupName, Environment environment) {
        List<ContextVariable> variables;

        if (groupName != null && environment != null) {
            variables = contextVariableRepository.findByGroupNameAndEnvironment(groupName, environment);
        } else if (groupName != null) {
            variables = contextVariableRepository.findByGroupName(groupName);
        } else if (environment != null) {
            variables = contextVariableRepository.findByEnvironment(environment);
        } else {
            variables = contextVariableRepository.findAll();
        }

        Map<String, String> result = new HashMap<>();
        for (ContextVariable variable : variables) {
            // TODO: 如果是加密变量，需要决定是否导出脱敏值还是原值
            String value = variable.getVarValue();
            if (variable.getIsEncrypted()) {
                value = "***encrypted***";
            }
            result.put(variable.getVarKey(), value);
        }
        return result;
    }

    @Override
    public List<String> getAllGroupNames() {
        return contextVariableRepository.findAllDistinctGroupNames();
    }
}
