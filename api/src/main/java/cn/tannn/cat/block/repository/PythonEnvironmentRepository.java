package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.PythonEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Python环境Repository
 *
 * @author tnnn
 */
@Repository
public interface PythonEnvironmentRepository extends JpaRepository<PythonEnvironment, Integer> , JpaSpecificationExecutor<PythonEnvironment> {

    /**
     * 根据环境名称查找
     *
     * @param name 环境名称
     * @return Python环境
     */
    Optional<PythonEnvironment> findByName(String name);

    /**
     * 查找默认环境
     *
     * @param isDefault 是否默认
     * @return Python环境列表
     */
    List<PythonEnvironment> findByIsDefault(Boolean isDefault);

    /**
     * 查找唯一的默认环境
     *
     * @return Python环境
     */
    Optional<PythonEnvironment> findFirstByIsDefaultTrue();

    /**
     * 检查环境名称是否存在
     *
     * @param name 环境名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 根据名称模糊查询
     *
     * @param name 环境名称
     * @return Python环境列表
     */
    List<PythonEnvironment> findByNameContaining(String name);

    /**
     * 根据描述模糊查询
     *
     * @param description 描述
     * @return Python环境列表
     */
    List<PythonEnvironment> findByDescriptionContaining(String description);

    /**
     * 统计环境数量
     *
     * @return 环境数量
     */
    long count();
}
