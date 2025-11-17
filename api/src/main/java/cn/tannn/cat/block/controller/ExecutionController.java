package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.execution.ExecutionLogPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowExecuteDTO;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.service.ExecutionService;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 执行管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/api/executions")
@RequiredArgsConstructor
@Tag(name = "执行管理", description = "流程执行的管理接口")
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping
    @Operation(summary = "执行流程", description = "执行指定的流程")
    public ResultVO<ExecutionLog> execute(@RequestBody WorkflowExecuteDTO executeDTO) {
        return ResultVO.success(executionService.execute(executeDTO));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取执行详情", description = "根据ID获取执行记录详情")
    public ResultVO<ExecutionLog> getById(@Parameter(description = "执行记录ID") @PathVariable Long id) {
        return ResultVO.success(executionService.getById(id));
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询执行历史", description = "分页查询所有执行记录")
    public ResultPageVO<ExecutionLog, JpaPageResult<ExecutionLog>> page(
            @RequestBody @Valid ExecutionLogPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(executionService.findPage(where)));
    }


    @GetMapping("/{id}/logs")
    @Operation(summary = "获取执行日志", description = "获取指定执行记录的日志")
    public ResultVO<String> getLogs(@Parameter(description = "执行记录ID") @PathVariable Long id) {
        return ResultVO.success(executionService.getLogs(id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "取消执行", description = "取消正在运行的执行")
    public ResultVO<ExecutionLog> cancel(@Parameter(description = "执行记录ID") @PathVariable Long id) {
        return ResultVO.success(executionService.cancel(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除执行记录", description = "根据ID删除执行记录")
    public ResultVO<Void> delete(@Parameter(description = "执行记录ID") @PathVariable Long id) {
        executionService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/workflow/{workflowId}/count")
    @Operation(summary = "获取流程执行次数", description = "获取指定流程的总执行次数")
    public ResultVO<Long> getExecutionCount(@Parameter(description = "流程ID") @PathVariable Long workflowId) {
        return ResultVO.success(executionService.getExecutionCount(workflowId));
    }

    @GetMapping("/workflow/{workflowId}/success-count")
    @Operation(summary = "获取流程成功次数", description = "获取指定流程的成功执行次数")
    public ResultVO<Long> getSuccessCount(@Parameter(description = "流程ID") @PathVariable Long workflowId) {
        return ResultVO.success(executionService.getSuccessExecutionCount(workflowId));
    }

    @GetMapping("/workflow/{workflowId}/failed-count")
    @Operation(summary = "获取流程失败次数", description = "获取指定流程的失败执行次数")
    public ResultVO<Long> getFailedCount(@Parameter(description = "流程ID") @PathVariable Long workflowId) {
        return ResultVO.success(executionService.getFailedExecutionCount(workflowId));
    }
}
