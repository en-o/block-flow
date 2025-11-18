package cn.tannn.cat.block.controller.dto.user;

import cn.tannn.cat.block.enums.UserRole;
import cn.tannn.jdevelops.annotations.jpa.JpaSelectIgnoreField;
import cn.tannn.jdevelops.util.jpa.request.PagingSorteds;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户分页查询DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "用户分页查询")
public class UserPage implements Serializable {

    @Schema(description = "用户名(模糊匹配)", example = "admin")
    private String username;

    @Schema(description = "角色", example = "USER")
    private UserRole role;

    @Schema(description = "是否启用", example = "true")
    private Boolean isActive;

    /**
     * 分页排序
     */
    @Schema(description = "分页排序")
    @JpaSelectIgnoreField
    @Valid
    private PagingSorteds page;

    public PagingSorteds getPage() {
        if (page == null) {
            return new PagingSorteds().fixSort(1, "isActive");
        }
        return page.append(1, "isActive");
    }
}
