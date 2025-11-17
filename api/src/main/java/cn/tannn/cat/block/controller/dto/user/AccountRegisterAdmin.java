package cn.tannn.cat.block.controller.dto.user;

import cn.tannn.cat.block.enums.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;


/**
 * 用户注册信息
 * <p> 管理员注册使用当前项目内置默认密码 </p>
 *
 * @author tn
 * @date 2025/6/19 14:49
 */
@Schema(description = "用户注册信息-管理员新增")
@ToString
@Getter
@Setter
@Valid
public class AccountRegisterAdmin {

    /**
     * 用户名
     */
    @Schema(description = "用户名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "用户名不允许为空")
    @Size(min = 3, max = 50, message = "登录名长度必须在3-50个字符之间")
    private String username;

    /**
     * 密码
     */
    @Schema(description = "密码", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "密码不允许为空")
    @Size(min = 3, max = 50, message = "登录名长度必须在3-50个字符之间")
    private String password;

    /**
     * 邮箱
     */
    @Schema(description = "邮箱")
    @Email(message = "邮箱格式有误")
    private String email;

    /**
     * 真实姓名
     */
    @Schema(description = "真实姓名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "真实姓名不允许为空")
    private String realName;

    /**
     * 角色
     */
    @Schema(description = "角色", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "必须设置角色")
    private UserRole userRole;

}
