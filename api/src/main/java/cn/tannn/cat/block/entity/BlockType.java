package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

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
    private String code;

    @Column(nullable = false, length = 100)
    @Comment("类型名称")
    private String name;

    @Column(columnDefinition = "INT")
    @Comment("排序")
    @ColumnDefault("0")
    private Integer sortOrder;

    @Column(nullable = false, updatable = false)
    @Comment("创建时间")
    private LocalDateTime createTime;

    @Column(nullable = false)
    @Comment("更新时间")
    private LocalDateTime updateTime;

}
