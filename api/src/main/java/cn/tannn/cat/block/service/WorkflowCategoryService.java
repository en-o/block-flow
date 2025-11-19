package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryCreateDTO;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryPage;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryUpdateDTO;
import cn.tannn.cat.block.entity.WorkflowCategory;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 流程分类Service接口
 *
 * @author tnnn
 */
public interface WorkflowCategoryService {

    /**
     * 创建流程分类
     *
     * @param createDTO 创建DTO
     * @return 流程分类
     */
    WorkflowCategory create(WorkflowCategoryCreateDTO createDTO);

    /**
     * 更新流程分类
     *
     * @param updateDTO 更新DTO
     * @return 流程分类
     */
    WorkflowCategory update(WorkflowCategoryUpdateDTO updateDTO);

    /**
     * 删除流程分类
     *
     * @param id 流程分类ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询流程分类
     *
     * @param id 流程分类ID
     * @return 流程分类
     */
    WorkflowCategory getById(Integer id);

    /**
     * 根据code查询流程分类
     *
     * @param code 分类代码
     * @return 流程分类
     */
    WorkflowCategory getByCode(String code);

    /**
     * 查询所有流程分类（按排序）
     *
     * @return 流程分类列表
     */
    List<WorkflowCategory> listAll();

    /**
     * 分页查询流程分类
     *
     * @param where 分页参数
     * @return 流程分类分页列表
     */
    Page<WorkflowCategory> findPage(WorkflowCategoryPage where);

    /**
     * 根据名称模糊查询
     *
     * @param name 分类名称
     * @return 流程分类列表
     */
    List<WorkflowCategory> searchByName(String name);
}
