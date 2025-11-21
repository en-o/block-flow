package cn.tannn.cat.block.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 上下文变量工具类
 *
 * @author tnnn
 */
public class ContextVariableUtil {

    /**
     * 从Python脚本中提取上下文变量的 key
     * 匹配 inputs.get('ctx.XXX') 或 inputs.get("ctx.XXX") 格式
     *
     * @param script Python脚本
     * @return 上下文变量 key 列表（去重）
     */
    public static List<String> extractContextKeys(String script) {
        List<String> keys = new ArrayList<>();
        if (script == null || script.isEmpty()) {
            return keys;
        }

        // 匹配 inputs.get('ctx.XXX') 或 inputs.get("ctx.XXX")
        Pattern pattern = Pattern.compile(
            "inputs\\.get\\(['\"]ctx\\.([A-Za-z0-9_]+)['\"]"
        );
        Matcher matcher = pattern.matcher(script);

        while (matcher.find()) {
            String key = matcher.group(1); // 提取 XXX 部分
            if (!keys.contains(key)) {
                keys.add(key);
            }
        }

        return keys;
    }
}
