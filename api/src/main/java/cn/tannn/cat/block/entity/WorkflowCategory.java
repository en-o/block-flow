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
 * 流程分类表
 *
 * @author tnnn
 */
@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "workflow_categories", indexes = {
        @Index(name = "idx_code", columnList = "code", unique = true),
        @Index(name = "idx_sort_order", columnList = "sortOrder")
})
@Comment("流程分类表")
public class WorkflowCategory extends EntityPfield {

    @Column(nullable = false, length = 100, unique = true)
    @Comment("分类代码")
    @Schema(description = "分类代码")
    private String code;

    @Column(nullable = false, length = 100)
    @Comment("分类名称")
    @Schema(description = "分类名称")
    private String name;

    @Comment("排序（升序）")
    @ColumnDefault("0")
    @Schema(description = "排序（升序）")
    private Integer sortOrder;

}
