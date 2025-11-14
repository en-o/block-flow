package cn.tannn.cat.block.controller.dto.workflow;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 流程创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程创建请求")
public class WorkflowCreateDTO implements Serializable {

    @Schema(description = "流程名称", example = "React项目部署流程", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "流程描述", example = "React项目的完整部署流程")
    private String description;

    @Schema(description = "Blockly XML数据", requiredMode = Schema.RequiredMode.REQUIRED)
    private String blocklyXml;

    @Schema(description = "Blockly JSON数据")
    private JSONObject blocklyJson;

    @Schema(description = "创建者登录名", example = "admin")
    private String authorUsername;

    @Schema(description = "是否为模板", example = "false")
    private Boolean isTemplate;

    @Schema(description = "流程分类", example = "前端部署")
    private String category;

    @Schema(description = "标签", example = "[\"React\", \"Docker\"]")
    private String tags;

    @Schema(description = "是否启用", example = "true")
    private Boolean isActive;
}
