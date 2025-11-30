package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockCreateDTO;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockPage;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockUpdateDTO;
import cn.tannn.cat.block.entity.BlocklyBlock;
import cn.tannn.cat.block.service.BlocklyBlockService;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Blockly块管理Controller
 *
 * @author tnnn
 */
@RestController
@RequestMapping("/api/blockly-blocks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Blockly块管理", description = "管理Google Blockly自定义块")
public class BlocklyBlockController {

    private final BlocklyBlockService blocklyBlockService;

    /**
     * 创建Blockly块
     */
    @PostMapping
    @Operation(summary = "创建Blockly块", description = "创建一个新的Blockly自定义块")
    public ResultVO<BlocklyBlock> create(@Valid @RequestBody BlocklyBlockCreateDTO createDTO) {
        log.info("创建Blockly块: {}", createDTO);
        return ResultVO.success(blocklyBlockService.create(createDTO));
    }

    /**
     * 更新Blockly块
     */
    @PutMapping
    @Operation(summary = "更新Blockly块", description = "更新已有的Blockly块")
    public ResultVO<BlocklyBlock> update(@Valid @RequestBody BlocklyBlockUpdateDTO updateDTO) {
        log.info("更新Blockly块: {}", updateDTO);
        return ResultVO.success(blocklyBlockService.update(updateDTO));
    }

    /**
     * 删除Blockly块
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除Blockly块", description = "删除指定的Blockly块（系统块不可删除）")
    public ResultVO<Void> delete(@PathVariable Integer id) {
        log.info("删除Blockly块: {}", id);
        blocklyBlockService.delete(id);
        return ResultVO.success();
    }

    /**
     * 根据ID查询块
     */
    @GetMapping("/{id}")
    @Operation(summary = "查询Blockly块", description = "根据ID查询Blockly块详情")
    public ResultVO<BlocklyBlock> getById(@PathVariable Integer id) {
        return ResultVO.success(blocklyBlockService.getById(id));
    }

    /**
     * 根据类型查询块
     */
    @GetMapping("/type/{type}")
    @Operation(summary = "根据类型查询块", description = "根据块类型查询Blockly块")
    public ResultVO<BlocklyBlock> getByType(@PathVariable String type) {
        return ResultVO.success(blocklyBlockService.getByType(type));
    }

    /**
     * 分页查询
     */
    @PostMapping("/page")
    @Operation(summary = "分页查询", description = "分页查询Blockly块列表")
    public ResultPageVO<BlocklyBlock, JpaPageResult<BlocklyBlock>>  findPage(@RequestBody BlocklyBlockPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(blocklyBlockService.findPage(where)));
    }

    /**
     * 获取所有启用的块
     */
    @GetMapping("/enabled")
    @Operation(summary = "获取启用的块", description = "获取所有已启用的Blockly块")
    public ResultVO<List<BlocklyBlock>> listEnabled() {
        return ResultVO.success(blocklyBlockService.listEnabled());
    }

    /**
     * 获取所有分类
     */
    @GetMapping("/categories")
    @Operation(summary = "获取所有分类", description = "获取所有Blockly块的分类列表")
    public ResultVO<List<String>> listCategories() {
        return ResultVO.success(blocklyBlockService.listCategories());
    }

    /**
     * 根据分类获取块列表
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "根据分类查询", description = "根据分类获取Blockly块列表（仅启用的）")
    public ResultVO<List<BlocklyBlock>> listByCategory(@PathVariable String category) {
        return ResultVO.success(blocklyBlockService.listByCategory(category));
    }

    /**
     * 获取工具箱配置
     * 用于前端Blockly编辑器动态加载块
     */
    @GetMapping("/toolbox")
    @Operation(summary = "获取工具箱配置", description = "获取Blockly工具箱配置（按分类分组）")
    public ResultVO<Map<String, List<BlocklyBlock>>> getToolboxConfig() {
        return ResultVO.success(blocklyBlockService.getToolboxConfig());
    }

    /**
     * 启用/禁用块
     */
    @PutMapping("/{id}/toggle")
    @Operation(summary = "启用/禁用块", description = "切换Blockly块的启用状态")
    public ResultVO<BlocklyBlock> toggleEnabled(@PathVariable Integer id, @RequestParam Boolean enabled) {
        log.info("切换Blockly块状态: id={}, enabled={}", id, enabled);
        return ResultVO.success(blocklyBlockService.toggleEnabled(id, enabled));
    }

    /**
     * 批量导入块定义
     */
    @PostMapping("/batch-import")
    @Operation(summary = "批量导入", description = "批量导入Blockly块定义")
    public ResultVO<Integer> batchImport(@RequestBody List<BlocklyBlockCreateDTO> blocks) {
        log.info("批量导入Blockly块: {} 个", blocks.size());
        int count = blocklyBlockService.batchImport(blocks);
        return ResultVO.success(count);
    }

    /**
     * 验证块定义
     */
    @PostMapping("/validate")
    @Operation(summary = "验证块定义", description = "验证Blockly块定义和Python生成器的合法性")
    public ResultVO<String> validateDefinition(@RequestBody Map<String, String> params) {
        String definition = params.get("definition");
        String pythonGenerator = params.get("pythonGenerator");

        String result = blocklyBlockService.validateBlockDefinition(definition, pythonGenerator);

        if (result == null) {
            return ResultVO.success("验证通过");
        } else {
            return ResultVO.failMessage("验证失败");
        }
    }
}
