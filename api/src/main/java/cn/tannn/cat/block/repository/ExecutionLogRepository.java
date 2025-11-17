package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/**
 * 执行记录Repository
 *
 * @author tnnn
 */
@Repository
public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long>, JpaSpecificationExecutor<ExecutionLog> {

    /**
     * 统计成功率
     *
     * @param workflowId 流程ID
     * @return 成功率统计
     */
    @Query("SELECT COUNT(e) FROM ExecutionLog e WHERE e.workflowId = :workflowId AND e.status = 'SUCCESS'")
    long countSuccessByWorkflowId(@Param("workflowId") Long workflowId);

    /**
     * 统计失败次数
     *
     * @param workflowId 流程ID
     * @return 失败次数
     */
    @Query("SELECT COUNT(e) FROM ExecutionLog e WHERE e.workflowId = :workflowId AND e.status = 'FAILED'")
    long countFailedByWorkflowId(@Param("workflowId") Long workflowId);

    /**
     * 统计流程的执行次数
     *
     * @param workflowId 流程ID
     * @return 执行次数
     */
    long countByWorkflowId(Long workflowId);
}
