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
 * Python环境表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "python_environments", indexes = {
        @Index(name = "idx_name", columnList = "name", unique = true)
})
@Comment("Python环境表")
public class PythonEnvironment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("主键ID")
    private Integer id;

    @Column(unique = true, nullable = false, length = 100)
    @Comment("环境名称")
    private String name;

    @Column(nullable = false, length = 20)
    @Comment("Python版本")
    private String pythonVersion;

    @Column(length = 500)
    @Comment("环境描述")
    private String description;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("已安装包列表")
    private JSONObject packages;

    @Comment("是否默认环境")
    @ColumnDefault("'true'")
    private Boolean isDefault;

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
        if (isDefault == null) {
            isDefault = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updateTime = LocalDateTime.now();
    }
}
