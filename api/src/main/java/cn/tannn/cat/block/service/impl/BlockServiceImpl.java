package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockPage;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.repository.BlockRepository;
import cn.tannn.cat.block.repository.ContextVariableRepository;
import cn.tannn.cat.block.service.BlockService;
import cn.tannn.cat.block.service.PythonScriptExecutor;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSON;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 块Service实现类
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockServiceImpl implements BlockService {

    private final BlockRepository blockRepository;
    private final PythonScriptExecutor pythonScriptExecutor;
    private final ContextVariableRepository contextVariableRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Block create(BlockCreateDTO createDTO, String username) {
        // 检查块名称是否已存在
        if (blockRepository.existsByNameAndAuthorUsername(createDTO.getName(), username)) {
            throw new BusinessException("块名称已存在: " + createDTO.getName());
        }

        Block block = new Block();
        BeanUtils.copyProperties(createDTO, block);
        block.setCreateTime(LocalDateTime.now());
        block.setUpdateTime(LocalDateTime.now());

        // 设置默认值
        if (block.getColor() == null || block.getColor().isEmpty()) {
            block.setColor("#5C7CFA");
        }
        if (block.getIsPublic() == null) {
            block.setIsPublic(true);
        }
        block.setAuthorUsername(username);
        return blockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Block update(BlockUpdateDTO updateDTO, String username) {
        Block block = blockRepository.findById(updateDTO.getId())
                .orElseThrow(() -> new BusinessException("块不存在: " + updateDTO.getId()));

        // 检查块名称是否被其他记录使用
        if (updateDTO.getName() != null && !updateDTO.getName().equals(block.getName())) {
            if (blockRepository.existsByNameAndAuthorUsername(updateDTO.getName(), username)) {
                throw new BusinessException("块名称已存在: " + updateDTO.getName());
            }
        }

        // 更新字段
        if (updateDTO.getName() != null) {
            block.setName(updateDTO.getName());
        }
        if (updateDTO.getTypeCode() != null) {
            block.setTypeCode(updateDTO.getTypeCode());
        }
        if (updateDTO.getDescription() != null) {
            block.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getColor() != null) {
            block.setColor(updateDTO.getColor());
        }
        if (updateDTO.getScript() != null) {
            block.setScript(updateDTO.getScript());
        }
        if (updateDTO.getPythonEnvId() != null) {
            block.setPythonEnvId(updateDTO.getPythonEnvId());
        }
        if (updateDTO.getInputs() != null) {
            block.setInputs(updateDTO.getInputs());
        }
        if (updateDTO.getOutputs() != null) {
            block.setOutputs(updateDTO.getOutputs());
        }
        if (updateDTO.getIsPublic() != null) {
            block.setIsPublic(updateDTO.getIsPublic());
        }
        if (updateDTO.getTags() != null) {
            block.setTags(updateDTO.getTags());
        }
        block.setUpdateTime(LocalDateTime.now());

        return blockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!blockRepository.existsById(id)) {
            throw new BusinessException("块不存在: " + id);
        }
        blockRepository.deleteById(id);
    }

    @Override
    public Block getById(Integer id) {
        return blockRepository.findById(id)
                .orElseThrow(() -> new BusinessException("块不存在: " + id));
    }

    @Override
    public Page<Block> findPage(BlockPage where) {
        Specification<Block> baseSpec = EnhanceSpecification.beanWhere(where);

        // 如果有标签查询，添加标签模糊查询条件
        if (StringUtils.hasText(where.getTag())) {
            Specification<Block> tagSpec = (root, query, criteriaBuilder) -> {
                // 使用 JSON_CONTAINS 或 LIKE 查询 JSON 数组
                // 由于 JPA 对 JSON 字段的支持有限，这里使用 LIKE 进行模糊匹配
                String tagPattern = "%" + where.getTag() + "%";
                return criteriaBuilder.like(
                        criteriaBuilder.function("JSON_UNQUOTE", String.class, root.get("tags")),
                        tagPattern
                );
            };
            baseSpec = baseSpec.and(tagSpec);
        }

        return blockRepository.findAll(baseSpec, where.getPage().pageable());
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public String test(Integer id, BlockTestDTO testDTO) {
        Block block = getById(id);

        // 验证脚本是否存在
        if (block.getScript() == null || block.getScript().isEmpty()) {
            throw new BusinessException("块脚本为空，无法测试");
        }

        log.info("开始测试块: {}, 输入参数: {}", block.getName(), testDTO.getInputs());

        try {
            // 合并上下文变量到 inputs
            Map<String, Object> mergedInputs = new HashMap<>();
            if (testDTO.getInputs() != null) {
                mergedInputs.putAll(testDTO.getInputs());
            }

            // 获取所有上下文变量，并以 ctx.变量名 的格式添加
            List<ContextVariable> contextVariables = contextVariableRepository.findAll();
            for (ContextVariable cv : contextVariables) {
                String key = "ctx." + cv.getVarKey();
                mergedInputs.put(key, cv.getVarValue());
                log.debug("注入上下文变量: {} = {}", key, cv.getVarValue());
            }

            log.info("合并后的输入参数数量: {}, 其中上下文变量: {}",
                    mergedInputs.size(), contextVariables.size());

            // 执行Python脚本
            PythonScriptExecutor.ExecutionResult result = pythonScriptExecutor.execute(
                    block.getPythonEnvId(),
                    block.getScript(),
                    mergedInputs
            );

            // 构建返回结果
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", result.isSuccess());
            response.put("executionTime", result.getExecutionTime());

            if (result.isSuccess()) {
                // 成功执行
                if (result.getJsonOutput() != null) {
                    response.put("output", result.getJsonOutput());
                } else if (result.getOutput() != null && !result.getOutput().isEmpty()) {
                    response.put("output", result.getOutput());
                } else {
                    response.put("output", Map.of("message", "执行成功，无输出"));
                }

                if (result.getError() != null && !result.getError().isEmpty()) {
                    response.put("warnings", result.getError());
                }

                log.info("块测试成功: {}, 耗时: {}ms", block.getName(), result.getExecutionTime());
            } else {
                // 执行失败
                response.put("errorMessage", result.getErrorMessage());
                if (result.getOutput() != null && !result.getOutput().isEmpty()) {
                    response.put("stdout", result.getOutput());
                }
                if (result.getError() != null && !result.getError().isEmpty()) {
                    response.put("stderr", result.getError());
                }
                response.put("exitCode", result.getExitCode());

                log.error("块测试失败: {}, 错误: {}", block.getName(), result.getErrorMessage());
            }

            return JSON.toJSONString(response);

        } catch (Exception e) {
            log.error("块测试异常: {}", block.getName(), e);
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("errorMessage", "测试执行异常: " + e.getMessage());
            return JSON.toJSONString(errorResponse);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Block clone(Integer id) {
        Block original = getById(id);

        Block cloned = new Block();
        BeanUtils.copyProperties(original, cloned);
        cloned.setId(null);
        cloned.setName(original.getName() + "_copy");
        cloned.setCreateTime(LocalDateTime.now());
        cloned.setUpdateTime(LocalDateTime.now());

        return blockRepository.save(cloned);
    }

    @Override
    public Map<String, Long> getTagsStatistics() {
        // 获取所有块
        List<Block> allBlocks = blockRepository.findAll();

        // 统计标签使用次数
        return allBlocks.stream()
                .filter(block -> block.getTags() != null && !block.getTags().isEmpty())
                .flatMap(block -> block.getTags().stream())
                .collect(Collectors.groupingBy(
                        tag -> tag,
                        Collectors.counting()
                ));
    }
}
