package cn.tannn.cat.block.controller.dto.workflowcategory;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 流程分类更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程分类更新请求")
public class WorkflowCategoryUpdateDTO implements Serializable {

    @Schema(description = "主键ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "分类代码", example = "automation")
    private String code;

    @Schema(description = "分类名称", example = "自动化流程")
    private String name;

    @Schema(description = "排序", example = "0")
    private Integer sortOrder;
}
