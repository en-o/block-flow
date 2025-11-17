package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 流程定义Repository
 *
 * @author tnnn
 */
@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Integer> , JpaSpecificationExecutor<Workflow> {

    /**
     * 根据流程名称查找
     *
     * @param name 流程名称
     * @return 流程
     */
    Optional<Workflow> findByName(String name);

    /**
     * 根据创建者查找
     *
     * @param authorUsername 创建者登录名
     * @return 流程列表
     */
    List<Workflow> findByAuthorUsername(String authorUsername);

    /**
     * 根据创建者分页查找
     *
     * @param authorUsername 创建者登录名
     * @param pageable       分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByAuthorUsername(String authorUsername, Pageable pageable);

    /**
     * 查找模板流程
     *
     * @param isTemplate 是否为模板
     * @return 流程列表
     */
    List<Workflow> findByIsTemplate(Boolean isTemplate);

    /**
     * 查找模板流程（分页）
     *
     * @param isTemplate 是否为模板
     * @param pageable   分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByIsTemplate(Boolean isTemplate, Pageable pageable);

    /**
     * 根据分类查找
     *
     * @param category 流程分类
     * @return 流程列表
     */
    List<Workflow> findByCategory(String category);

    /**
     * 根据分类分页查找
     *
     * @param category 流程分类
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByCategory(String category, Pageable pageable);

    /**
     * 根据启用状态查找
     *
     * @param isActive 是否启用
     * @return 流程列表
     */
    List<Workflow> findByIsActive(Boolean isActive);

    /**
     * 根据启用状态分页查找
     *
     * @param isActive 是否启用
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByIsActive(Boolean isActive, Pageable pageable);

    /**
     * 根据名称模糊查询
     *
     * @param name     流程名称
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByNameContaining(String name, Pageable pageable);

    /**
     * 根据描述模糊查询
     *
     * @param description 描述
     * @param pageable    分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByDescriptionContaining(String description, Pageable pageable);

    /**
     * 组合查询：根据创建者和启用状态
     *
     * @param authorUsername 创建者登录名
     * @param isActive       是否启用
     * @param pageable       分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByAuthorUsernameAndIsActive(String authorUsername, Boolean isActive, Pageable pageable);

    /**
     * 组合查询：根据分类和启用状态
     *
     * @param category 流程分类
     * @param isActive 是否启用
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByCategoryAndIsActive(String category, Boolean isActive, Pageable pageable);

    /**
     * 组合查询：根据模板状态和启用状态
     *
     * @param isTemplate 是否为模板
     * @param isActive   是否启用
     * @param pageable   分页参数
     * @return 流程分页列表
     */
    Page<Workflow> findByIsTemplateAndIsActive(Boolean isTemplate, Boolean isActive, Pageable pageable);

    /**
     * 搜索流程（名称或描述包含关键字）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 流程分页列表
     */
    @Query("SELECT w FROM Workflow w WHERE w.name LIKE %:keyword% OR w.description LIKE %:keyword%")
    Page<Workflow> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 检查流程名称是否存在
     *
     * @param name 流程名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 统计某创建者的流程数量
     *
     * @param authorUsername 创建者登录名
     * @return 流程数量
     */
    long countByAuthorUsername(String authorUsername);

    /**
     * 统计某分类的流程数量
     *
     * @param category 流程分类
     * @return 流程数量
     */
    long countByCategory(String category);

    /**
     * 统计启用的流程数量
     *
     * @return 流程数量
     */
    long countByIsActive(Boolean isActive);

    /**
     * 获取所有不同的分类
     *
     * @return 分类列表
     */
    @Query("SELECT DISTINCT w.category FROM Workflow w WHERE w.category IS NOT NULL ORDER BY w.category")
    List<String> findDistinctCategories();
}
