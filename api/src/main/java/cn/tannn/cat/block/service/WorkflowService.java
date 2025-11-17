package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 流程管理Service接口
 *
 * @author tnnn
 */
public interface WorkflowService {

    /**
     * 创建流程
     *
     * @param createDTO 创建DTO
     * @return 流程
     */
    Workflow create(WorkflowCreateDTO createDTO);

    /**
     * 更新流程
     *
     * @param updateDTO 更新DTO
     * @return 流程
     */
    Workflow update(WorkflowUpdateDTO updateDTO);

    /**
     * 删除流程
     *
     * @param id 流程ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询流程
     *
     * @param id 流程ID
     * @return 流程
     */
    Workflow getById(Integer id);
    /**
     * 分页查询流程（使用查询条件）
     *
     * @param where 分页参数和查询条件
     * @return 流程分页列表
     */
    Page<Workflow> findPage(WorkflowPage where);


    /**
     * 克隆流程
     *
     * @param id 流程ID
     * @return 新流程
     */
    Workflow clone(Integer id);

    /**
     * 获取所有分类
     *
     * @return 分类列表
     */
    List<String> getAllCategories();
}
