package cn.tannn.cat.block.controller.dto.blocklyblock;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import jakarta.validation.constraints.NotNull;

/**
 * Blockly块更新DTO
 *
 * @author tnnn
 */
@Getter
@Setter
@ToString
public class BlocklyBlockUpdateDTO {

    /**
     * 块ID
     * 必填
     */
    @NotNull(message = "块ID不能为空")
    private Integer id;

    /**
     * 块类型
     * 可选
     */
    private String type;

    /**
     * 块名称
     * 可选
     */
    private String name;

    /**
     * 块分类
     * 可选
     */
    private String category;

    /**
     * 块颜色
     * 可选
     */
    private String color;

    /**
     * 块定义（JSON格式）
     * 可选
     */
    private String definition;

    /**
     * Python代码生成器
     * 可选
     */
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
     * 可选
     */
    private Boolean enabled;

    /**
     * 排序顺序
     * 可选
     */
    private Integer sortOrder;
}
