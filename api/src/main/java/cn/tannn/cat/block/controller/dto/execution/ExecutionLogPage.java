package cn.tannn.cat.block.controller.dto.execution;

import cn.tannn.cat.block.enums.ExecutionStatus;
import cn.tannn.cat.block.enums.TriggerType;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * 执行日志分页查询
 *
 * @author tnnn
 */
@Data
@Schema(description = "执行日志分页查询")
public class ExecutionLogPage {

    /**
     * 流程ID
     */
    @Schema(description = "流程ID")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Long workflowId;

    /**
     * 执行者登录名
     */
    @Schema(description = "执行者登录名")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String executorUsername;

    /**
     * 执行状态
     */
    @Schema(description = "执行状态")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private ExecutionStatus status;

    /**
     * 触发方式
     */
    @Schema(description = "触发方式")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private TriggerType triggerType;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;

    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(1, "startTime");
        }
        return page.append(1, "startTime");
    }
}
