package cn.tannn.cat.block.controller.dto.contextvariable;

import cn.tannn.cat.block.enums.Environment;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * 上下文变量分页查询
 *
 * @author tnnn
 */
@Data
@Schema(description = "上下文变量分页查询")
public class ContextVariablePage {

    /**
     * 变量名（模糊查询）
     */
    @Schema(description = "变量名")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String varKey;


    /**
     * 分组名称
     */
    @Schema(description = "分组名称")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String groupName;

    /**
     * 环境
     */
    @Schema(description = "环境")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Environment environment;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;

    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(0, "varType");
        }
        return page.append(0, "varType");
    }
}
