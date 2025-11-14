package cn.tannn.cat.block.controller.dto.pythonenvironment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * Python包操作请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "Python包操作请求")
public class PackageOperationDTO implements Serializable {

    @Schema(description = "包名", example = "requests", requiredMode = Schema.RequiredMode.REQUIRED)
    private String packageName;

    @Schema(description = "版本号", example = "2.31.0")
    private String version;
}
