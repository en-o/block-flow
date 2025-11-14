package cn.tannn.cat.block.controller.dto.pythonenvironment;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * Python环境创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "Python环境创建请求")
public class PythonEnvironmentCreateDTO implements Serializable {

    @Schema(description = "环境名称", example = "部署环境", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "Python版本", example = "3.11", requiredMode = Schema.RequiredMode.REQUIRED)
    private String pythonVersion;

    @Schema(description = "环境描述")
    private String description;

    @Schema(description = "已安装包列表")
    private JSONObject packages;

    @Schema(description = "是否默认环境", example = "false")
    private Boolean isDefault;
}
