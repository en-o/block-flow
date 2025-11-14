package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.enums.VarType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 上下文变量表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "context_variables", indexes = {
        @Index(name = "idx_key", columnList = "varKey"),
        @Index(name = "idx_group", columnList = "groupName"),
        @Index(name = "idx_env", columnList = "environment")
})
@Comment("上下文变量表")
public class ContextVariable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("主键ID")
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    @Comment("变量名")
    private String varKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("变量值")
    private String varValue;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("变量类型: text/secret/json/file")
    private VarType varType;

    @Column(length = 50)
    @Comment("分组名称")
    private String groupName;

    @Column(length = 500)
    @Comment("变量描述")
    private String description;

    @ColumnDefault("'FALSE'")
    @Comment("是否加密")
    private Boolean isEncrypted;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("环境: DEFAULT/DEV/TEST/PROD")
    private Environment environment;

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
        if (varType == null) {
            varType = VarType.TEXT;
        }
        if (isEncrypted == null) {
            isEncrypted = false;
        }
        if (environment == null) {
            environment = Environment.DEFAULT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
