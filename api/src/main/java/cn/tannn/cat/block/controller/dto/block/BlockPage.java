package cn.tannn.cat.block.controller.dto.block;

import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

/**
 * 分页查询
 *
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2025/11/17 09:35
 */
@Data
@Schema(description = "块分页查询")
public class BlockPage {


    /**
     * 块名称
     */
    @Schema(description = "块名称")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String name;

    /**
     * 块类型标识
     */
    @Schema(description = "块类型标识")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String typeCode;


    /**
     * Python环境ID
     */
    @Schema(description = "Python环境ID")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Integer pythonEnvId;

    /**
     * 是否公开
     */
    @Schema(description = "是否公开")
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean isPublic;

    /**
     * 标签查询（模糊匹配，支持多标签查询）
     */
    @Schema(description = "标签查询（模糊匹配）")
    @JpaSelectIgnoreField
    private String tag;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;


    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(0, "typeCode");
        }
        return page.append(0,"typeCode");
    }
}
