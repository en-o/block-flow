package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryCreateDTO;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryPage;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryUpdateDTO;
import cn.tannn.cat.block.entity.WorkflowCategory;
import cn.tannn.cat.block.repository.WorkflowCategoryRepository;
import cn.tannn.cat.block.service.WorkflowCategoryService;
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
 * 流程分类Service实现类
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowCategoryServiceImpl implements WorkflowCategoryService {

    private final WorkflowCategoryRepository workflowCategoryRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WorkflowCategory create(WorkflowCategoryCreateDTO createDTO) {
        // 检查code是否已存在
        if (workflowCategoryRepository.existsByCode(createDTO.getCode())) {
            throw new BusinessException("分类代码已存在: " + createDTO.getCode());
        }

        WorkflowCategory workflowCategory = new WorkflowCategory();
        BeanUtils.copyProperties(createDTO, workflowCategory);
        workflowCategory.setCreateTime(LocalDateTime.now());
        workflowCategory.setUpdateTime(LocalDateTime.now());

        if (workflowCategory.getSortOrder() == null) {
            workflowCategory.setSortOrder(0);
        }

        return workflowCategoryRepository.save(workflowCategory);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WorkflowCategory update(WorkflowCategoryUpdateDTO updateDTO) {
        WorkflowCategory workflowCategory = workflowCategoryRepository.findById(Long.valueOf(updateDTO.getId()))
                .orElseThrow(() -> new BusinessException("流程分类不存在: " + updateDTO.getId()));

        // 检查code是否被其他记录使用
        if (updateDTO.getCode() != null && !updateDTO.getCode().equals(workflowCategory.getCode())) {
            if (workflowCategoryRepository.existsByCode(updateDTO.getCode())) {
                throw new BusinessException("分类代码已存在: " + updateDTO.getCode());
            }
        }

        if (updateDTO.getCode() != null) {
            workflowCategory.setCode(updateDTO.getCode());
        }
        if (updateDTO.getName() != null) {
            workflowCategory.setName(updateDTO.getName());
        }
        if (updateDTO.getSortOrder() != null) {
            workflowCategory.setSortOrder(updateDTO.getSortOrder());
        }
        workflowCategory.setUpdateTime(LocalDateTime.now());

        return workflowCategoryRepository.save(workflowCategory);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!workflowCategoryRepository.existsById(Long.valueOf(id))) {
            throw new BusinessException("流程分类不存在: " + id);
        }
        workflowCategoryRepository.deleteById(Long.valueOf(id));
    }

    @Override
    public WorkflowCategory getById(Integer id) {
        return workflowCategoryRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new BusinessException("流程分类不存在: " + id));
    }

    @Override
    public WorkflowCategory getByCode(String code) {
        return workflowCategoryRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("流程分类不存在: " + code));
    }

    @Override
    public List<WorkflowCategory> listAll() {
        return workflowCategoryRepository.findAllByOrderBySortOrderAsc();
    }

    @Override
    public Page<WorkflowCategory> findPage(WorkflowCategoryPage where) {
        Specification<WorkflowCategory> select = EnhanceSpecification.beanWhere(where);
        return workflowCategoryRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public List<WorkflowCategory> searchByName(String name) {
        return workflowCategoryRepository.findByNameContaining(name);
    }

}
