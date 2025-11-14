package cn.tannn.cat.block.controller.dto.blocktype;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 块类型更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "块类型更新请求")
public class BlockTypeUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "类型代码", example = "http_request")
    private String code;

    @Schema(description = "类型名称", example = "HTTP请求")
    private String name;

    @Schema(description = "排序", example = "0")
    private Integer sortOrder;
}
