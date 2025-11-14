package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
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

/**
 * 块类型表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "block_types", indexes = {
        @Index(name = "idx_code", columnList = "code", unique = true)
})
@Comment("块类型表")
public class BlockType extends EntityPfield {

    @Column(unique = true, nullable = false, length = 100)
    @Comment("类型代码")
    @Schema(description = "类型代码")
    private String code;

    @Column(nullable = false, length = 100)
    @Comment("类型名称")
    @Schema(description = "类型名称")
    private String name;

    @Column(columnDefinition = "INT")
    @Comment("排序[升序]")
    @ColumnDefault("0")
    @Schema(description = "排序[升序]")
    private Integer sortOrder;

}
