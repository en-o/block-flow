package cn.tannn.cat.block.controller.dto.workflowcategory;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 流程分类创建请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程分类创建请求")
public class WorkflowCategoryCreateDTO implements Serializable {

    @Schema(description = "分类代码", example = "automation", requiredMode = Schema.RequiredMode.REQUIRED)
    private String code;

    @Schema(description = "分类名称", example = "自动化流程", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "排序", example = "0")
    private Integer sortOrder;
}
