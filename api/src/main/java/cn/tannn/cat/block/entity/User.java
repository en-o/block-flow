package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import cn.tannn.cat.block.contansts.views.Views;
import cn.tannn.cat.block.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.v3.oas.annotations.media.Schema;
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
        @Index(name = "idx_email", columnList = "email")
})
@Comment("用户表")
@JsonView({Views.Public.class})
public class User  extends EntityPfield {


    @Column(unique = true, nullable = false, length = 50)
    @Comment("用户名")
    @Schema(description = "用户名")
    private String username;

    @Column(nullable = false, length = 255)
    @Comment("密码(BCrypt加密)")
    @Schema(description = "密码(BCrypt加密)")
    @JsonView(Views.UserPassword.class)
    private String password;

    @Column(unique = true, length = 100)
    @Comment("邮箱")
    @Schema(description = "邮箱")
    private String email;

    @Column(length = 50)
    @Comment("真实姓名")
    @Schema(description = "真实姓名")
    private String realName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("角色: admin/user/viewer")
    @ColumnDefault("'USER'")
    @Schema(description = "角色")
    private UserRole role;

    @Comment("是否启用")
    @ColumnDefault("1")
    @Schema(description = "是否启用")
    private Boolean isActive;

    @Column()
    @Comment("最后登录时间")
    @Schema(description = "最后登录时间")
    @JsonFormat(locale = "zh", timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLoginTime;


}
