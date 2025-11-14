package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
     * 分页查询流程
     *
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> listPage(Pageable pageable);

    /**
     * 根据创建者查询流程
     *
     * @param authorUsername 创建者登录名
     * @param pageable       分页参数
     * @return 流程分页列表
     */
    Page<Workflow> listByAuthor(String authorUsername, Pageable pageable);

    /**
     * 根据分类查询流程
     *
     * @param category 流程分类
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> listByCategory(String category, Pageable pageable);

    /**
     * 查询模板流程
     *
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> listTemplates(Pageable pageable);

    /**
     * 根据启用状态查询流程
     *
     * @param isActive 是否启用
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> listByActive(Boolean isActive, Pageable pageable);

    /**
     * 搜索流程（名称或描述包含关键字）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> search(String keyword, Pageable pageable);

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
