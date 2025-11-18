package cn.tannn.cat.block.controller.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import lombok.Data;

import java.io.Serializable;

/**
 * 更新个人信息请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "更新个人信息请求")
public class UpdateProfileDTO implements Serializable {

    @Email(message = "邮箱格式不正确")
    @Schema(description = "邮箱", example = "user@example.com")
    private String email;

    @Schema(description = "真实姓名", example = "张三")
    private String realName;
}
