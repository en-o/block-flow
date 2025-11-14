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
public class PythonEnvironment  extends EntityPfield {

    @Column(unique = true, nullable = false, length = 100)
    @Comment("环境名称")
    @Schema(description = "环境名称")
    private String name;

    @Column(nullable = false, length = 20)
    @Comment("Python版本")
    @Schema(description = "Python版本")
    private String pythonVersion;

    @Column(length = 500)
    @Comment("环境描述")
    @Schema(description = "环境描述")
    private String description;

    @Column(columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    @Comment("已安装包列表")
    @Schema(description = "已安装包列表")
    private JSONObject packages;

    @Comment("是否默认环境")
    @ColumnDefault("0")
    @Schema(description = "是否默认环境")
    private Boolean isDefault;


}
