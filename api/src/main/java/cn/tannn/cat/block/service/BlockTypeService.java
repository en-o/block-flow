package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.blocktype.BlockTypeCreateDTO;
import cn.tannn.cat.block.controller.dto.blocktype.BlockTypePage;
import cn.tannn.cat.block.controller.dto.blocktype.BlockTypeUpdateDTO;
import cn.tannn.cat.block.entity.BlockType;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 块类型Service接口
 *
 * @author tnnn
 */
public interface BlockTypeService {

    /**
     * 创建块类型
     *
     * @param createDTO 创建DTO
     * @return 块类型VO
     */
    BlockType create(BlockTypeCreateDTO createDTO);

    /**
     * 更新块类型
     *
     * @param updateDTO 更新DTO
     * @return 块类型
     */
    BlockType update(BlockTypeUpdateDTO updateDTO);

    /**
     * 删除块类型
     *
     * @param id 块类型ID
     */
    void delete(Integer id);

    /**
     * 根据ID查询块类型
     *
     * @param id 块类型ID
     * @return 块类型VO
     */
    BlockType getById(Integer id);

    /**
     * 根据code查询块类型
     *
     * @param code 类型代码
     * @return 块类型VO
     */
    BlockType getByCode(String code);

    /**
     * 查询所有块类型（按排序）
     *
     * @return 块类型列表
     */
    List<BlockType> listAll();

    /**
     * 分页查询块
     *
     * @param where 分页参数
     * @return 块分页列表
     */
    Page<BlockType> findPage(BlockTypePage where);


    /**
     * 根据名称模糊查询
     *
     * @param name 类型名称
     * @return 块类型列表
     */
    List<BlockType> searchByName(String name);
}
