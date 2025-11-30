package cn.tannn.cat.block.controller.dto.blocklyblock;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Blockly块创建DTO
 *
 * @author tnnn
 */
@Getter
@Setter
@ToString
public class BlocklyBlockCreateDTO {

    /**
     * 块类型（唯一标识符）
     * 必填，用于在Blockly中唯一标识此块
     */
    @NotBlank(message = "块类型不能为空")
    private String type;

    /**
     * 块名称
     * 必填，用于在管理界面显示
     */
    @NotBlank(message = "块名称不能为空")
    private String name;

    /**
     * 块分类
     * 必填，用于在工具箱中分组
     */
    @NotBlank(message = "块分类不能为空")
    private String category;

    /**
     * 块颜色（16进制）
     * 可选，例如：#5B80A5
     */
    private String color;

    /**
     * 块定义（JSON格式）
     * 必填，Blockly块的完整定义
     */
    @NotBlank(message = "块定义不能为空")
    private String definition;

    /**
     * Python代码生成器（JavaScript代码）
     * 必填，定义如何转换为Python代码
     */
    @NotBlank(message = "Python代码生成器不能为空")
    private String pythonGenerator;

    /**
     * 块描述
     * 可选
     */
    private String description;

    /**
     * 示例代码
     * 可选
     */
    private String example;

    /**
     * 是否启用
     * 默认true
     */
    private Boolean enabled;

    /**
     * 排序顺序
     * 可选，默认0
     */
    private Integer sortOrder;

    /**
     * 是否为系统块
     * 可选，默认false
     */
    private Boolean isSystem;
}
