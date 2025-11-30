package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockCreateDTO;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockPage;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockUpdateDTO;
import cn.tannn.cat.block.entity.BlocklyBlock;
import cn.tannn.cat.block.repository.BlocklyBlockRepository;
import cn.tannn.cat.block.service.BlocklyBlockService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONException;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Blockly块Service实现
 *
 * @author tnnn
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BlocklyBlockServiceImpl implements BlocklyBlockService {

    private final BlocklyBlockRepository blocklyBlockRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BlocklyBlock create(BlocklyBlockCreateDTO createDTO) {
        // 验证类型是否已存在
        if (blocklyBlockRepository.existsByType(createDTO.getType())) {
            throw new ServiceException(500, "块类型已存在: " + createDTO.getType());
        }

        // 验证块定义的合法性
        String validationError = validateBlockDefinition(createDTO.getDefinition(), createDTO.getPythonGenerator());
        if (validationError != null) {
            throw new ServiceException(400, validationError);
        }

        BlocklyBlock block = new BlocklyBlock();
        BeanUtils.copyProperties(createDTO, block);

        // 设置默认值
        if (block.getEnabled() == null) {
            block.setEnabled(true);
        }
        if (block.getSortOrder() == null) {
            block.setSortOrder(0);
        }
        if (block.getIsSystem() == null) {
            block.setIsSystem(false);
        }
        if (block.getVersion() == null) {
            block.setVersion(1);
        }

        return blocklyBlockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BlocklyBlock update(BlocklyBlockUpdateDTO updateDTO) {
        BlocklyBlock block = getById(updateDTO.getId());

        // 检查类型是否与其他块冲突
        if (updateDTO.getType() != null && !updateDTO.getType().equals(block.getType())) {
            if (blocklyBlockRepository.existsByType(updateDTO.getType())) {
                throw new ServiceException(500, "块类型已存在: " + updateDTO.getType());
            }
            block.setType(updateDTO.getType());
        }

        // 更新其他字段
        if (updateDTO.getName() != null) {
            block.setName(updateDTO.getName());
        }
        if (updateDTO.getCategory() != null) {
            block.setCategory(updateDTO.getCategory());
        }
        if (updateDTO.getColor() != null) {
            block.setColor(updateDTO.getColor());
        }
        if (updateDTO.getDefinition() != null) {
            // 验证新定义的合法性
            String validationError = validateBlockDefinition(
                updateDTO.getDefinition(),
                updateDTO.getPythonGenerator() != null ? updateDTO.getPythonGenerator() : block.getPythonGenerator()
            );
            if (validationError != null) {
                throw new ServiceException(400, validationError);
            }
            block.setDefinition(updateDTO.getDefinition());
            // 定义变更时版本号+1
            block.setVersion(block.getVersion() + 1);
        }
        if (updateDTO.getPythonGenerator() != null) {
            block.setPythonGenerator(updateDTO.getPythonGenerator());
        }
        if (updateDTO.getDescription() != null) {
            block.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getExample() != null) {
            block.setExample(updateDTO.getExample());
        }
        if (updateDTO.getEnabled() != null) {
            block.setEnabled(updateDTO.getEnabled());
        }
        if (updateDTO.getSortOrder() != null) {
            block.setSortOrder(updateDTO.getSortOrder());
        }

        return blocklyBlockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        BlocklyBlock block = getById(id);

        // 系统预置块不允许删除
        if (Boolean.TRUE.equals(block.getIsSystem())) {
            throw new ServiceException(500, "系统预置块不允许删除，可以禁用");
        }

        blocklyBlockRepository.deleteById(id);
    }

    @Override
    public BlocklyBlock getById(Integer id) {
        return blocklyBlockRepository.findById(id)
                .orElseThrow(() -> new ServiceException(500, "Blockly块不存在"));
    }

    @Override
    public BlocklyBlock getByType(String type) {
        return blocklyBlockRepository.findByType(type)
                .orElseThrow(() -> new ServiceException(500, "Blockly块不存在: " + type));
    }

    @Override
    public Page<BlocklyBlock> findPage(BlocklyBlockPage where) {
        Specification<BlocklyBlock> select = EnhanceSpecification.beanWhere(where);
        return blocklyBlockRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public List<BlocklyBlock> listEnabled() {
        return blocklyBlockRepository.findByEnabledOrderByCategoryAscSortOrderAsc(true);
    }

    @Override
    public List<String> listCategories() {
        return blocklyBlockRepository.findAllCategories();
    }

    @Override
    public List<BlocklyBlock> listByCategory(String category) {
        return blocklyBlockRepository.findByCategoryAndEnabledOrderBySortOrderAsc(category, true);
    }

    @Override
    public Map<String, List<BlocklyBlock>> getToolboxConfig() {
        List<BlocklyBlock> enabledBlocks = listEnabled();

        // 按分类分组
        return enabledBlocks.stream()
                .collect(Collectors.groupingBy(
                        BlocklyBlock::getCategory,
                        LinkedHashMap::new,  // 保持顺序
                        Collectors.toList()
                ));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BlocklyBlock toggleEnabled(Integer id, Boolean enabled) {
        BlocklyBlock block = getById(id);
        block.setEnabled(enabled);
        return blocklyBlockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int batchImport(List<BlocklyBlockCreateDTO> blocks) {
        int successCount = 0;

        for (BlocklyBlockCreateDTO createDTO : blocks) {
            try {
                // 检查是否已存在
                if (blocklyBlockRepository.existsByType(createDTO.getType())) {
                    log.warn("块类型已存在，跳过: {}", createDTO.getType());
                    continue;
                }

                create(createDTO);
                successCount++;
            } catch (Exception e) {
                log.error("导入块失败: {}", createDTO.getType(), e);
            }
        }

        return successCount;
    }

    @Override
    public String validateBlockDefinition(String definition, String pythonGenerator) {
        // 1. 验证definition是否为合法的JSON
        if (definition == null || definition.trim().isEmpty()) {
            return "块定义不能为空";
        }

        try {
            JSONObject defJson = JSON.parseObject(definition);

            // 2. 验证必需字段
            if (!defJson.containsKey("type")) {
                return "块定义缺少必需字段: type";
            }

            // 3. 验证是否包含message或message0
            if (!defJson.containsKey("message0") && !defJson.containsKey("message")) {
                return "块定义缺少显示文本: message0 或 message";
            }

            // 4. 如果有args，验证其格式
            if (defJson.containsKey("args0")) {
                Object args = defJson.get("args0");
                if (!(args instanceof List)) {
                    return "args0必须是数组";
                }
            }

            // 5. 验证颜色字段（如果存在）
            if (defJson.containsKey("colour")) {
                Object colour = defJson.get("colour");
                if (!(colour instanceof Number) && !(colour instanceof String)) {
                    return "colour字段格式错误";
                }
            }

        } catch (JSONException e) {
            return "块定义不是合法的JSON格式: " + e.getMessage();
        }

        // 6. 验证Python生成器
        if (pythonGenerator == null || pythonGenerator.trim().isEmpty()) {
            return "Python代码生成器不能为空";
        }

        // 7. 基本语法检查（检查是否包含基本的return语句）
        if (!pythonGenerator.contains("return")) {
            return "Python生成器必须包含return语句";
        }

        return null; // 验证通过
    }
}
