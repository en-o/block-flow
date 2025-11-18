package cn.tannn.cat.block.controller.dto.user;

import cn.tannn.cat.block.enums.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 用户更新请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "用户更新请求")
public class UserUpdateDTO implements Serializable {

    @NotNull(message = "用户ID不能为空")
    @Schema(description = "用户ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Email(message = "邮箱格式不正确")
    @Schema(description = "邮箱", example = "user@example.com")
    private String email;

    @Schema(description = "真实姓名", example = "张三")
    private String realName;

    @Schema(description = "角色", example = "USER")
    private UserRole role;

    @Schema(description = "是否启用", example = "true")
    private Boolean isActive;
}
