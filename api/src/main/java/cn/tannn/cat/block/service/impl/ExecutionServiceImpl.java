package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.execution.ExecutionLogPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowExecuteDTO;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.enums.ExecutionStatus;
import cn.tannn.cat.block.enums.TriggerType;
import cn.tannn.cat.block.repository.ExecutionLogRepository;
import cn.tannn.cat.block.repository.WorkflowRepository;
import cn.tannn.cat.block.service.ExecutionService;
import cn.tannn.cat.block.service.WorkflowService;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * 执行管理Service实现
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionServiceImpl implements ExecutionService {

    private final ExecutionLogRepository executionLogRepository;
    private final WorkflowRepository workflowRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExecutionLog execute(WorkflowExecuteDTO executeDTO) {
        // 验证流程是否存在
        Workflow workflow = workflowRepository.findById(executeDTO.getWorkflowId())
                .orElseThrow(() -> new BusinessException("请选择正确的流程"));

        // 创建执行记录
        ExecutionLog executionLog = new ExecutionLog();
        executionLog.setWorkflowId(executeDTO.getWorkflowId());
        executionLog.setWorkflowName(workflow.getName());
        executionLog.setExecutorUsername(executeDTO.getExecutorUsername());
        executionLog.setStatus(ExecutionStatus.RUNNING);
        executionLog.setTriggerType(TriggerType.MANUAL);
        executionLog.setInputParams(executeDTO.getInputParams());
        executionLog.setStartTime(LocalDateTime.now());

        // 保存执行记录
        executionLog = executionLogRepository.save(executionLog);

        // TODO: 实际执行流程的逻辑需要在这里实现
        // 这里暂时只创建记录,实际执行逻辑需要根据Blockly流程定义来解析和执行
        log.info("流程执行已启动, executionId: {}, workflowId: {}, workflowName: {}",
                executionLog.getId(), workflow.getId(), workflow.getName());

        return executionLog;
    }

    @Override
    public ExecutionLog getById(Long id) {
        return executionLogRepository.findById(id)
                .orElseThrow(() -> new ServiceException(500,"执行记录不存在"));
    }


    @Override
    public Page<ExecutionLog> findPage(ExecutionLogPage where) {
        Specification<ExecutionLog> select = EnhanceSpecification.beanWhere(where);
        return executionLogRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public String getLogs(Long id) {
        ExecutionLog executionLog = getById(id);
        return executionLog.getLogs();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExecutionLog cancel(Long id) {
        ExecutionLog executionLog = getById(id);

        if (executionLog.getStatus() != ExecutionStatus.RUNNING) {
            throw new ServiceException(500,"只能取消正在运行的执行");
        }

        executionLog.setStatus(ExecutionStatus.CANCELLED);
        executionLog.setEndTime(LocalDateTime.now());

        // 计算执行时长
        if (executionLog.getStartTime() != null && executionLog.getEndTime() != null) {
            Duration duration = Duration.between(executionLog.getStartTime(), executionLog.getEndTime());
            executionLog.setDuration((int) duration.getSeconds());
        }

        // TODO: 实际取消执行的逻辑需要在这里实现
        log.info("执行已取消, executionId: {}, workflowId: {}", id, executionLog.getWorkflowId());

        return executionLogRepository.save(executionLog);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (!executionLogRepository.existsById(id)) {
            throw new ServiceException(500,"执行记录不存在");
        }
        executionLogRepository.deleteById(id);
    }

    @Override
    public Long getExecutionCount(Long workflowId) {
        return executionLogRepository.countByWorkflowId(workflowId);
    }

    @Override
    public Long getSuccessExecutionCount(Long workflowId) {
        return executionLogRepository.countSuccessByWorkflowId(workflowId);
    }

    @Override
    public Long getFailedExecutionCount(Long workflowId) {
        return executionLogRepository.countFailedByWorkflowId(workflowId);
    }
}
