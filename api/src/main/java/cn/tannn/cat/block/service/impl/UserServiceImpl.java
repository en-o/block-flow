package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.entity.User;
import cn.tannn.cat.block.repository.UserRepository;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.cat.block.util.BCryptUtil;
import cn.tannn.jdevelops.exception.built.UserException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static cn.tannn.jdevelops.utils.jwt.exception.UserCode.*;

/**
 * 用户
 *
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2025/11/17 10:26
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserException(USER_EXIST_ERROR));

        // 验证用户状态
        if (!user.getIsActive()) {
            log.warn("用户登录失败：账户被禁用 - {}", username);
            throw new UserException(BANNED_ACCOUNT);
        }

        // 验证密码（使用用户名作为盐）
        if (!BCryptUtil.verify(password, user.getPassword(), user.getUsername())) {
            log.warn("用户登录失败：密码错误 - {}", username);
            throw new UserException(USER_PASSWORD_ERROR);
        }

        // 更新登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
        return user;
    }

    @Override
    public void register(AccountRegisterAdmin register) {
        // 验证用户名唯一性
        if (userRepository.existsByUsername(register.getUsername())) {
            log.error("用户注册失败：用户名已存在 - {}", register.getUsername());
            throw new UserException("用户注册失败：用户名已存在");
        }
        // 验证邮箱唯一性
        if (register.getEmail() != null && userRepository.existsByEmail(register.getEmail())) {
            log.error("用户注册失败：邮箱已存在 - {}", register.getEmail());
            throw new UserException("用户注册失败：邮箱已存在");
        }

        User user = new User();
        user.setUsername(register.getUsername());
        // 使用用户名作为盐来加密密码
        user.setPassword(BCryptUtil.hash(register.getPassword(), register.getUsername()));
        user.setEmail(register.getEmail());
        user.setRealName(register.getRealName());
        user.setRole(register.getUserRole());
        user.setIsActive(true);
        userRepository.save(user);
    }
}
