package cn.tannn.cat.block.controller;


import cn.tannn.cat.block.controller.dto.user.LoginPassword;
import cn.tannn.cat.block.controller.dto.user.LoginVO;
import cn.tannn.cat.block.entity.User;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.jdevelops.annotations.web.authentication.ApiMapping;
import cn.tannn.jdevelops.annotations.web.constant.PlatformConstant;
import cn.tannn.jdevelops.annotations.web.mapping.PathRestController;
import cn.tannn.jdevelops.jwt.standalone.pojo.TokenSign;
import cn.tannn.jdevelops.jwt.standalone.service.LoginService;
import cn.tannn.jdevelops.jwt.standalone.util.JwtWebUtil;
import cn.tannn.jdevelops.result.response.ResultVO;
import cn.tannn.jdevelops.utils.jwt.module.LoginJwtExtendInfo;
import cn.tannn.jdevelops.utils.jwt.module.SignEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.extensions.ExtensionProperty;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import javax.security.auth.login.LoginContext;
import java.util.Collections;
import java.util.List;
import java.util.Optional;



/**
 * 登录管理
 *
 * @author tnnn
 */
@Tag(name = "登录管理", description = "登录管理",
        extensions = {
                @Extension(properties = {
                        @ExtensionProperty(name = "x-order", value = "1", parseValue = true)
                })
        })
@PathRestController
@RequiredArgsConstructor
@Slf4j
public class LoginController {

    private final LoginService loginService;
    private final UserService userService;

    /**
     * 登录
     * @return ResultVO
     */
    @Operation(summary = "账户密码登录")
    @ApiMapping(value = "/login", checkToken = false, method = RequestMethod.POST)
    public ResultVO<LoginVO> login(@RequestBody @Valid LoginPassword pwd, HttpServletRequest request) throws IllegalAccessException {
        User login = userService.login(pwd.getLoginName(), pwd.getPassword());
        SignEntity<Object> objectSignEntity = SignEntity.initPlatform2(login.getUsername());
        TokenSign token = loginService.login(objectSignEntity);
        return ResultVO.success(new LoginVO(token.getSign()));
    }


}
