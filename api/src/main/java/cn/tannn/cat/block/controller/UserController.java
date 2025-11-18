package cn.tannn.cat.block.controller;

import cn.tannn.cat.block.contansts.JpaPageResult;
import cn.tannn.cat.block.controller.dto.user.*;
import cn.tannn.cat.block.entity.User;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.cat.block.util.UserUtil;
import cn.tannn.jdevelops.annotations.web.mapping.PathRestController;
import cn.tannn.jdevelops.result.response.ResultPageVO;
import cn.tannn.jdevelops.result.response.ResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.extensions.ExtensionProperty;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户管理Controller
 *
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2025/11/18 14:01
 */
@Tag(name = "用户管理", description = "用户管理",
        extensions = {
                @Extension(properties = {
                        @ExtensionProperty(name = "x-order", value = "3", parseValue = true)
                })
        })
@PathRestController
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PutMapping("/users")
    @Operation(summary = "更新用户", description = "更新用户信息")
    public ResultVO<User> update(@RequestBody @Valid UserUpdateDTO updateDTO) {
        return ResultVO.success(userService.update(updateDTO));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "删除用户", description = "根据ID删除用户")
    public ResultVO<Void> delete(@Parameter(description = "用户ID") @PathVariable Integer id) {
        userService.delete(id);
        return ResultVO.success();
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "获取用户详情", description = "根据ID获取用户详情")
    public ResultVO<User> getById(@Parameter(description = "用户ID") @PathVariable Integer id) {
        return ResultVO.success(userService.getById(id));
    }

    @GetMapping("/users/username/{username}")
    @Operation(summary = "根据用户名获取用户", description = "根据用户名获取用户")
    public ResultVO<User> getByUsername(@Parameter(description = "用户名") @PathVariable String username) {
        return ResultVO.success(userService.getByUsername(username));
    }

    @GetMapping("/users/list")
    @Operation(summary = "获取所有用户列表", description = "获取所有用户列表")
    public ResultVO<List<User>> listAll() {
        return ResultVO.success(userService.listAll());
    }

    @PostMapping("/users/page")
    @Operation(summary = "分页查询用户", description = "分页查询用户列表")
    public ResultPageVO<User, JpaPageResult<User>> page(@RequestBody @Valid UserPage where) {
        return ResultPageVO.success(JpaPageResult.toPage(userService.findPage(where)));
    }

    @GetMapping("/users/search")
    @Operation(summary = "搜索用户", description = "根据关键词搜索用户")
    public ResultVO<List<User>> search(@Parameter(description = "搜索关键词") @RequestParam String keyword) {
        return ResultVO.success(userService.search(keyword));
    }

    @PutMapping("/users/{id}/toggle-active")
    @Operation(summary = "激活/停用用户", description = "切换用户的激活状态")
    public ResultVO<User> toggleActive(@Parameter(description = "用户ID") @PathVariable Integer id) {
        return ResultVO.success(userService.toggleActive(id));
    }

    @PutMapping("/users/{id}/reset-password")
    @Operation(summary = "重置用户密码", description = "管理员重置用户密码")
    public ResultVO<Void> resetPassword(
            @Parameter(description = "用户ID") @PathVariable Integer id,
            @RequestBody @Valid ResetPasswordDTO resetPasswordDTO) {
        userService.resetPassword(id, resetPasswordDTO.getNewPassword());
        return ResultVO.success();
    }

    @PutMapping("/users/profile/password")
    @Operation(summary = "修改密码", description = "修改自己的密码")
    public ResultVO<Void> changePassword(
            @RequestBody @Valid ChangePasswordDTO changePasswordDTO,
            HttpServletRequest request) {
        // 从JWT token中获取当前登录用户的用户名
        String username = UserUtil.loginName(request);
        User currentUser = userService.getByUsername(username);
        userService.changePassword(currentUser.getId(), changePasswordDTO);
        return ResultVO.success();
    }

    @PutMapping("/users/profile")
    @Operation(summary = "更新个人信息", description = "更新自己的个人信息")
    public ResultVO<User> updateProfile(
            @RequestBody @Valid UpdateProfileDTO updateProfileDTO,
            HttpServletRequest request) {
        // 从JWT token中获取当前登录用户的用户名
        String username = UserUtil.loginName(request);
        User currentUser = userService.getByUsername(username);
        return ResultVO.success(userService.updateProfile(currentUser.getId(), updateProfileDTO));
    }

    @GetMapping("/users/profile")
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的信息")
    public ResultVO<User> getProfile(HttpServletRequest request) {
        // 从JWT token中获取当前登录用户的用户名
        String username = UserUtil.loginName(request);
        return ResultVO.success(userService.getByUsername(username));
    }
}
