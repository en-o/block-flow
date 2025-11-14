package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.repository.WorkflowRepository;
import cn.tannn.cat.block.service.WorkflowService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 流程管理Service实现
 *
 * @author tnnn
 */
@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {

    private final WorkflowRepository workflowRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Workflow create(WorkflowCreateDTO createDTO) {
        Workflow workflow = new Workflow();
        BeanUtils.copyProperties(createDTO, workflow);
        return workflowRepository.save(workflow);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Workflow update(WorkflowUpdateDTO updateDTO) {
        Workflow workflow = getById(updateDTO.getId());

        if (updateDTO.getName() != null) {
            workflow.setName(updateDTO.getName());
        }
        if (updateDTO.getDescription() != null) {
            workflow.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getBlocklyXml() != null) {
            workflow.setBlocklyXml(updateDTO.getBlocklyXml());
        }
        if (updateDTO.getBlocklyJson() != null) {
            workflow.setBlocklyJson(updateDTO.getBlocklyJson());
        }
        if (updateDTO.getIsTemplate() != null) {
            workflow.setIsTemplate(updateDTO.getIsTemplate());
        }
        if (updateDTO.getCategory() != null) {
            workflow.setCategory(updateDTO.getCategory());
        }
        if (updateDTO.getTags() != null) {
            workflow.setTags(updateDTO.getTags());
        }
        if (updateDTO.getIsActive() != null) {
            workflow.setIsActive(updateDTO.getIsActive());
        }

        return workflowRepository.save(workflow);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!workflowRepository.existsById(id)) {
            throw new ServiceException(500,"流程不存在");
        }
        workflowRepository.deleteById(id);
    }

    @Override
    public Workflow getById(Integer id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ServiceException(500,"流程不存在"));
    }

    @Override
    public Page<Workflow> listPage(Pageable pageable) {
        return workflowRepository.findAll(pageable);
    }

    @Override
    public Page<Workflow> listByAuthor(String authorUsername, Pageable pageable) {
        return workflowRepository.findByAuthorUsername(authorUsername, pageable);
    }

    @Override
    public Page<Workflow> listByCategory(String category, Pageable pageable) {
        return workflowRepository.findByCategory(category, pageable);
    }

    @Override
    public Page<Workflow> listTemplates(Pageable pageable) {
        return workflowRepository.findByIsTemplate(true, pageable);
    }

    @Override
    public Page<Workflow> listByActive(Boolean isActive, Pageable pageable) {
        return workflowRepository.findByIsActive(isActive, pageable);
    }

    @Override
    public Page<Workflow> search(String keyword, Pageable pageable) {
        return workflowRepository.searchByKeyword(keyword, pageable);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Workflow clone(Integer id) {
        Workflow original = getById(id);
        Workflow cloned = new Workflow();

        BeanUtils.copyProperties(original, cloned, "id", "createTime", "updateTime");
        cloned.setName(original.getName() + " (副本)");

        return workflowRepository.save(cloned);
    }

    @Override
    public List<String> getAllCategories() {
        return workflowRepository.findDistinctCategories();
    }
}
