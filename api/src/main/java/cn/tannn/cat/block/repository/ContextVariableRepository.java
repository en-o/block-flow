package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.BlockType;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.enums.VarType;
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
 * 上下文变量Repository
 *
 * @author tnnn
 */
@Repository
public interface ContextVariableRepository extends JpaRepository<ContextVariable, Integer>, JpaSpecificationExecutor<ContextVariable> {

    /**
     * 根据变量名查找
     *
     * @param varKey 变量名
     * @return 上下文变量
     */
    Optional<ContextVariable> findByVarKey(String varKey);

    /**
     * 根据分组名称查找
     *
     * @param groupName 分组名称
     * @return 上下文变量列表
     */
    List<ContextVariable> findByGroupName(String groupName);

    /**
     * 根据分组名称分页查找
     *
     * @param groupName 分组名称
     * @param pageable  分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByGroupName(String groupName, Pageable pageable);

    /**
     * 根据环境查找
     *
     * @param environment 环境
     * @return 上下文变量列表
     */
    List<ContextVariable> findByEnvironment(Environment environment);

    /**
     * 根据环境分页查找
     *
     * @param environment 环境
     * @param pageable    分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByEnvironment(Environment environment, Pageable pageable);

    /**
     * 根据变量类型查找
     *
     * @param varType 变量类型
     * @return 上下文变量列表
     */
    List<ContextVariable> findByVarType(VarType varType);

    /**
     * 根据变量类型分页查找
     *
     * @param varType  变量类型
     * @param pageable 分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByVarType(VarType varType, Pageable pageable);

    /**
     * 查找加密变量
     *
     * @param isEncrypted 是否加密
     * @return 上下文变量列表
     */
    List<ContextVariable> findByIsEncrypted(Boolean isEncrypted);

    /**
     * 查找加密变量（分页）
     *
     * @param isEncrypted 是否加密
     * @param pageable    分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByIsEncrypted(Boolean isEncrypted, Pageable pageable);

    /**
     * 组合查询：根据分组和环境
     *
     * @param groupName   分组名称
     * @param environment 环境
     * @return 上下文变量列表
     */
    List<ContextVariable> findByGroupNameAndEnvironment(String groupName, Environment environment);

    /**
     * 组合查询：根据分组和环境（分页）
     *
     * @param groupName   分组名称
     * @param environment 环境
     * @param pageable    分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByGroupNameAndEnvironment(String groupName, Environment environment, Pageable pageable);

    /**
     * 组合查询：根据变量类型和环境
     *
     * @param varType     变量类型
     * @param environment 环境
     * @return 上下文变量列表
     */
    List<ContextVariable> findByVarTypeAndEnvironment(VarType varType, Environment environment);

    /**
     * 根据变量名模糊查询
     *
     * @param varKey   变量名
     * @param pageable 分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByVarKeyContaining(String varKey, Pageable pageable);

    /**
     * 根据描述模糊查询
     *
     * @param description 描述
     * @param pageable    分页参数
     * @return 上下文变量分页列表
     */
    Page<ContextVariable> findByDescriptionContaining(String description, Pageable pageable);

    /**
     * 搜索变量（变量名或描述包含关键字）
     *
     * @param keyword  关键字
     * @param pageable 分页参数
     * @return 上下文变量分页列表
     */
    @Query("SELECT cv FROM ContextVariable cv WHERE cv.varKey LIKE %:keyword% OR cv.description LIKE %:keyword%")
    Page<ContextVariable> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 检查变量名是否存在
     *
     * @param varKey 变量名
     * @return 是否存在
     */
    boolean existsByVarKey(String varKey);

    /**
     * 统计某分组的变量数量
     *
     * @param groupName 分组名称
     * @return 变量数量
     */
    long countByGroupName(String groupName);

    /**
     * 统计某环境的变量数量
     *
     * @param environment 环境
     * @return 变量数量
     */
    long countByEnvironment(Environment environment);

    /**
     * 统计加密变量数量
     *
     * @return 变量数量
     */
    long countByIsEncrypted(Boolean isEncrypted);

    /**
     * 获取所有分组名称（去重）
     *
     * @return 分组名称列表
     */
    @Query("SELECT DISTINCT cv.groupName FROM ContextVariable cv WHERE cv.groupName IS NOT NULL")
    List<String> findAllDistinctGroupNames();
}
