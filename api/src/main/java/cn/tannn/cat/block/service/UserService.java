package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.entity.User;
import jakarta.validation.Valid;

/**
 * 用户
 *
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2025/11/17 10:25
 */
public interface UserService {

    /**
     * 登录
     * @param username 账户
     * @param password 密码
     * @return token
     */
    User login(String username, String password);


    /**
     * 注册用户
     * @param register AccountRegisterAdmin
     */
    void register(AccountRegisterAdmin register);
}
