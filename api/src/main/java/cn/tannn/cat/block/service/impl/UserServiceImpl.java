package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.user.*;
import cn.tannn.cat.block.entity.User;
import cn.tannn.cat.block.repository.UserRepository;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.cat.block.util.BCryptUtil;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.exception.built.UserException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

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
    @Transactional(rollbackFor = Exception.class)
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User update(UserUpdateDTO updateDTO) {
        User user = userRepository.findById(updateDTO.getId())
                .orElseThrow(() -> new BusinessException("用户不存在: " + updateDTO.getId()));

        // 检查邮箱唯一性
        if (updateDTO.getEmail() != null && !updateDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updateDTO.getEmail())) {
                throw new BusinessException("邮箱已被使用: " + updateDTO.getEmail());
            }
        }

        // 更新字段
        if (updateDTO.getEmail() != null) {
            user.setEmail(updateDTO.getEmail());
        }
        if (updateDTO.getRealName() != null) {
            user.setRealName(updateDTO.getRealName());
        }
        if (updateDTO.getRole() != null) {
            user.setRole(updateDTO.getRole());
        }
        if (updateDTO.getIsActive() != null) {
            user.setIsActive(updateDTO.getIsActive());
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException("用户不存在: " + id);
        }
        userRepository.deleteById(id);
        log.info("删除用户: {}", id);
    }

    @Override
    public User getById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在: " + id));
    }

    @Override
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在: " + username));
    }

    @Override
    public List<User> listAll() {
        return userRepository.findAll();
    }

    @Override
    public Page<User> findPage(UserPage where) {
        Specification<User> baseSpec = EnhanceSpecification.beanWhere(where);

        // 如果有用户名查询，添加用户名模糊查询条件
        if (StringUtils.hasText(where.getUsername())) {
            Specification<User> usernameSpec = (root, query, criteriaBuilder) ->
                    criteriaBuilder.like(root.get("username"), "%" + where.getUsername() + "%");
            baseSpec = baseSpec == null ? usernameSpec : baseSpec.and(usernameSpec);
        }

        return userRepository.findAll(baseSpec, where.getPage().pageable());
    }

    @Override
    public List<User> search(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return userRepository.findAll();
        }

        Specification<User> spec = (root, query, criteriaBuilder) -> {
            String pattern = "%" + keyword + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(root.get("username"), pattern),
                    criteriaBuilder.like(root.get("email"), pattern),
                    criteriaBuilder.like(root.get("realName"), pattern)
            );
        };

        return userRepository.findAll(spec);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User toggleActive(Integer id) {
        User user = getById(id);
        user.setIsActive(!user.getIsActive());
        log.info("切换用户{}启用状态: {}", id, user.getIsActive());
        return userRepository.save(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(Integer id, String newPassword) {
        User user = getById(id);
        // 使用用户名作为盐来加密新密码
        user.setPassword(BCryptUtil.hash(newPassword, user.getUsername()));
        userRepository.save(user);
        log.info("管理员重置用户{}密码", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(Integer userId, ChangePasswordDTO changePasswordDTO) {
        User user = getById(userId);

        // 验证旧密码
        if (!BCryptUtil.verify(changePasswordDTO.getOldPassword(), user.getPassword(), user.getUsername())) {
            throw new BusinessException("旧密码不正确");
        }

        // 设置新密码（使用用户名作为盐）
        user.setPassword(BCryptUtil.hash(changePasswordDTO.getNewPassword(), user.getUsername()));
        userRepository.save(user);
        log.info("用户{}修改密码成功", userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public User updateProfile(Integer userId, UpdateProfileDTO updateProfileDTO) {
        User user = getById(userId);

        // 检查邮箱唯一性
        if (updateProfileDTO.getEmail() != null && !updateProfileDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updateProfileDTO.getEmail())) {
                throw new BusinessException("邮箱已被使用: " + updateProfileDTO.getEmail());
            }
        }

        // 更新字段
        if (updateProfileDTO.getEmail() != null) {
            user.setEmail(updateProfileDTO.getEmail());
        }
        if (updateProfileDTO.getRealName() != null) {
            user.setRealName(updateProfileDTO.getRealName());
        }

        return userRepository.save(user);
    }
}
