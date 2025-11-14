package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import cn.tannn.cat.block.enums.Environment;
import cn.tannn.cat.block.enums.VarType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;

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
public class ContextVariable extends EntityPfield {

    @Column(unique = true, nullable = false, length = 100)
    @Comment("变量名")
    @Schema(description = "变量名")
    private String varKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("变量值")
    @Schema(description = "变量值")
    private String varValue;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("变量类型: text/secret/json/file")
    @ColumnDefault("'TEXT'")
    @Schema(description = "变量类型")
    private VarType varType;

    @Column(length = 50)
    @Comment("分组名称")
    @Schema(description = "分组名称")
    private String groupName;

    @Column(length = 500)
    @Comment("变量描述")
    @Schema(description = "变量描述")
    private String description;

    @Comment("是否加密")
    @ColumnDefault("0")
    @Schema(description = "是否加密")
    private Boolean isEncrypted;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Comment("环境: DEFAULT/DEV/TEST/PROD")
    @ColumnDefault("'DEFAULT'")
    @Schema(description = "环境")
    private Environment environment;

}
