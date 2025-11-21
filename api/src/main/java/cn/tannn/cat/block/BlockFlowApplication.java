package cn.tannn.cat.block;

import cn.tannn.jdevelops.autoschema.scan.EnableAutoSchema;
import lombok.extern.slf4j.Slf4j;
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

        log.info(""" 
                
                =====================================================================
                ========web地址：(http://%s =============================
                =====================================================================
                """.formatted(getRealIp() + COLON + serverPort + serverName ));
    }
}
