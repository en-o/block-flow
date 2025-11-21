package cn.tannn.cat.block.controller;

import cn.tannn.jdevelops.annotations.web.authentication.ApiMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * SPA 前端路由控制器
 * 用于处理前端路由的直接访问，避免 404 错误
 *
 * @author tannn
 */
@Controller
public class SpaController {

    /**
     * 处理前端路由
     * 将所有前端路由请求转发到 index.html
     * Spring Boot 会自动从 static 目录查找
     * 此处的 login是get表示这个controller不会跟LoginController中的post接口冲突的
     */
    @ApiMapping(value = {
            "/",
            "/login",
            "/manage",
            "/flow",
            "/manage/**"
    },method = RequestMethod.GET, checkToken = false)
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
