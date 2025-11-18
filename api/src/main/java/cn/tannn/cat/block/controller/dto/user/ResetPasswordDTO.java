package cn.tannn.cat.block.controller.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * 重置密码请求DTO
 *
 * @author tnnn
 */
@Data
@Schema(description = "重置密码请求")
public class ResetPasswordDTO implements Serializable {

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 50, message = "密码长度必须在6-50个字符之间")
    @Schema(description = "新密码", example = "newPassword123", requiredMode = Schema.RequiredMode.REQUIRED)
    private String newPassword;
}
