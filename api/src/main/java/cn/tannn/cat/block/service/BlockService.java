package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockPage;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import org.springframework.data.domain.Page;

import java.util.Map;

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
     * @param username 当前用户
     * @return 块
     */
    Block create(BlockCreateDTO createDTO, String username);

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
     * 克隆块
     *
     * @param id 块ID
     * @return 新块
     */
    Block clone(Integer id);

    /**
     * 获取标签聚类统计
     *
     * @return 标签及其使用次数的Map
     */
    Map<String, Long> getTagsStatistics();
}
