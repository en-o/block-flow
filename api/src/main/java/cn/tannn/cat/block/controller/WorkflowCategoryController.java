package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryCreateDTO;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryPage;
import cn.tannn.cat.block.controller.dto.workflowcategory.WorkflowCategoryUpdateDTO;
import cn.tannn.cat.block.entity.WorkflowCategory;
import cn.tannn.cat.block.service.WorkflowCategoryService;
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
 * 流程分类Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/workflow-categories")
@RequiredArgsConstructor
@Tag(name = "流程分类管理", description = "流程分类的增删改查接口")
public class WorkflowCategoryController {

    private final WorkflowCategoryService workflowCategoryService;

    @PostMapping
    @Operation(summary = "创建流程分类", description = "创建新的流程分类")
    public ResultVO<WorkflowCategory> create(@RequestBody WorkflowCategoryCreateDTO createDTO) {
        return ResultVO.success(workflowCategoryService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新流程分类", description = "更新流程分类信息")
    public ResultVO<WorkflowCategory> update(@RequestBody WorkflowCategoryUpdateDTO updateDTO) {
        return ResultVO.success(workflowCategoryService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除流程分类", description = "根据ID删除流程分类")
    public ResultVO<Void> delete(@Parameter(description = "流程分类ID") @PathVariable Integer id) {
        workflowCategoryService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取流程分类详情", description = "根据ID获取流程分类详情")
    public ResultVO<WorkflowCategory> getById(@Parameter(description = "流程分类ID") @PathVariable Integer id) {
        return ResultVO.success(workflowCategoryService.getById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "根据code获取流程分类", description = "根据分类代码获取流程分类")
    public ResultVO<WorkflowCategory> getByCode(@Parameter(description = "分类代码") @PathVariable String code) {
        return ResultVO.success(workflowCategoryService.getByCode(code));
    }

    @GetMapping("/list")
    @Operation(summary = "获取所有流程分类", description = "获取所有流程分类列表（按排序）")
    public ResultVO<List<WorkflowCategory>> listAll() {
        return ResultVO.success(workflowCategoryService.listAll());
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询流程分类", description = "分页查询流程分类列表")
    public ResultPageVO<WorkflowCategory, JpaPageResult<WorkflowCategory>> page(@RequestBody @Valid WorkflowCategoryPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(workflowCategoryService.findPage(where)));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索流程分类", description = "根据名称模糊搜索流程分类")
    public ResultVO<List<WorkflowCategory>> search(
            @Parameter(description = "分类名称") @RequestParam String name) {
        return ResultVO.success(workflowCategoryService.searchByName(name));
    }
}
