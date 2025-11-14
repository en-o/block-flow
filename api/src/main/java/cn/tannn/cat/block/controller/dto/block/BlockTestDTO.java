package cn.tannn.cat.block.controller.dto.block;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;

/**
 * 块测试请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "块测试请求")
public class BlockTestDTO implements Serializable {

    @Schema(description = "块ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer blockId;

    @Schema(description = "测试输入参数")
    private Map<String, Object> inputs;
}
