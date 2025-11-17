package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockPage;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import org.springframework.data.domain.Page;

/**
 * 块Service接口
 *
 * @author tnnn
 */
public interface BlockService {

    /**
     * 创建块
     *
     * @param createDTO 创建DTO
     * @return 块
     */
    Block create(BlockCreateDTO createDTO);

    /**
     * 更新块
     *
     * @param updateDTO 更新DTO
     * @return 块
     */
    Block update(BlockUpdateDTO updateDTO);

    /**
     * 删除块
     *
     * @param id 块ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询块
     *
     * @param id 块ID
     * @return 块
     */
    Block getById(Integer id);

    /**
     * 分页查询块
     *
     * @param where 分页参数
     * @return 块分页列表
     */
    Page<Block> findPage(BlockPage where);


    /**
     * 测试块执行
     *
     * @param id      块ID
     * @param testDTO 测试参数
     * @return 测试结果
     */
    String test(Integer id, BlockTestDTO testDTO);

    /**
     * 获取块使用统计
     *
     * @param id 块ID
     * @return 使用次数
     */
    Long getUsageCount(Integer id);

    /**
     * 克隆块
     *
     * @param id 块ID
     * @return 新块
     */
    Block clone(Integer id);
}
