package cn.tannn.cat.block.service;

import cn.tannn.cat.block.entity.PythonEnvironment;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.Map;

/**
 * Python脚本执行器
 * 负责在隔离的Python环境中执行脚本
 *
 * @author tnnn
 */
@Component
@Slf4j
public class PythonScriptExecutor {

    private final PythonEnvironmentService pythonEnvironmentService;

    public PythonScriptExecutor(PythonEnvironmentService pythonEnvironmentService) {
        this.pythonEnvironmentService = pythonEnvironmentService;
    }

    /**
     * 执行Python脚本
     *
     * @param pythonEnvId   Python环境ID
     * @param scriptContent 脚本内容
     * @param inputs        输入参数
     * @return 执行结果
     */
    public ExecutionResult execute(Integer pythonEnvId, String scriptContent, Map<String, Object> inputs) {
        ExecutionResult result = new ExecutionResult();
        result.setSuccess(false);

        try {
            // 获取Python环境
            PythonEnvironment environment;
            if (pythonEnvId == null) {
                log.info("未指定环境，使用默认环境");
                environment = pythonEnvironmentService.getDefaultEnvironment();
            } else {
                environment = pythonEnvironmentService.getById(pythonEnvId);
            }

            // 验证环境配置
            if (environment.getPythonExecutable() == null || environment.getPythonExecutable().isEmpty()) {
                result.setErrorMessage("Python环境未配置解释器路径");
                return result;
            }

            // 创建临时脚本文件
            File tempScript = File.createTempFile("python_script_", ".py");
            tempScript.deleteOnExit();
            java.nio.file.Files.write(tempScript.toPath(), scriptContent.getBytes());

            // 构建ProcessBuilder
            ProcessBuilder pb = new ProcessBuilder(
                    environment.getPythonExecutable(),
                    tempScript.getAbsolutePath());

            // 设置环境变量 - 关键：设置PYTHONPATH实现依赖隔离
            Map<String, String> envVars = pb.environment();
            if (environment.getSitePackagesPath() != null && !environment.getSitePackagesPath().isEmpty()) {
                String existingPythonPath = envVars.get("PYTHONPATH");
                String newPythonPath = environment.getSitePackagesPath();
                if (existingPythonPath != null && !existingPythonPath.isEmpty()) {
                    newPythonPath = newPythonPath + File.pathSeparator + existingPythonPath;
                }
                envVars.put("PYTHONPATH", newPythonPath);
                log.info("设置PYTHONPATH: {}", newPythonPath);
            }

            // 合并标准输出和错误输出
            pb.redirectErrorStream(true);

            // 执行脚本
            long startTime = System.currentTimeMillis();
            Process process = pb.start();

            // 读取输出
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.debug("Python输出: {}", line);
                }
            }

            // 等待执行完成
            int exitCode = process.waitFor();
            long endTime = System.currentTimeMillis();

            result.setOutput(output.toString());
            result.setExitCode(exitCode);
            result.setExecutionTime(endTime - startTime);

            if (exitCode == 0) {
                result.setSuccess(true);
                log.info("脚本执行成功，耗时: {}ms", result.getExecutionTime());
            } else {
                result.setSuccess(false);
                result.setErrorMessage("脚本执行失败，退出代码: " + exitCode);
                log.error("脚本执行失败，退出代码: {}, 输出: {}", exitCode, output);
            }

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("脚本执行异常: " + e.getMessage());
            log.error("脚本执行异常", e);
        }

        return result;
    }

    /**
     * 执行结果
     */
    @Data
    public static class ExecutionResult {
        /** 是否执行成功 */
        private boolean success;

        /** 标准输出 */
        private String output;

        /** 退出代码 */
        private int exitCode;

        /** 错误信息 */
        private String errorMessage;

        /** 执行耗时（毫秒） */
        private long executionTime;
    }
}
