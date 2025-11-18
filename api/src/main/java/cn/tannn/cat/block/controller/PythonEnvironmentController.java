package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PackageOperationDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentCreateDTO;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentPage;
import cn.tannn.cat.block.controller.dto.pythonenvironment.PythonEnvironmentUpdateDTO;
import cn.tannn.cat.block.entity.PythonEnvironment;
import cn.tannn.cat.block.service.PythonEnvironmentService;
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
 * Python环境管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/python-envs")
@RequiredArgsConstructor
@Tag(name = "Python环境管理", description = "Python环境的增删改查接口")
public class PythonEnvironmentController {

    private final PythonEnvironmentService pythonEnvironmentService;

    @PostMapping
    @Operation(summary = "创建环境", description = "创建新的Python环境")
    public ResultVO<PythonEnvironment> create(@RequestBody PythonEnvironmentCreateDTO createDTO) {
        return ResultVO.success(pythonEnvironmentService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新环境", description = "更新Python环境信息")
    public ResultVO<PythonEnvironment> update(@RequestBody PythonEnvironmentUpdateDTO updateDTO) {
        return ResultVO.success(pythonEnvironmentService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除环境", description = "根据ID删除Python环境")
    public ResultVO<Void> delete(@Parameter(description = "环境ID") @PathVariable Integer id) {
        pythonEnvironmentService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取环境详情", description = "根据ID获取Python环境详情")
    public ResultVO<PythonEnvironment> getById(@Parameter(description = "环境ID") @PathVariable Integer id) {
        return ResultVO.success(pythonEnvironmentService.getById(id));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取环境", description = "根据名称获取Python环境")
    public ResultVO<PythonEnvironment> getByName(@Parameter(description = "环境名称") @PathVariable String name) {
        return ResultVO.success(pythonEnvironmentService.getByName(name));
    }

    @GetMapping("/list")
    @Operation(summary = "获取所有环境", description = "获取所有Python环境列表")
    public ResultVO<List<PythonEnvironment>> listAll() {
        return ResultVO.success(pythonEnvironmentService.listAll());
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询环境", description = "分页查询Python环境列表")
    public ResultPageVO<PythonEnvironment, JpaPageResult<PythonEnvironment>> page(@RequestBody @Valid PythonEnvironmentPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(pythonEnvironmentService.findPage(where)));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索环境", description = "根据关键字搜索Python环境（名称或描述）")
    public ResultVO<List<PythonEnvironment>> search(
            @Parameter(description = "关键字") @RequestParam String keyword) {
        return ResultVO.success(pythonEnvironmentService.search(keyword));
    }

    @GetMapping("/default")
    @Operation(summary = "获取默认环境", description = "获取默认的Python环境")
    public ResultVO<PythonEnvironment> getDefault() {
        return ResultVO.success(pythonEnvironmentService.getDefaultEnvironment());
    }

    @PutMapping("/{id}/set-default")
    @Operation(summary = "设置默认环境", description = "将指定的Python环境设置为默认")
    public ResultVO<PythonEnvironment> setAsDefault(@Parameter(description = "环境ID") @PathVariable Integer id) {
        return ResultVO.success(pythonEnvironmentService.setAsDefault(id));
    }

    @PostMapping("/{id}/packages")
    @Operation(summary = "安装包", description = "为Python环境安装依赖包")
    public ResultVO<PythonEnvironment> installPackage(
            @Parameter(description = "环境ID") @PathVariable Integer id,
            @RequestBody PackageOperationDTO packageDTO) {
        return ResultVO.success(pythonEnvironmentService.installPackage(id, packageDTO));
    }

    @DeleteMapping("/{id}/packages/{packageName}")
    @Operation(summary = "卸载包", description = "从Python环境卸载依赖包")
    public ResultVO<PythonEnvironment> uninstallPackage(
            @Parameter(description = "环境ID") @PathVariable Integer id,
            @Parameter(description = "包名") @PathVariable String packageName) {
        return ResultVO.success(pythonEnvironmentService.uninstallPackage(id, packageName));
    }

    @GetMapping("/{id}/requirements/export")
    @Operation(summary = "导出依赖", description = "导出Python环境的依赖（requirements.txt格式）")
    public ResultVO<String> exportRequirements(@Parameter(description = "环境ID") @PathVariable Integer id) {
        return ResultVO.success(pythonEnvironmentService.exportRequirements(id));
    }

    @PostMapping("/{id}/requirements/import")
    @Operation(summary = "导入依赖", description = "导入Python环境的依赖（requirements.txt格式）")
    public ResultVO<PythonEnvironment> importRequirements(
            @Parameter(description = "环境ID") @PathVariable Integer id,
            @RequestBody String requirementsText) {
        return ResultVO.success(pythonEnvironmentService.importRequirements(id, requirementsText));
    }
}
