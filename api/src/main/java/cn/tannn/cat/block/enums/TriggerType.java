package cn.tannn.cat.block.enums;

/**
 * 触发方式枚举
 *
 * @author tnnn
 */
public enum TriggerType {
    /**
     * 手动触发
     */
    MANUAL,

    /**
     * 定时触发
     */
    SCHEDULE,

    /**
     * Webhook触发
     */
    WEBHOOK,

    /**
     * API触发
     */
    API
}
