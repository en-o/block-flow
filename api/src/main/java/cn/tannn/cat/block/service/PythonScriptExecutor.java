package cn.tannn.cat.block.service;

import cn.tannn.cat.block.entity.PythonEnvironment;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONException;
import com.alibaba.fastjson2.JSONObject;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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

    // 默认超时时间：60秒
    private static final long DEFAULT_TIMEOUT = 60;

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
        return execute(pythonEnvId, scriptContent, inputs, DEFAULT_TIMEOUT);
    }

    /**
     * 执行Python脚本（带超时）
     *
     * @param pythonEnvId   Python环境ID
     * @param scriptContent 脚本内容
     * @param inputs        输入参数
     * @param timeoutSeconds 超时时间（秒）
     * @return 执行结果
     */
    public ExecutionResult execute(Integer pythonEnvId, String scriptContent, Map<String, Object> inputs, long timeoutSeconds) {
        ExecutionResult result = new ExecutionResult();
        result.setSuccess(false);

        Process process = null;
        File tempScript = null;
        File tempInputFile = null;

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

            // 包装脚本：添加输入参数读取和输出格式化逻辑
            String wrappedScript = wrapScript(scriptContent, inputs != null && !inputs.isEmpty());

            // 创建临时脚本文件
            tempScript = File.createTempFile("python_script_", ".py");
            tempScript.deleteOnExit();
            java.nio.file.Files.write(tempScript.toPath(), wrappedScript.getBytes(StandardCharsets.UTF_8));

            // 如果有输入参数，创建临时输入文件
            List<String> command = new ArrayList<>();
            command.add(environment.getPythonExecutable());
            command.add(tempScript.getAbsolutePath());

            if (inputs != null && !inputs.isEmpty()) {
                tempInputFile = File.createTempFile("python_input_", ".json");
                tempInputFile.deleteOnExit();
                String inputJson = JSON.toJSONString(inputs);
                java.nio.file.Files.write(tempInputFile.toPath(), inputJson.getBytes(StandardCharsets.UTF_8));
                command.add(tempInputFile.getAbsolutePath());
                log.info("输入参数: {}", inputJson);
            }

            // 构建ProcessBuilder
            ProcessBuilder pb = new ProcessBuilder(command);

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

            // 不合并错误输出，分别读取
            pb.redirectErrorStream(false);

            // 执行脚本
            long startTime = System.currentTimeMillis();
            process = pb.start();

            // 读取标准输出和错误输出
            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            // 启动线程读取stdout
            Process finalProcess = process;
            Thread stdoutReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stdout.append(line).append("\n");
                        log.debug("Python stdout: {}", line);
                    }
                } catch (IOException e) {
                    log.error("读取stdout失败", e);
                }
            });

            // 启动线程读取stderr
            Process finalProcess1 = process;
            Thread stderrReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess1.getErrorStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stderr.append(line).append("\n");
                        log.debug("Python stderr: {}", line);
                    }
                } catch (IOException e) {
                    log.error("读取stderr失败", e);
                }
            });

            stdoutReader.start();
            stderrReader.start();

            // 等待执行完成（带超时）
            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            long endTime = System.currentTimeMillis();

            // 等待输出读取完成
            stdoutReader.join(1000);
            stderrReader.join(1000);

            if (!finished) {
                process.destroyForcibly();
                result.setSuccess(false);
                result.setErrorMessage("脚本执行超时（" + timeoutSeconds + "秒）");
                result.setOutput(stdout.toString());
                result.setError(stderr.toString());
                result.setExecutionTime(endTime - startTime);
                log.error("脚本执行超时");
                return result;
            }

            int exitCode = process.exitValue();
            result.setExitCode(exitCode);
            result.setExecutionTime(endTime - startTime);
            result.setOutput(stdout.toString().trim());
            result.setError(stderr.toString().trim());

            if (exitCode == 0) {
                result.setSuccess(true);

                // 尝试解析JSON输出
                String output = result.getOutput();
                if (output != null && !output.isEmpty()) {
                    try {
                        JSONObject jsonOutput = JSON.parseObject(output);
                        result.setJsonOutput(jsonOutput);
                        log.info("脚本执行成功，耗时: {}ms, 输出: {}", result.getExecutionTime(), jsonOutput);
                    } catch (JSONException e) {
                        log.info("脚本执行成功，耗时: {}ms, 输出（非JSON）: {}", result.getExecutionTime(), output);
                    }
                } else {
                    log.info("脚本执行成功，耗时: {}ms, 无输出", result.getExecutionTime());
                }
            } else {
                result.setSuccess(false);
                result.setErrorMessage("脚本执行失败，退出代码: " + exitCode);
                log.error("脚本执行失败，退出代码: {}, stdout: {}, stderr: {}", exitCode, stdout, stderr);
            }

        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage("脚本执行异常: " + e.getMessage());
            log.error("脚本执行异常", e);
        } finally {
            // 清理资源
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
            // 临时文件会通过deleteOnExit自动删除
        }

        return result;
    }

    /**
     * 包装Python脚本，添加输入输出处理逻辑
     */
    private String wrapScript(String userScript, boolean hasInputs) {
        StringBuilder wrapped = new StringBuilder();
        wrapped.append("# -*- coding: utf-8 -*-\n");
        wrapped.append("import sys\n");
        wrapped.append("import json\n");
        wrapped.append("\n");

        if (hasInputs) {
            wrapped.append("# 读取输入参数\n");
            wrapped.append("try:\n");
            wrapped.append("    if len(sys.argv) > 1:\n");
            wrapped.append("        with open(sys.argv[1], 'r', encoding='utf-8') as f:\n");
            wrapped.append("            inputs = json.load(f)\n");
            wrapped.append("    else:\n");
            wrapped.append("        inputs = {}\n");
            wrapped.append("except Exception as e:\n");
            wrapped.append("    print(json.dumps({'error': f'读取输入参数失败: {str(e)}'}))\n");
            wrapped.append("    sys.exit(1)\n");
            wrapped.append("\n");
        } else {
            wrapped.append("inputs = {}\n");
            wrapped.append("\n");
        }

        wrapped.append("# 用户脚本执行\n");
        wrapped.append("try:\n");
        // 缩进用户脚本 - 移除空行前后的空白，保持相对缩进
        String[] lines = userScript.split("\n", -1);
        for (String line : lines) {
            // 保持原有缩进，只在行首添加4个空格
            wrapped.append("    ").append(line).append("\n");
        }

        // 输出处理逻辑，保持在try块内，与用户脚本同级缩进
        wrapped.append("\n");
        wrapped.append("    # 输出结果（确保outputs变量存在）\n");
        wrapped.append("    if 'outputs' in locals() or 'outputs' in globals():\n");
        wrapped.append("        if isinstance(outputs, dict):\n");
        wrapped.append("            print(json.dumps(outputs, ensure_ascii=False))\n");
        wrapped.append("        else:\n");
        wrapped.append("            print(json.dumps({'result': outputs}, ensure_ascii=False))\n");
        wrapped.append("    else:\n");
        wrapped.append("        print(json.dumps({'success': True}, ensure_ascii=False))\n");

        // except块与try对齐
        wrapped.append("except Exception as e:\n");
        wrapped.append("    import traceback\n");
        wrapped.append("    error_msg = traceback.format_exc()\n");
        wrapped.append("    print(json.dumps({'error': str(e), 'traceback': error_msg}, ensure_ascii=False))\n");
        wrapped.append("    sys.exit(1)\n");

        return wrapped.toString();
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

        /** 标准错误输出 */
        private String error;

        /** JSON格式的输出（如果输出是有效的JSON） */
        private JSONObject jsonOutput;

        /** 退出代码 */
        private int exitCode;

        /** 错误信息 */
        private String errorMessage;

        /** 执行耗时（毫秒） */
        private long executionTime;
    }
}
