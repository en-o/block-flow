package cn.tannn.cat.block.controller.dto.workflow;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 流程执行请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程执行请求")
public class WorkflowExecuteDTO implements Serializable {

    @Schema(description = "流程ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer workflowId;

    @Schema(description = "执行者登录名", example = "admin")
    private String executorUsername;

    @Schema(description = "输入参数")
    private JSONObject inputParams;
}
