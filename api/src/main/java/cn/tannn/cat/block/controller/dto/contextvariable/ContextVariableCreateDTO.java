package cn.tannn.cat.block.controller.dto.contextvariable;

import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.enums.VarType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 上下文变量创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "上下文变量创建请求")
public class ContextVariableCreateDTO implements Serializable {

    @Schema(description = "变量名", example = "prod_host", requiredMode = Schema.RequiredMode.REQUIRED)
    private String varKey;

    @Schema(description = "变量值", requiredMode = Schema.RequiredMode.REQUIRED)
    private String varValue;

    @Schema(description = "变量类型", example = "TEXT")
    private VarType varType;

    @Schema(description = "分组名称", example = "servers")
    private String groupName;

    @Schema(description = "变量描述")
    private String description;

    @Schema(description = "是否加密", example = "false")
    private Boolean isEncrypted;

    @Schema(description = "环境", example = "DEFAULT")
    private Environment environment;
}
