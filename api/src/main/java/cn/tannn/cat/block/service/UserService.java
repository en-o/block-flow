package cn.tannn.cat.block.service;

import cn.tannn.cat.block.controller.dto.user.*;
import cn.tannn.cat.block.entity.User;
import org.springframework.data.domain.Page;

import java.util.List;

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

    /**
     * 更新用户
     * @param updateDTO 更新数据
     * @return 更新后的用户
     */
    User update(UserUpdateDTO updateDTO);

    /**
     * 删除用户
     * @param id 用户ID
     */
    void delete(Integer id);

    /**
     * 根据ID获取用户
     * @param id 用户ID
     * @return 用户
     */
    User getById(Integer id);

    /**
     * 根据用户名获取用户
     * @param username 用户名
     * @return 用户
     */
    User getByUsername(String username);

    /**
     * 获取所有用户列表
     * @return 用户列表
     */
    List<User> listAll();

    /**
     * 分页查询用户
     * @param where 查询条件
     * @return 分页结果
     */
    Page<User> findPage(UserPage where);

    /**
     * 搜索用户
     * @param keyword 关键词
     * @return 用户列表
     */
    List<User> search(String keyword);

    /**
     * 切换用户启用状态
     * @param id 用户ID
     * @return 更新后的用户
     */
    User toggleActive(Integer id);

    /**
     * 重置用户密码（管理员操作）
     * @param id 用户ID
     * @param newPassword 新密码
     */
    void resetPassword(Integer id, String newPassword);

    /**
     * 修改密码
     * @param userId 用户ID
     * @param changePasswordDTO 修改密码数据
     */
    void changePassword(Integer userId, ChangePasswordDTO changePasswordDTO);

    /**
     * 更新个人信息
     * @param userId 用户ID
     * @param updateProfileDTO 更新数据
     * @return 更新后的用户
     */
    User updateProfile(Integer userId, UpdateProfileDTO updateProfileDTO);
}
