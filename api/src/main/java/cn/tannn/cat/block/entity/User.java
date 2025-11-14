package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import cn.tannn.cat.block.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 用户表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users", indexes = {
        @Index(name = "idx_username", columnList = "username", unique = true),
        @Index(name = "idx_email", columnList = "email", unique = true)
})
@Comment("用户表")
public class User  extends EntityPfield {


    @Column(unique = true, nullable = false, length = 50)
    @Comment("用户名")
    private String username;

    @Column(nullable = false, length = 255)
    @Comment("密码(BCrypt加密)")
    private String password;

    @Column(unique = true, length = 100)
    @Comment("邮箱")
    private String email;

    @Column(length = 50)
    @Comment("真实姓名")
    private String realName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("角色: admin/user/viewer")
    @ColumnDefault("'USER'")
    private UserRole role;

    @Comment("是否启用")
    @ColumnDefault("1")
    private Boolean isActive;

    @Column()
    @Comment("最后登录时间")
    private LocalDateTime lastLoginTime;

    @Column(nullable = false, updatable = false)
    @Comment("创建时间")
    private LocalDateTime createTime;

    @Column(nullable = false)
    @Comment("更新时间")
    private LocalDateTime updateTime;

}
