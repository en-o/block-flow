package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import cn.tannn.cat.block.enums.ExecutionStatus;
import cn.tannn.cat.block.enums.TriggerType;
import com.alibaba.fastjson2.JSONObject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 执行记录表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "execution_logs", indexes = {
        @Index(name = "idx_workflow", columnList = "workflowId"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_start_time", columnList = "startTime")
})
@Comment("执行记录表")
public class ExecutionLog extends EntityPfield {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("主键ID")
    private Long id;

    @Column(nullable = false)
    @Comment("流程ID")
    private Long workflowId;

    @Column(length = 100)
    @Comment("流程名称快照")
    private String workflowName;

    @Column()
    @Comment("执行者登录名")
    private String executorUsername;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("执行状态: running/success/failed/cancelled")
    private ExecutionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("触发方式: manual/schedule/webhook/api")
    private TriggerType triggerType;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    @Comment("执行日志")
    private String logs;

    @Lob
    @Column(columnDefinition = "TEXT")
    @Comment("错误信息")
    private String errorMessage;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输入参数")
    private JSONObject inputParams;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输出结果")
    private JSONObject outputResult;

    @Column(nullable = false)
    @Comment("开始时间")
    private LocalDateTime startTime;

    @Column()
    @Comment("结束时间")
    private LocalDateTime endTime;

    @Column()
    @Comment("执行时长(秒)")
    private Integer duration;

    @PrePersist
    protected void onCreate() {
        if (startTime == null) {
            startTime = LocalDateTime.now();
        }
        if (status == null) {
            status = ExecutionStatus.RUNNING;
        }
        if (triggerType == null) {
            triggerType = TriggerType.MANUAL;
        }
    }
}
