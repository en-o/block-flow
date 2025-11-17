package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.BlockType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 块类型Repository
 *
 * @author tnnn
 */
@Repository
public interface BlockTypeRepository extends JpaRepository<BlockType, Integer>, JpaSpecificationExecutor<BlockType> {

    /**
     * 根据类型代码查找
     *
     * @param code 类型代码
     * @return 块类型
     */
    Optional<BlockType> findByCode(String code);

    /**
     * 检查类型代码是否存在
     *
     * @param code 类型代码
     * @return 是否存在
     */
    boolean existsByCode(String code);

    /**
     * 查询所有类型，按排序字段排序
     *
     * @return 块类型列表
     */
    List<BlockType> findAllByOrderBySortOrderAsc();

    /**
     * 根据名称模糊查询
     *
     * @param name 类型名称
     * @return 块类型列表
     */
    List<BlockType> findByNameContaining(String name);
}
