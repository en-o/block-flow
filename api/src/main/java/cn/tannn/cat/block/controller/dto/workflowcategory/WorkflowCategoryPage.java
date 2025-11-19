package cn.tannn.cat.block.controller.dto.workflowcategory;

import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * 流程分类分页查询
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程分类分页查询")
public class WorkflowCategoryPage {

    /**
     * 分类名称
     */
    @Schema(description = "分类名称")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String name;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;


    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(0, "sortOrder");
        }
        return page.append(0,"sortOrder");
    }
}
