package cn.tannn.cat.block.contansts;

import java.util.Arrays;
import java.util.List;

/**
 * 默认用户
 *
 * @author tnnn
 * @version V1.0
 * @date 2022-07-21 09:37
 */
public interface DefAccountLoginName {

    /**
     * 超级管理员
     */
    String ADMINISTRATORS = "administrator";

    /**
     * 超级管理员
     */
    String ADMIN = "admin";


    /**
     * 超管
     */
    List<String> SUPPER_USER = Arrays.asList(ADMINISTRATORS,ADMIN);
}
