package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.controller.dto.workflow.WorkflowCreateDTO;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowUpdateDTO;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.service.WorkflowService;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 流程管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
@Tag(name = "流程管��", description = "流程的增删改查接口")
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

    @GetMapping("/page")
    @Operation(summary = "分页查询流程", description = "分页查询流程列表")
    public ResultVO<Page<Workflow>> listPage(
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.listPage(pageable));
    }

    @GetMapping("/author/{authorUsername}")
    @Operation(summary = "根据创建者查询流程", description = "根据创建者登录名分页查询流程")
    public ResultVO<Page<Workflow>> listByAuthor(
            @Parameter(description = "创建者登录名") @PathVariable String authorUsername,
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.listByAuthor(authorUsername, pageable));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "根据分类查询流程", description = "根据流程分类分页查询流程")
    public ResultVO<Page<Workflow>> listByCategory(
            @Parameter(description = "流程分类") @PathVariable String category,
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.listByCategory(category, pageable));
    }

    @GetMapping("/templates")
    @Operation(summary = "获取流程模板", description = "分页查询流程模板")
    public ResultVO<Page<Workflow>> listTemplates(
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.listTemplates(pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "根据启用状���查询流程", description = "根据启用状态分页查询流程")
    public ResultVO<Page<Workflow>> listByActive(
            @Parameter(description = "是否启用") @RequestParam Boolean isActive,
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.listByActive(isActive, pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索流程", description = "根据关键字搜索流程（名称或描述）")
    public ResultVO<Page<Workflow>> search(
            @Parameter(description = "关键字") @RequestParam String keyword,
            @Parameter(description = "页码,从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大��") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(workflowService.search(keyword, pageable));
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
