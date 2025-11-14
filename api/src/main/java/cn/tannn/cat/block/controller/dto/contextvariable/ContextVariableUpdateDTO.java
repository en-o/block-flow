package cn.tannn.cat.block.controller.dto.contextvariable;

import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.enums.VarType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 上下文变量更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "上下文变量更新请求")
public class ContextVariableUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "变量名", example = "prod_host")
    private String varKey;

    @Schema(description = "变量值")
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
