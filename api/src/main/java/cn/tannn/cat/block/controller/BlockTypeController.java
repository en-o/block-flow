package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.dto.blocktype.BlockTypeCreateDTO;
import cn.tannn.cat.block.dto.blocktype.BlockTypeUpdateDTO;
import cn.tannn.cat.block.dto.blocktype.BlockTypeVO;
import cn.tannn.cat.block.entity.BlockType;
import cn.tannn.cat.block.service.BlockTypeService;
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
 * 块类型Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/api/block-types")
@RequiredArgsConstructor
@Tag(name = "块类型管理", description = "块类型的增删改查接口")
public class BlockTypeController {

    private final BlockTypeService blockTypeService;

    @PostMapping
    @Operation(summary = "创建块类型", description = "创建新的块类型")
    public ResultVO<BlockType> create(@RequestBody BlockTypeCreateDTO createDTO) {
        return ResultVO.success( blockTypeService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新块类型", description = "更新块类型信息")
    public ResultVO<BlockType> update(@RequestBody BlockTypeUpdateDTO updateDTO) {
        return ResultVO.success(blockTypeService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除块类型", description = "根据ID删除块类型")
    public ResultVO<Void> delete(@Parameter(description = "块类型ID") @PathVariable Integer id) {
        blockTypeService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取块类型详情", description = "根据ID获取块类型详情")
    public ResultVO<BlockType> getById(@Parameter(description = "块类型ID") @PathVariable Integer id) {
        return ResultVO.success( blockTypeService.getById(id));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "根据code获取块类型", description = "根据类型代码获取块类型")
    public ResultVO<BlockType> getByCode(@Parameter(description = "类型代码") @PathVariable String code) {
        return ResultVO.success(blockTypeService.getByCode(code));
    }

    @GetMapping("/list")
    @Operation(summary = "获取所有块类型", description = "获取所有块类型列表（按排序）")
    public ResultVO<List<BlockType>> listAll() {
        return ResultVO.success(blockTypeService.listAll());
    }

    @GetMapping("/page")
    @Operation(summary = "分页查询块类型", description = "分页查询块类型列表")
    public ResultVO<Page<BlockType>> listPage(
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResultVO.success(blockTypeService.listPage(pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索块类型", description = "根据名称模糊搜索块类型")
    public ResultVO<List<BlockType>> search(
            @Parameter(description = "类型名称") @RequestParam String name) {
        return ResultVO.success(blockTypeService.searchByName(name));
    }
}
