package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.blocktype.BlockTypeCreateDTO;
import cn.tannn.cat.block.controller.dto.blocktype.BlockTypePage;
import cn.tannn.cat.block.controller.dto.blocktype.BlockTypeUpdateDTO;
import cn.tannn.cat.block.entity.BlockType;
import cn.tannn.cat.block.repository.BlockTypeRepository;
import cn.tannn.cat.block.service.BlockTypeService;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 块类型Service实现类
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockTypeServiceImpl implements BlockTypeService {

    private final BlockTypeRepository blockTypeRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BlockType create(BlockTypeCreateDTO createDTO) {
        // 检查code是否已存在
        if (blockTypeRepository.existsByCode(createDTO.getCode())) {
            throw new BusinessException("类型代码已存在: " + createDTO.getCode());
        }

        BlockType blockType = new BlockType();
        BeanUtils.copyProperties(createDTO, blockType);
        blockType.setCreateTime(LocalDateTime.now());
        blockType.setUpdateTime(LocalDateTime.now());

        if (blockType.getSortOrder() == null) {
            blockType.setSortOrder(0);
        }

        return blockTypeRepository.save(blockType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BlockType update(BlockTypeUpdateDTO updateDTO) {
        BlockType blockType = blockTypeRepository.findById(updateDTO.getId())
                .orElseThrow(() -> new BusinessException("块类型不存在: " + updateDTO.getId()));

        // 检查code是否被其他记录使用
        if (updateDTO.getCode() != null && !updateDTO.getCode().equals(blockType.getCode())) {
            if (blockTypeRepository.existsByCode(updateDTO.getCode())) {
                throw new BusinessException("类型代码已存在: " + updateDTO.getCode());
            }
        }

        if (updateDTO.getCode() != null) {
            blockType.setCode(updateDTO.getCode());
        }
        if (updateDTO.getName() != null) {
            blockType.setName(updateDTO.getName());
        }
        if (updateDTO.getSortOrder() != null) {
            blockType.setSortOrder(updateDTO.getSortOrder());
        }
        blockType.setUpdateTime(LocalDateTime.now());

        return blockTypeRepository.save(blockType);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!blockTypeRepository.existsById(id)) {
            throw new BusinessException("块类型不存在: " + id);
        }
        blockTypeRepository.deleteById(id);
    }

    @Override
    public BlockType getById(Integer id) {
        return blockTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("块类型不存在: " + id));
    }

    @Override
    public BlockType getByCode(String code) {
        return blockTypeRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("块类型不存在: " + code));
    }

    @Override
    public List<BlockType> listAll() {
        return blockTypeRepository.findAllByOrderBySortOrderAsc();
    }

    @Override
    public Page<BlockType> findPage(BlockTypePage where) {
        Specification<BlockType> select = EnhanceSpecification.beanWhere(where);
        return blockTypeRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public List<BlockType> searchByName(String name) {
        return blockTypeRepository.findByNameContaining(name);
    }

}
