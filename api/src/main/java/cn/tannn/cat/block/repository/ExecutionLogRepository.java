package cn.tannn.cat.block.repository;

import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.enums.ExecutionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long> {

    /**
     * 根据流程ID查找执行记录
     *
     * @param workflowId 流程ID
     * @param pageable   分页参数
     * @return 执行记录分页列表
     */
    Page<ExecutionLog> findByWorkflowId(Long workflowId, Pageable pageable);

    /**
     * 根据执行状态查找
     *
     * @param status   执行状态
     * @param pageable 分页参数
     * @return 执行记录分页列表
     */
    Page<ExecutionLog> findByStatus(ExecutionStatus status, Pageable pageable);

    /**
     * 根据执行者ID查找
     *
     * @param executorUsername 执行者
     * @param pageable   分页参数
     * @return 执行记录分页列表
     */
    Page<ExecutionLog> findByExecutorUsername(String executorUsername, Pageable pageable);

    /**
     * 根据时间范围查询
     *
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @param pageable  分页参数
     * @return 执行记录分页列表
     */
    Page<ExecutionLog> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

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
     * 查找最近的执行记录
     *
     * @param workflowId 流程ID
     * @param pageable   分页参数
     * @return 执行记录列表
     */
    Page<ExecutionLog> findByWorkflowIdOrderByStartTimeDesc(Long workflowId, Pageable pageable);
}
