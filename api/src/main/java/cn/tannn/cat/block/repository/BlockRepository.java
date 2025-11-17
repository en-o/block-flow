package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.Block;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 块定义Repository
 *
 * @author tnnn
 */
@Repository
public interface BlockRepository extends JpaRepository<Block, Integer> , JpaSpecificationExecutor<Block> {

    /**
     * 根据类型代码查找
     *
     * @param typeCode 类型代码
     * @return 块列表
     */
    List<Block> findByTypeCode(String typeCode);


    /**
     * 查找公开的块
     *
     * @param isPublic 是否公开
     * @return 块列表
     */
    List<Block> findByIsPublic(Boolean isPublic);


    /**
     * 根据Python环境ID查找
     *
     * @param pythonEnvId Python环境ID
     * @return 块列表
     */
    List<Block> findByPythonEnvId(Integer pythonEnvId);

    /**
     * 检查块名称是否存在
     *
     * @param name 块名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 搜索块（名称或描述包含关键字）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 块分页列表
     */
    @Query("SELECT b FROM Block b WHERE b.name LIKE %:keyword% OR b.description LIKE %:keyword%")
    Page<Block> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 统计某类型的块数量
     *
     * @param typeCode 类型代码
     * @return 块数量
     */
    long countByTypeCode(String typeCode);

    /**
     * 统计某创建者的块数量
     *
     * @param authorUsername 创建者登录名
     * @return 块数量
     */
    long countByAuthorUsername(String authorUsername);
}
