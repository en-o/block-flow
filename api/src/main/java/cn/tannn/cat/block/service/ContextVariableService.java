package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableCreateDTO;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariablePage;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableUpdateDTO;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.enums.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * 上下文变量Service接口
 *
 * @author tnnn
 */
public interface ContextVariableService {

    /**
     * 添加变量
     *
     * @param createDTO 创建DTO
     * @return 上下文变量
     */
    ContextVariable create(ContextVariableCreateDTO createDTO);

    /**
     * 更新变量
     *
     * @param updateDTO 更新DTO
     * @return 上下文变量
     */
    ContextVariable update(ContextVariableUpdateDTO updateDTO);

    /**
     * 删除变量
     *
     * @param id 变量ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询变量
     *
     * @param id 变量ID
     * @return 上下文变量
     */
    ContextVariable getById(Integer id);

    /**
     * 根据变量名查询变量
     *
     * @param varKey 变量名
     * @return 上下文变量
     */
    ContextVariable getByKey(String varKey);

    /**
     * 分页查询变量
     *
     * @param where 分页参数和查询条件
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findPage(ContextVariablePage where);


    /**
     * 批量导入变量
     *
     * @param variables 变量Map
     * @param groupName 分组名称
     * @param environment 环境
     * @return 导入数量
     */
    int importVariables(Map<String, String> variables, String groupName, Environment environment);

    /**
     * 批量导出变量
     *
     * @param groupName   分组名称（可选）
     * @param environment 环境（可选）
     * @return 变量Map
     */
    Map<String, String> exportVariables(String groupName, Environment environment);

    /**
     * 获取所有分组名称
     *
     * @return 分组名称列表
     */
    List<String> getAllGroupNames();
}
