package cn.tannn.cat.block.contansts.views;


/**
 * 用于序列化的视图
 */
public class Views extends cn.tannn.jdevelops.result.views.Views {

    /**
     * User - 用户的视图
     * <p> 需要返回密码请在接口标注这个 </p>
     */
    public static class UserPassword implements Public {}


    /**
     * User - 用户的视图
     * <p> 需要返回敏感信息请在接口标注这个 </p>
     */
    public static class UserSensitive implements Public {}

    /**
     * User - 用户的视图
     * <p> 密保相关 </p>
     */
    public static class UserSecurityQuestion implements Public {}
}
