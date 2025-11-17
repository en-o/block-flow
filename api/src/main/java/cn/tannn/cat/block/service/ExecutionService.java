package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.execution.ExecutionLogPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowExecuteDTO;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 执行管理Service接口
 *
 * @author tnnn
 */
public interface ExecutionService {

    /**
     * 执行流程
     *
     * @param executeDTO 执行DTO
     * @return 执行记录
     */
    ExecutionLog execute(WorkflowExecuteDTO executeDTO);

    /**
     * 根据ID查询执行记录
     *
     * @param id 执行记录ID
     * @return 执行记录
     */
    ExecutionLog getById(Long id);


    /**
     * 分页查询执行历史（使用查询条件）
     *
     * @param where 分页参数和查询条件
     * @return 执行记录分页列表
     */
    Page<ExecutionLog> findPage(ExecutionLogPage where);

    /**
     * 获取执行日志
     *
     * @param id 执行记录ID
     * @return 执行日志
     */
    String getLogs(Long id);

    /**
     * 取消执行
     *
     * @param id 执行记录ID
     * @return 执行记录
     */
    ExecutionLog cancel(Long id);

    /**
     * 删除执行记录
     *
     * @param id 执行记录ID
     */
    void delete(Long id);

    /**
     * 获取流程的执行次数
     *
     * @param workflowId 流程ID
     * @return 执行次数
     */
    Long getExecutionCount(Long workflowId);

    /**
     * 获取流程的成功执行次数
     *
     * @param workflowId 流程ID
     * @return 成功执行次数
     */
    Long getSuccessExecutionCount(Long workflowId);

    /**
     * 获取流程的失败执行次数
     *
     * @param workflowId 流程ID
     * @return 失败执行次数
     */
    Long getFailedExecutionCount(Long workflowId);
}
