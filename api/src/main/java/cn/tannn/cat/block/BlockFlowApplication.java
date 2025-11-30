package cn.tannn.cat.block;

import cn.tannn.cat.block.contansts.DefAccountLoginName;
import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.service.UserService;
import cn.tannn.jdevelops.autoschema.scan.EnableAutoSchema;
import cn.tannn.jdevelops.result.response.ResultVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static cn.tannn.jdevelops.knife4j.core.constant.PublicConstant.COLON;
import static cn.tannn.jdevelops.knife4j.core.constant.PublicConstant.SPIRIT;
import static cn.tannn.jdevelops.knife4j.core.util.SwaggerUtil.getRealIp;

@SpringBootApplication
@EnableAutoSchema
@Slf4j
public class BlockFlowApplication   implements ApplicationRunner {
    @Value("${server.port:8080}")
    private int serverPort;

    @Autowired
    private  UserService userService;

    @Value("${server.servlet.context-path:/}")
    private String serverName;
    public static void main(String[] args) {
        SpringApplication.run(BlockFlowApplication.class, args);
    }
    @Override
    public void run(ApplicationArguments args) throws Exception {

        if (SPIRIT.equals(serverName)) {
            serverName = "";
        }
        log.info("=======================init user 自己输入==================================");
        log.info("=======================用户 密码 14159==================================");
        log.info("== INSERT INTO `users` (`create_time`, `update_time`, `email`, `is_active`, `last_login_time`, `password`, `real_name`, `role`, `username`) VALUES ('2025-11-17 13:30:13.938430', '2025-11-17 13:30:13.938430', '550019013@qq.com', b'1', NULL, '$2a$10$rta3sjpv15.5HT3BQ9tp9eoi4.r/e9tj7/vkCYwwQfonYYziU8GoK', '谭宁', 'ADMIN', 'admin'); =====");

        log.info(""" 
                
                =====================================================================
                ========web地址：(http://%s =============================
                =====================================================================
                """.formatted(getRealIp() + COLON + serverPort + serverName ));
    }
}
