package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
        @Index(name = "idx_author_name", columnList = "authorUsername,name", unique = true),
        @Index(name = "idx_category", columnList = "category"),
        @Index(name = "idx_active", columnList = "isActive")
})
@Comment("流程定义表")
public class Workflow extends EntityPfield {


    @Column(nullable = false, length = 100)
    @Comment("流程名称")
    @Schema(description = "流程名称")
    private String name;

    @Column(columnDefinition = "TEXT")
    @Comment("流程描述")
    @Schema(description = "流程描述")
    private String description;

    @Column(nullable = false, columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("xyflow流程JSON定义(nodes+edges)")
    @Schema(description = "xyflow流程JSON定义")
    private JSONObject flowDefinition;

    @Column()
    @Comment("创建者登录名")
    @Schema(description = "创建者登录名")
    private String authorUsername;

    @Comment("是否为模板")
    @ColumnDefault("0")
    @Schema(description = "是否为模板")
    private Boolean isTemplate;

    @Column(length = 50)
    @Comment("流程分类")
    @Schema(description = "流程分类")
    private String category;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("标签")
    @Schema(description = "标签")
    private String tags;

    @Column(length = 20)
    @Comment("版本号")
    @Schema(description = "版本号")
    @ColumnDefault("'1.0.0'")
    private String version;

    @Comment("是否启用")
    @ColumnDefault("1")
    @Schema(description = "是否启用")
    private Boolean isActive;

    @Comment("是否公开")
    @ColumnDefault("0")
    @Schema(description = "是否公开")
    private Boolean isPublic;


}
