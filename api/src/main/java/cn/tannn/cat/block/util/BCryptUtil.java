package cn.tannn.cat.block.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * BCrypt 加密工具类（使用用户名作为盐的一部分）
 * 格式：hash(username + password) 或 hash(password + username)
 *
 * @author tnnn
 * @date 2025/11/17
 */
public class BCryptUtil {

    /**
     * 加密密码（将用户名作为盐的前缀）
     *
     * @param password 明文密码
     * @param username 用户名
     * @return 加密后的密码
     */
    public static String hash(String password, String username) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("密码不能为空");
        }
        if (username == null || username.isEmpty()) {
            throw new IllegalArgumentException("用户名不能为空");
        }

        // 使用 username + password 的形式，增强安全性
        String saltedPassword = username + password;
        return BCrypt.hashpw(saltedPassword, BCrypt.gensalt(10));
    }

    /**
     * 验证密码
     *
     * @param password 明文密码
     * @param hashedPassword 加密后的密码
     * @param username 用户名（用于构造盐）
     * @return 是否匹配
     */
    public static boolean verify(String password, String hashedPassword, String username) {
        if (password == null || hashedPassword == null || username == null) {
            return false;
        }

        String saltedPassword = username + password;
        return BCrypt.checkpw(saltedPassword, hashedPassword);
    }
}
