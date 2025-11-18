package cn.tannn.cat.block.util;


import cn.tannn.cat.block.controller.LoginController;
import cn.tannn.jdevelops.jwt.standalone.util.JwtWebUtil;
import cn.tannn.jdevelops.utils.jwt.core.JwtService;
import cn.tannn.jdevelops.utils.jwt.module.LoginJwtExtendInfo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

/**
 * 用户相关
 *
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2024/7/8 下午12:35
 */
@Slf4j
public class UserUtil extends cn.tannn.jdevelops.jwt.standalone.util.UserUtil{
    /**
     * 获得 LoginJwtExtendInfo
     *
     * @param request HttpServletRequest
     * @return LoginJwtExtendInfo
     */
    public static LoginJwtExtendInfo<String> getLoginJwtExtendInfoExpires(HttpServletRequest request) {
        String token = JwtWebUtil.getToken(request);
        return JwtService.getLoginJwtExtendInfoExpires(token);
    }


    /**
     * 获得 userId
     * @param request HttpServletRequest
     * @return userId
     */
    public static String userId(HttpServletRequest request) {
        return getLoginJwtExtendInfoExpires(request).getUserId();
    }


    /**
     * 获得 userId
     * @param request HttpServletRequest
     * @return userId
     */
    public static Long userId2(HttpServletRequest request) {
        return Long.valueOf(getLoginJwtExtendInfoExpires(request).getUserId());
    }

    /**
     * 获得 loginName
     * <p> jwt subject = loginName   {@link LoginController#login}</p>
     * @param request HttpServletRequest
     * @return loginName
     */
    public static String loginName(HttpServletRequest request) {
        return JwtWebUtil.getTokenSubjectExpires(request);
    }



}
