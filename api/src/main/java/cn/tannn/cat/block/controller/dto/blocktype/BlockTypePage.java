package cn.tannn.cat.block.controller.dto.blocktype;

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
@Schema(description = "块类型分页查询")
public class BlockTypePage {

    /**
     * 类型名称
     */
    @Schema(description = "类型名称")
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
