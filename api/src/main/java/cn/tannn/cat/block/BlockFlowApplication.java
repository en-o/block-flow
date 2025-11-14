package cn.tannn.cat.block;

import cn.tannn.jdevelops.autoschema.scan.EnableAutoSchema;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableAutoSchema
public class BlockFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlockFlowApplication.class, args);
    }

}
