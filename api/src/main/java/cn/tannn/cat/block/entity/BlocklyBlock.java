package cn.tannn.cat.block.entity;

import cn.tannn.cat.block.contansts.EntityPfield;
import com.fasterxml.jackson.annotation.JsonView;
import cn.tannn.cat.block.contansts.views.Views;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Comment;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Google Blockly自定义块实体
 * 用于存储和管理可视化编程块的定义
 *
 * @author tnnn
 */
@Entity
@Table(name = "blockly_blocks", indexes = {
        @Index(name = "idx_category", columnList = "category"),
        @Index(name = "idx_type", columnList = "type"),
        @Index(name = "idx_enabled", columnList = "enabled")
})
@Getter
@Setter
@ToString
@EntityListeners(AuditingEntityListener.class)
@Comment("Blockly自定义块配置表")
public class BlocklyBlock extends EntityPfield {

    /**
     * 块类型（唯一标识符）
     * 例如：'calculation_add', 'http_request', 'python_code'
     * 必须全局唯一，用于在Blockly工作区中标识块类型
     */
    @Column(nullable = false, unique = true, length = 100)
    @Comment("块类型（唯一标识）")
    private String type;

    /**
     * 块名称（显示名称）
     * 例如：'加法运算', 'HTTP请求', 'Python代码'
     * 用于在管理界面显示的友好名称
     */
    @Column(nullable = false, length = 100)
    @Comment("块名称")
    private String name;

    /**
     * 块分类
     * 例如：'calculation', 'http', 'datetime', 'python'
     * 用于在Blockly工具箱中分组显示
     */
    @Column(nullable = false, length = 50)
    @Comment("块分类")
    private String category;

    /**
     * 块颜色（16进制色值）
     * 例如：'#5B80A5', '#FF6B6B', '#4ECDC4'
     * 用于在Blockly工作区中显示块的背景色
     * 支持格式：#RRGGBB
     */
    @Column(length = 7)
    @Comment("块颜色")
    private String color;

    /**
     * 块定义（JSON格式）
     * 存储Blockly块的完整定义，包括：
     * - message0/message1: 块的显示文本
     * - args0/args1: 输入参数定义
     * - previousStatement/nextStatement: 连接类型
     * - output: 输出类型
     * - inputsInline: 是否内联输入
     * - tooltip: 提示文本
     * - helpUrl: 帮助链接
     *
     * 示例：
     * {
     *   "type": "calculation_add",
     *   "message0": "计算 %1 + %2",
     *   "args0": [
     *     {"type": "input_value", "name": "A", "check": "Number"},
     *     {"type": "input_value", "name": "B", "check": "Number"}
     *   ],
     *   "output": "Number",
     *   "colour": 230,
     *   "tooltip": "返回两数之和",
     *   "helpUrl": ""
     * }
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("块定义（JSON格式）")
    private String definition;

    /**
     * Python代码生成器（JavaScript代码）
     * 定义如何将此块转换为Python代码
     *
     * 必须是有效的JavaScript函数体代码，例如：
     * ```javascript
     * const value_a = Blockly.Python.valueToCode(block, 'A', Blockly.Python.ORDER_ATOMIC);
     * const value_b = Blockly.Python.valueToCode(block, 'B', Blockly.Python.ORDER_ATOMIC);
     * const code = `(${value_a} + ${value_b})`;
     * return [code, Blockly.Python.ORDER_ADDITION];
     * ```
     *
     * 注意事项：
     * 1. 使用Blockly.Python.valueToCode()获取输入值
     * 2. 使用Blockly.Python.statementToCode()获取语句
     * 3. 返回格式：[code, order] 或 code字符串
     * 4. order表示运算符优先级（Blockly.Python.ORDER_*）
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    @Comment("Python代码生成器")
    private String pythonGenerator;

    /**
     * 块描述
     * 详细说明此块的功能、用途、参数说明等
     * 用于帮助用户理解如何使用此块
     */
    @Column(columnDefinition = "TEXT")
    @Comment("块描述")
    private String description;

    /**
     * 示例代码/使用说明
     * 展示如何使用此块的示例
     * 可以包含多个示例场景
     */
    @Column(columnDefinition = "TEXT")
    @Comment("示例代码")
    private String example;

    /**
     * 是否启用
     * true: 启用，会在Blockly工具箱中显示
     * false: 禁用，不会在工具箱中显示，但保留定义
     */
    @Column(nullable = false)
    @Comment("是否启用")
    private Boolean enabled = true;

    /**
     * 排序顺序
     * 用于在同一分类中控制块的显示顺序
     * 数值越小越靠前
     */
    @Column
    @Comment("排序顺序")
    private Integer sortOrder = 0;


    /**
     * 是否为系统预置块
     * true: 系统预置块，不允许删除，但可以禁用
     * false: 用户自定义块，可以删除
     */
    @Column(nullable = false)
    @Comment("是否为系统块")
    private Boolean isSystem = false;

    /**
     * 版本号
     * 用于跟踪块定义的版本变化
     * 每次修改定义时应该递增
     */
    @Column
    @Comment("版本号")
    private Integer version = 1;
}
