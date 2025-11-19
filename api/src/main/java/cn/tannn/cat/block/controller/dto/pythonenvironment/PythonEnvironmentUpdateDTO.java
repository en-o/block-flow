package cn.tannn.cat.block.controller.dto.pythonenvironment;

import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * Python环境更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "Python环境更新请求")
public class PythonEnvironmentUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "环境名称", example = "部署环境")
    private String name;

    @Schema(description = "Python版本", example = "3.11")
    private String pythonVersion;

    @Schema(description = "环境描述")
    private String description;

    @Schema(description = "已安装包列表")
    private JSONObject packages;

    @Schema(description = "是否默认环境", example = "false")
    private Boolean isDefault;

    @Schema(description = "Python解释器路径", example = "C:\\Python39\\python.exe")
    private String pythonExecutable;
}
