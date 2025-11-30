package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.BlocklyBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Blockly块Repository
 *
 * @author tnnn
 */
@Repository
public interface BlocklyBlockRepository extends JpaRepository<BlocklyBlock, Integer>,
        JpaSpecificationExecutor<BlocklyBlock> {

    /**
     * 根据类型查找块
     *
     * @param type 块类型
     * @return 块信息
     */
    Optional<BlocklyBlock> findByType(String type);

    /**
     * 检查类型是否已存在
     *
     * @param type 块类型
     * @return 是否存在
     */
    boolean existsByType(String type);

    /**
     * 根据分类查找所有块
     *
     * @param category 分类
     * @return 块列表
     */
    List<BlocklyBlock> findByCategory(String category);

    /**
     * 查找所有启用的块
     *
     * @return 启用的块列表
     */
    List<BlocklyBlock> findByEnabledTrue();

    /**
     * 根据分类查找启用的块，并按排序顺序排序
     *
     * @param category 分类
     * @param enabled  是否启用
     * @return 块列表
     */
    List<BlocklyBlock> findByCategoryAndEnabledOrderBySortOrderAsc(String category, Boolean enabled);

    /**
     * 查找所有启用的块，按分类和排序顺序排序
     *
     * @param enabled 是否启用
     * @return 块列表
     */
    List<BlocklyBlock> findByEnabledOrderByCategoryAscSortOrderAsc(Boolean enabled);

    /**
     * 根据名称模糊查询
     *
     * @param name 名称关键词
     * @return 块列表
     */
    List<BlocklyBlock> findByNameContaining(String name);

    /**
     * 查询所有分类（去重）
     *
     * @return 分类列表
     */
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT b.category FROM BlocklyBlock b ORDER BY b.category")
    List<String> findAllCategories();
}
