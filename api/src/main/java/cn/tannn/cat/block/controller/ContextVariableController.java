package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableCreateDTO;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariablePage;
import cn.tannn.cat.block.controller.dto.contextvariable.ContextVariableUpdateDTO;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.service.ContextVariableService;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 上下文变量Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/context")
@RequiredArgsConstructor
@Tag(name = "上下文变量管理", description = "上下文变量的增删改查接口")
public class ContextVariableController {

    private final ContextVariableService contextVariableService;

    @PostMapping
    @Operation(summary = "添加变量", description = "创建新的上下文变量")
    public ResultVO<ContextVariable> create(@RequestBody ContextVariableCreateDTO createDTO) {
        return ResultVO.success(contextVariableService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新变量", description = "更新上下文变量信息")
    public ResultVO<ContextVariable> update(@RequestBody ContextVariableUpdateDTO updateDTO) {
        return ResultVO.success(contextVariableService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除变量", description = "根据ID删除上下文变量")
    public ResultVO<Void> delete(@Parameter(description = "变量ID") @PathVariable Integer id) {
        contextVariableService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取变量详情", description = "根据ID获取上下文变量详情")
    public ResultVO<ContextVariable> getById(@Parameter(description = "变量ID") @PathVariable Integer id) {
        return ResultVO.success(contextVariableService.getById(id));
    }

    @GetMapping("/key/{varKey}")
    @Operation(summary = "根据变量名获取变量", description = "根据变量名获取上下文变量")
    public ResultVO<ContextVariable> getByKey(@Parameter(description = "变量名") @PathVariable String varKey) {
        return ResultVO.success(contextVariableService.getByKey(varKey));
    }

    @GetMapping("/page")
    @Operation(summary = "分页查询变量", description = "分页查询上下文变量列表")
    public ResultPageVO<ContextVariable, JpaPageResult<ContextVariable>> page(@RequestBody @Valid ContextVariablePage where) {
        return ResultPageVO.success(JpaPageResult.toPage(contextVariableService.findPage(where)));
    }

    @PostMapping("/import")
    @Operation(summary = "批量导入变量", description = "批量导入上下文变量")
    public ResultVO<Integer> importVariables(
            @RequestBody Map<String, String> variables,
            @Parameter(description = "分组名称") @RequestParam(required = false) String groupName,
            @Parameter(description = "环境") @RequestParam(required = false) Environment environment) {
        int count = contextVariableService.importVariables(variables, groupName, environment);
        return ResultVO.success(count);
    }

    @GetMapping("/export")
    @Operation(summary = "批量导出变量", description = "批量导出上下文变量")
    public ResultVO<Map<String, String>> exportVariables(
            @Parameter(description = "分组名称") @RequestParam(required = false) String groupName,
            @Parameter(description = "环境") @RequestParam(required = false) Environment environment) {
        return ResultVO.success(contextVariableService.exportVariables(groupName, environment));
    }

    @GetMapping("/groups")
    @Operation(summary = "获取所有分组", description = "获取所有分组名称列表")
    public ResultVO<List<String>> getAllGroupNames() {
        return ResultVO.success(contextVariableService.getAllGroupNames());
    }
}
