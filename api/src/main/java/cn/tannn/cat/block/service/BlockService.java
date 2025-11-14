package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.block.BlockCreateDTO;
import cn.tannn.cat.block.controller.dto.block.BlockTestDTO;
import cn.tannn.cat.block.controller.dto.block.BlockUpdateDTO;
import cn.tannn.cat.block.entity.Block;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

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
     * @param pageable 分页参数
     * @return 块分页列表
     */
    Page<Block> listPage(Pageable pageable);

    /**
     * 根据类型代码查询块
     *
     * @param typeCode 类型代码
     * @param pageable 分页参数
     * @return 块分页列表
     */
    Page<Block> listByTypeCode(String typeCode, Pageable pageable);

    /**
     * 根据创建者查询块
     *
     * @param authorUsername 创建者登录名
     * @param pageable       分页参数
     * @return 块分页列表
     */
    Page<Block> listByAuthor(String authorUsername, Pageable pageable);

    /**
     * 根据公开状态查询块
     *
     * @param isPublic 是否公开
     * @param pageable 分页参数
     * @return 块分页列表
     */
    Page<Block> listByPublic(Boolean isPublic, Pageable pageable);

    /**
     * 搜索块（名称或描述包含关键字）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 块分页列表
     */
    Page<Block> search(String keyword, Pageable pageable);

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
