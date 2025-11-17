package cn.tannn.cat.block.controller;

import cn.hutool.core.lang.tree.Tree;
import cn.tannn.cat.block.contansts.DefAccountLoginName;
import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.jdevelops.annotations.web.authentication.ApiMapping;
import cn.tannn.jdevelops.annotations.web.authentication.ApiPlatform;
import cn.tannn.jdevelops.annotations.web.constant.PlatformConstant;
import cn.tannn.jdevelops.annotations.web.mapping.PathRestController;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.extensions.ExtensionProperty;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


/**
 * 注册管理
 *
 * @author <a href="https://tannn.cn/">tan</a>
 * @date 2023/10/26 11:51
 */

@Tag(name = "注册管理", description = "注册管理",
        extensions = {
                @Extension(properties = {@ExtensionProperty(name = "x-order", value = "2", parseValue = true)})}
)
@PathRestController("register")
@RequiredArgsConstructor
@Slf4j
@Validated
public class RegisterController {

    private final UserService userService;


    @Operation(summary = "管理员添加用户")
    @ApiMapping(value = "system", method = RequestMethod.POST)
    @ApiPlatform(platform = PlatformConstant.WEB_ADMIN)
    @Transactional(rollbackFor = Exception.class)
    public ResultVO<String> admin(@RequestBody @Valid AccountRegisterAdmin register) {
        if (DefAccountLoginName.SUPPER_USER.contains(register.getUsername().toLowerCase())) {
            return ResultVO.failMessage("非法注册用户");
        }
        userService.register(register);
        return ResultVO.successMessage("账户添加成功");
    }



}
