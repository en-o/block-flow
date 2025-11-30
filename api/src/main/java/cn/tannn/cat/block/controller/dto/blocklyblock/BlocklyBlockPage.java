package cn.tannn.cat.block.controller.dto.blocklyblock;

import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectOperator;
import cn.tannn.jdevelops.annotations.jpa.enums.SQLOperatorWrapper;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * Blockly块分页查询DTO
 *
 * @author tnnn
 */
@Getter
@Setter
@ToString
public class BlocklyBlockPage {


    /**
     * 块类型（模糊查询）
     */
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String type;

    /**
     * 块名称（模糊查询）
     */
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.LIKE)
    private String name;

    /**
     * 块分类（精确查询）
     */
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private String category;

    /**
     * 是否启用
     */
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean enabled;

    /**
     * 是否为系统块
     */
    @JpaSelectOperator(operatorWrapper = SQLOperatorWrapper.EQ)
    private Boolean isSystem;



    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;


    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(1, "id");
        }
        return page.append(1,"id");
    }
}
