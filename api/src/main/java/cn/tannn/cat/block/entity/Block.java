package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import cn.tannn.cat.block.enums.DefinitionMode;
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

import java.util.List;

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

    @Column(length = 100)
    @Comment("块图标")
    @Schema(description = "块图标")
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("定义模式:blockly-可视化,code-代码")
    @Schema(description = "定义模式")
    @ColumnDefault("'CODE'")
    private DefinitionMode definitionMode;

    @Lob
    @Column(columnDefinition = "TEXT")
    @Comment("Blockly XML定义(仅blockly模式)")
    @Schema(description = "Blockly XML定义")
    private String blocklyDefinition;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("Python执行脚本(可由Blockly生成或手动编写)")
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


    @Column(length = 20)
    @Comment("版本号")
    @Schema(description = "版本号")
    @ColumnDefault("'1.0.0'")
    private String version;

    @Column(columnDefinition = "JSON")
    @Schema(description = "标签列表")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("标签列表，用于typecode的细分表示")
    private List<String> tags;

}
