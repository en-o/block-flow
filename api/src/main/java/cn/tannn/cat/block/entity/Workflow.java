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
 * 流程定义表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "workflows", indexes = {
        @Index(name = "idx_author", columnList = "authorUsername"),
        @Index(name = "idx_category", columnList = "category"),
        @Index(name = "idx_active", columnList = "isActive")
})
@Comment("流程定义表")
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("主键ID")
    private Long id;

    @Column(nullable = false, length = 100)
    @Comment("流程名称")
    private String name;

    @Column(columnDefinition = "TEXT")
    @Comment("流程描述")
    private String description;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("Blockly XML数据")
    private String blocklyXml;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("Blockly JSON数据")
    private JSONObject blocklyJson;

    @Column()
    @Comment("创建者登录名")
    private String authorUsername;

    @Comment("是否为模板")
    @ColumnDefault("0")
    private Boolean isTemplate;

    @Column(length = 50)
    @Comment("流程分类")
    private String category;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("标签")
    private String tags;


    @Comment("是否启用")
    @ColumnDefault("1")
    private Boolean isActive;

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
        if (isTemplate == null) {
            isTemplate = false;
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
