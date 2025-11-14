package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import com.alibaba.fastjson2.JSONObject;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
public class Block extends EntityPfield {

    @Column(nullable = false, length = 100)
    @Comment("块名称")
    @Schema(description = "块名称")
    private String name;

    @Column(nullable = false, length = 50)
    @Schema(description = "块类型标识")
    @Comment("块类型标识")
    private String typeCode;

    @Column(columnDefinition = "TEXT")
    @Schema(description = "块描述")
    @Comment("块描述")
    private String description;

    @Column(length = 20)
    @Comment("块颜色")
    @Schema(description = "块颜色")
    @ColumnDefault("'#5C7CFA'")
    private String color;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("执行脚本")
    @Schema(description = "执行脚本")
    private String script;

    @Column()
    @Comment("Python环境ID")
    @Schema(description = "Python环境ID")
    private Integer pythonEnvId;

    @Column(columnDefinition = "JSON")
    @Schema(description = "输入参数定义")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输入参数定义")
    private JSONObject inputs;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("输出参数定义")
    @Schema(description = "输出参数定义")
    private JSONObject outputs;

    @Comment("是否公开")
    @Schema(description = "是否公开")
    @ColumnDefault("1")
    private Boolean isPublic;

    @Column(length = 200)
    @Comment("创建者登录名")
    @Schema(description = "创建者登录名")
    private String authorUsername;

}
