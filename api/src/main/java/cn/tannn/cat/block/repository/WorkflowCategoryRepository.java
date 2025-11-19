package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.WorkflowCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

/**
 * 流程分类 Repository
 *
 * @author tnnn
 */
public interface WorkflowCategoryRepository extends JpaRepository<WorkflowCategory, Long>, JpaSpecificationExecutor<WorkflowCategory> {

    /**
     * 根据代码查询分类
     */
    Optional<WorkflowCategory> findByCode(String code);

    /**
     * 查询所有分类，按排序字段升序
     */
    List<WorkflowCategory> findAllByOrderBySortOrderAsc();

    /**
     * 检查代码是否存在
     */
    boolean existsByCode(String code);

    /**
     * 根据名称模糊查询
     */
    List<WorkflowCategory> findByNameContaining(String name);

}
