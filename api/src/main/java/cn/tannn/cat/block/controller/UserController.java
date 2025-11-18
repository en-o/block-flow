package cn.tannn.cat.block.controller;

import cn.tannn.jdevelops.annotations.web.mapping.PathRestController;
import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.extensions.ExtensionProperty;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @author <a href="https://t.tannn.cn/">tan</a>
 * @version V1.0
 * @date 2025/11/18 14:01
 */
@Tag(name = "用户管理管理", description = "用户管理管理",
        extensions = {
                @Extension(properties = {
                        @ExtensionProperty(name = "x-order", value = "3", parseValue = true)
                })
        })
@PathRestController
@RequiredArgsConstructor
@Slf4j
public class UserController {
}
