package cn.tannn.cat.block.controller.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * 登录返回
 *
 * @author tn
 * @version 1.0
 * @data 2022/12/30 15:14
 */
@Schema(description = "登录VO")
@Getter
@Setter
@ToString
@Builder
public class LoginVO {

    @Schema(description = "token")
    private String token;

    public LoginVO(String token) {
        this.token = token;
    }

}

