package cn.tannn.cat.block.controller.dto.block;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 块创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "块创建请求")
public class BlockCreateDTO implements Serializable {

    @Schema(description = "块名称", example = "SSH上传文件", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "块类型标识", example = "ssh_upload", requiredMode = Schema.RequiredMode.REQUIRED)
    private String typeCode;

    @Schema(description = "块描述", example = "通过SSH上传文件到远程服务器")
    private String description;

    @Schema(description = "块颜色", example = "#5C7CFA")
    private String color;

    @Schema(description = "执行脚本", requiredMode = Schema.RequiredMode.REQUIRED)
    private String script;

    @Schema(description = "Python环境ID", example = "1")
    private Integer pythonEnvId;

    @Schema(description = "输入参数定义")
    private JSONObject inputs;

    @Schema(description = "输出参数定义")
    private JSONObject outputs;

    @Schema(description = "是否公开", example = "true")
    private Boolean isPublic;

    @Schema(description = "创建者登录名", example = "admin")
    private String authorUsername;
}
