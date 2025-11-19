package cn.tannn.cat.block.controller.dto.workflow;

import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * 流程分页查询
 *
 * @author tnnn
 */
@Data
@Schema(description = "流程分页查询")
public class WorkflowPage {

    /**
     * 流程名称（模糊查询）
     */
    @Schema(description = "流程名称")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String name;

    /**
     * 创建者登录名
     */
    @Schema(description = "创建者登录名")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String authorUsername;

    /**
     * 流程分类
     */
    @Schema(description = "流程分类")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String category;

    /**
     * 是否为模板
     */
    @Schema(description = "是否为模板")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean isTemplate;


    @Schema(description = "是否公开")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean isPublic;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;

    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(1, "name");
        }
        return page.append(1, "name");
    }
}
