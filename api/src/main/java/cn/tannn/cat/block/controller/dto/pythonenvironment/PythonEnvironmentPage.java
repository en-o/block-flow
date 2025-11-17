package cn.tannn.cat.block.controller.dto.pythonenvironment;

import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * Python环境分页查询
 *
 * @author tnnn
 */
@Data
@Schema(description = "Python环境分页查询")
public class PythonEnvironmentPage {

    /**
     * 环境名称（模糊查询）
     */
    @Schema(description = "环境名称")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String name;

    /**
     * Python版本
     */
    @Schema(description = "Python版本")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String pythonVersion;

    /**
     * 是否为默认环境
     */
    @Schema(description = "是否为默认环境")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean isDefault;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;

    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(1, "isDefault");
        }
        return page.append(1, "isDefault");
    }
}
