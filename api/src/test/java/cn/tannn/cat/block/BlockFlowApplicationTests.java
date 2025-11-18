package cn.tannn.cat.block;

import cn.tannn.cat.block.contansts.DefAccountLoginName;
import cn.tannn.cat.block.controller.dto.user.AccountRegisterAdmin;
import cn.tannn.cat.block.enums.UserRole;
import cn.tannn.cat.block.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BlockFlowApplicationTests {

    @Autowired
    private UserService userService;

    @Test
    void contextLoads() {
    }

//    @Test
    void initUser(){
        AccountRegisterAdmin admin = new AccountRegisterAdmin();
        admin.setUsername(DefAccountLoginName.ADMIN);
        admin.setPassword("14159");
        admin.setEmail("550019013@qq.com");
        admin.setRealName("谭宁");
        admin.setUserRole(UserRole.ADMIN);
        userService.register(admin);
    }

}
