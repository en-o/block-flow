package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.repository.WorkflowRepository;
import cn.tannn.cat.block.service.WorkflowService;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
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
    public Workflow create(WorkflowCreateDTO createDTO, String username) {
        Workflow workflow = new Workflow();
        BeanUtils.copyProperties(createDTO, workflow);
        workflow.setAuthorUsername(username);
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
        if (updateDTO.getFlowDefinition() != null) {
            workflow.setFlowDefinition(updateDTO.getFlowDefinition());
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
        if (updateDTO.getIsPublic() != null) {
            workflow.setIsPublic(updateDTO.getIsPublic());
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
    public Page<Workflow> findPage(WorkflowPage where, String username) {
        Specification<Workflow> select = EnhanceSpecification.beanWhere(where,x -> {
            x.eq(StringUtils.isNotBlank(username),"authorUsername",username);
        });
        return workflowRepository.findAll(select, where.getPage().pageable());
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
