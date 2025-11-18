package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.service.WorkflowService;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 流程管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/workflows")
@RequiredArgsConstructor
@Tag(name = "流程管理", description = "流程的增删改查接口")
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping
    @Operation(summary = "创建流程", description = "创建新的流程")
    public ResultVO<Workflow> create(@RequestBody WorkflowCreateDTO createDTO) {
        return ResultVO.success(workflowService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新流程", description = "更新流程信息")
    public ResultVO<Workflow> update(@RequestBody WorkflowUpdateDTO updateDTO) {
        return ResultVO.success(workflowService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除流程", description = "根据ID删除流程")
    public ResultVO<Void> delete(@Parameter(description = "流程ID") @PathVariable Integer id) {
        workflowService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取流程详情", description = "根据ID获取流程详情")
    public ResultVO<Workflow> getById(@Parameter(description = "流程ID") @PathVariable Integer id) {
        return ResultVO.success(workflowService.getById(id));
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询流程", description = "分页查询流程列表")
    public ResultPageVO<Workflow, JpaPageResult<Workflow>> page(@RequestBody @Valid WorkflowPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(workflowService.findPage(where)));
    }


    @PostMapping("/{id}/clone")
    @Operation(summary = "克隆流程", description = "复制一个现有的流程")
    public ResultVO<Workflow> clone(@Parameter(description = "流程ID") @PathVariable Integer id) {
        return ResultVO.success(workflowService.clone(id));
    }

    @GetMapping("/categories")
    @Operation(summary = "获取所有分类", description = "获取所有流程分类列表")
    public ResultVO<List<String>> getAllCategories() {
        return ResultVO.success(workflowService.getAllCategories());
    }
}
