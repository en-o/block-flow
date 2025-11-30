package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockCreateDTO;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockPage;
import cn.tannn.cat.block.controller.dto.blocklyblock.BlocklyBlockUpdateDTO;
import cn.tannn.cat.block.entity.BlocklyBlock;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

/**
 * Blockly块Service接口
 *
 * @author tnnn
 */
public interface BlocklyBlockService {

    /**
     * 创建Blockly块
     *
     * @param createDTO 创建DTO
     * @return 创建的块
     */
    BlocklyBlock create(BlocklyBlockCreateDTO createDTO);

    /**
     * 更新Blockly块
     *
     * @param updateDTO 更新DTO
     * @return 更新后的块
     */
    BlocklyBlock update(BlocklyBlockUpdateDTO updateDTO);

    /**
     * 删除Blockly块
     *
     * @param id 块ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询块
     *
     * @param id 块ID
     * @return 块信息
     */
    BlocklyBlock getById(Integer id);

    /**
     * 根据类型查询块
     *
     * @param type 块类型
     * @return 块信息
     */
    BlocklyBlock getByType(String type);

    /**
     * 分页查询
     *
     * @param where 查询条件
     * @return 分页结果
     */
    Page<BlocklyBlock> findPage(BlocklyBlockPage where);

    /**
     * 获取所有启用的块
     *
     * @return 块列表
     */
    List<BlocklyBlock> listEnabled();

    /**
     * 获取所有分类
     *
     * @return 分类列表
     */
    List<String> listCategories();

    /**
     * 根据分类获取块列表（仅启用的）
     *
     * @param category 分类
     * @return 块列表
     */
    List<BlocklyBlock> listByCategory(String category);

    /**
     * 获取工具箱配置（用于Blockly前端）
     * 返回按分类分组的块列表
     *
     * @return 分类->块列表 的映射
     */
    Map<String, List<BlocklyBlock>> getToolboxConfig();

    /**
     * 启用/禁用块
     *
     * @param id      块ID
     * @param enabled 是否启用
     * @return 更新后的块
     */
    BlocklyBlock toggleEnabled(Integer id, Boolean enabled);

    /**
     * 批量导入块定义
     *
     * @param blocks 块列表
     * @return 导入成功的数量
     */
    int batchImport(List<BlocklyBlockCreateDTO> blocks);

    /**
     * 验证块定义的合法性
     *
     * @param definition        块定义JSON
     * @param pythonGenerator   Python生成器代码
     * @return 验证结果消息，null表示验证通过
     */
    String validateBlockDefinition(String definition, String pythonGenerator);
}
