package cn.tannn.cat.block.controller.dto.blocktype;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 块类型创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "块类型创建请求")
public class BlockTypeCreateDTO implements Serializable {

    @Schema(description = "类型代码", example = "http_request", requiredMode = Schema.RequiredMode.REQUIRED)
    private String code;

    @Schema(description = "类型名称", example = "HTTP请求", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "排序", example = "0")
    private Integer sortOrder;
}
