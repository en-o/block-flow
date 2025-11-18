package cn.tannn.cat.block.controller.dto.workflow;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 流程更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程更新请求")
public class WorkflowUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "流程名称", example = "React项目部署流程")
    private String name;

    @Schema(description = "流程描述", example = "React项目的完整部署流程")
    private String description;

    @Schema(description = "xyflow流程JSON定义(nodes+edges)")
    private JSONObject flowDefinition;

    @Schema(description = "是否为模板", example = "false")
    private Boolean isTemplate;

    @Schema(description = "流程分类", example = "前端部署")
    private String category;

    @Schema(description = "标签", example = "[\"React\", \"Docker\"]")
    private String tags;

    @Schema(description = "版本号", example = "1.0.0")
    private String version;

    @Schema(description = "是否启用", example = "true")
    private Boolean isActive;
}
