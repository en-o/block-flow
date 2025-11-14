package cn.tannn.cat.block.entity;

import com.alibaba.fastjson2.JSONObject;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 块定义表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "blocks", indexes = {
        @Index(name = "idx_type_code", columnList = "typeCode"),
        @Index(name = "idx_name", columnList = "name", unique = true),
        @Index(name = "idx_author", columnList = "authorUsername")
})
@Comment("块定义表")
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("主键ID")
    private Integer id;

    @Column(nullable = false, length = 100)
    @Comment("块名称")
    private String name;

    @Column(nullable = false, length = 50)
    @Comment("块类型标识")
    private String typeCode;

    @Column(columnDefinition = "TEXT")
    @Comment("块描述")
    private String description;

    @Column(length = 20)
    @Comment("块颜色")
    private String color;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("执行脚本")
    private String script;

    @Column()
    @Comment("Python环境ID")
    private Integer pythonEnvId;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输入参数定义")
    private JSONObject inputs;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输出参数定义")
    private JSONObject outputs;

    @Column(columnDefinition = "BOOLEAN")
    @ColumnDefault("'true'")
    @Comment("是否公开")
    private Boolean isPublic;

    @Column()
    @Comment("创建者登录名")
    private String authorUsername;

    @Column(nullable = false, updatable = false)
    @Comment("创建时间")
    private LocalDateTime createTime;

    @Column(nullable = false)
    @Comment("更新时间")
    private LocalDateTime updateTime;

    @PrePersist
    protected void onCreate() {
        createTime = LocalDateTime.now();
        updateTime = LocalDateTime.now();
        if (color == null || color.isEmpty()) {
            color = "#5C7CFA";
        }
        if (isPublic == null) {
            isPublic = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
