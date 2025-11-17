package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.entity.User;
import cn.tannn.cat.block.repository.PythonEnvironmentRepository;
import cn.tannn.cat.block.repository.UserRepository;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.jdevelops.exception.built.UserException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;

import static cn.tannn.jdevelops.utils.jwt.exception.UserCode.USER_EXIST_ERROR;

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
        // todo 验证密码 错误直接抛异常

        // 更新登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);
        return user;
    }

    @Override
    public void register(AccountRegisterAdmin register) {
        User user = new User();
        user.setUsername(register.getUsername());
        user.setPassword(register.getPassword());
        user.setEmail(register.getEmail());
        user.setRealName(register.getRealName());
        user.setRole(register.getUserRole());
        user.setIsActive(true);
        userRepository.save(user);
    }
}
