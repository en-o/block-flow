package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockPage;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import cn.tannn.cat.block.repository.BlockRepository;
import cn.tannn.cat.block.service.BlockService;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Block create(BlockCreateDTO createDTO) {
        // 检查块名称是否已存在
        if (blockRepository.existsByName(createDTO.getName())) {
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

        return blockRepository.save(block);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Block update(BlockUpdateDTO updateDTO) {
        Block block = blockRepository.findById(updateDTO.getId())
                .orElseThrow(() -> new BusinessException("块不存在: " + updateDTO.getId()));

        // 检查块名称是否被其他记录使用
        if (updateDTO.getName() != null && !updateDTO.getName().equals(block.getName())) {
            if (blockRepository.existsByName(updateDTO.getName())) {
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
        Specification<Block> select = EnhanceSpecification.beanWhere(where);
        return blockRepository.findAll(select, where.getPage().pageable());
    }


    @Override
    @Transactional(rollbackFor = Exception.class)
    public String test(Integer id, BlockTestDTO testDTO) {
        Block block = getById(id);

        // TODO: 实现块测试逻辑，执行Python脚本
        // 这里需要集成Python执行引擎
        log.info("测试块: {}, 输入参数: {}", block.getName(), testDTO.getInputs());

        return "测试执行成功（待实现Python执行引擎）";
    }

    @Override
    public Long getUsageCount(Integer id) {
        Block block = getById(id);
        // TODO: 从ExecutionLog表中统计此块的使用次数
        return 0L;
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
}
