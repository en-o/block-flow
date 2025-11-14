package cn.tannn.cat.block.controller.dto.block;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 块更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "块更新请求")
public class BlockUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "块名称", example = "SSH上传文件")
    private String name;

    @Schema(description = "块类型标识", example = "ssh_upload")
    private String typeCode;

    @Schema(description = "块描述", example = "通过SSH上传文件到远程服务器")
    private String description;

    @Schema(description = "块颜色", example = "#5C7CFA")
    private String color;

    @Schema(description = "执行脚本")
    private String script;

    @Schema(description = "Python环境ID", example = "1")
    private Integer pythonEnvId;

    @Schema(description = "输入参数定义")
    private JSONObject inputs;

    @Schema(description = "输出参数定义")
    private JSONObject outputs;

    @Schema(description = "是否公开", example = "true")
    private Boolean isPublic;
}
