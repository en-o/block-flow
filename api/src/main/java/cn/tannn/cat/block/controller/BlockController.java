package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockPage;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import cn.tannn.cat.block.service.BlockService;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 块管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
@Tag(name = "块管理", description = "块的增删改查接口")
public class BlockController {

    private final BlockService blockService;

    @PostMapping
    @Operation(summary = "创建块", description = "创建新的块")
    public ResultVO<Block> create(@RequestBody BlockCreateDTO createDTO) {
        return ResultVO.success(blockService.create(createDTO));
    }

    @PutMapping
    @Operation(summary = "更新块", description = "更新块信息")
    public ResultVO<Block> update(@RequestBody BlockUpdateDTO updateDTO) {
        return ResultVO.success(blockService.update(updateDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除块", description = "根据ID删除块")
    public ResultVO<Void> delete(@Parameter(description = "块ID") @PathVariable Integer id) {
        blockService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取块详情", description = "根据ID获取块详情")
    public ResultVO<Block> getById(@Parameter(description = "块ID") @PathVariable Integer id) {
        return ResultVO.success(blockService.getById(id));
    }

    @GetMapping("/page")
    @Operation(summary = "分页查询块", description = "分页查询块列表")
    public ResultPageVO<Block,JpaPageResult<Block>> page(
            @RequestBody @Valid BlockPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(blockService.findPage(where)));
    }

    @PostMapping("/{id}/test")
    @Operation(summary = "测试块执行", description = "执行块的Python脚本并返回结果")
    public ResultVO<String> test(
            @Parameter(description = "块ID") @PathVariable Integer id,
            @RequestBody BlockTestDTO testDTO) {
        return ResultVO.success(blockService.test(id, testDTO));
    }

    @GetMapping("/{id}/usage")
    @Operation(summary = "获取块使用统计", description = "获取块的使用次数")
    public ResultVO<Long> getUsageCount(@Parameter(description = "块ID") @PathVariable Integer id) {
        return ResultVO.success(blockService.getUsageCount(id));
    }

    @PostMapping("/{id}/clone")
    @Operation(summary = "克隆块", description = "复制一个现有的块")
    public ResultVO<Block> clone(@Parameter(description = "块ID") @PathVariable Integer id) {
        return ResultVO.success(blockService.clone(id));
    }
}
