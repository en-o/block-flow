package cn.tannn.cat.block.service.impl;

import cn.tannn.cat.block.controller.dto.execution.ExecutionLogPage;
import cn.tannn.cat.block.controller.dto.workflow.WorkflowExecuteDTO;
import cn.tannn.cat.block.entity.Block;
import cn.tannn.cat.block.entity.ContextVariable;
import cn.tannn.cat.block.entity.ExecutionLog;
import cn.tannn.cat.block.entity.Workflow;
import cn.tannn.cat.block.enums.ExecutionStatus;
import cn.tannn.cat.block.enums.TriggerType;
import cn.tannn.cat.block.repository.BlockRepository;
import cn.tannn.cat.block.repository.ContextVariableRepository;
import cn.tannn.cat.block.repository.ExecutionLogRepository;
import cn.tannn.cat.block.repository.WorkflowRepository;
import cn.tannn.cat.block.service.ExecutionService;
import cn.tannn.cat.block.service.PythonScriptExecutor;
import cn.tannn.cat.block.util.ContextVariableUtil;
import cn.tannn.jdevelops.exception.built.BusinessException;
import cn.tannn.jdevelops.result.exception.ServiceException;
import cn.tannn.jdevelops.util.jpa.select.EnhanceSpecification;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 执行管理Service实现
 *
 * @author tnnn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionServiceImpl implements ExecutionService {

    private final ExecutionLogRepository executionLogRepository;
    private final WorkflowRepository workflowRepository;
    private final BlockRepository blockRepository;
    private final ContextVariableRepository contextVariableRepository;
    private final PythonScriptExecutor pythonScriptExecutor;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExecutionLog execute(WorkflowExecuteDTO executeDTO) {
        // 验证流程是否存在
        Workflow workflow = workflowRepository.findById(executeDTO.getWorkflowId())
                .orElseThrow(() -> new BusinessException("请选择正确的流程"));

        // 创建执行记录
        ExecutionLog executionLog = new ExecutionLog();
        executionLog.setWorkflowId(executeDTO.getWorkflowId());
        executionLog.setWorkflowName(workflow.getName());
        executionLog.setExecutorUsername(executeDTO.getExecutorUsername());
        executionLog.setStatus(ExecutionStatus.RUNNING);
        executionLog.setTriggerType(TriggerType.MANUAL);
        executionLog.setInputParams(executeDTO.getInputParams());
        executionLog.setStartTime(LocalDateTime.now());

        // 保存执行记录
        executionLog = executionLogRepository.save(executionLog);

        log.info("流程执行已启动, executionId: {}, workflowId: {}, workflowName: {}",
                executionLog.getId(), workflow.getId(), workflow.getName());

        // 异步执行流程
        Long executionId = executionLog.getId();
        executeWorkflowAsync(executionId, workflow, executeDTO.getInputParams());

        return executionLog;
    }

    /**
     * 异步执行流程
     */
    @Async
    public void executeWorkflowAsync(Long executionId, Workflow workflow, JSONObject inputParams) {
        ExecutionLog executionLog = executionLogRepository.findById(executionId)
                .orElseThrow(() -> new RuntimeException("执行记录不存在"));

        LocalDateTime startTime = LocalDateTime.now();
        StringBuilder logsBuilder = new StringBuilder();
        logsBuilder.append("=== 流程执行开始 ===\n");
        logsBuilder.append(String.format("流程名称: %s\n", workflow.getName()));
        logsBuilder.append(String.format("执行时间: %s\n", startTime));
        logsBuilder.append(String.format("触发方式: %s\n", executionLog.getTriggerType()));
        logsBuilder.append("\n");

        try {
            // 解析流程定义
            JSONObject flowDefinition = workflow.getFlowDefinition();
            if (flowDefinition == null) {
                throw new RuntimeException("流程定义为空");
            }

            JSONArray nodes = flowDefinition.getJSONArray("nodes");
            JSONArray edges = flowDefinition.getJSONArray("edges");

            if (nodes == null || nodes.isEmpty()) {
                throw new RuntimeException("流程中没有节点");
            }

            logsBuilder.append(String.format("解析流程定义: 共 %d 个节点, %d 条连接\n\n",
                    nodes.size(), edges != null ? edges.size() : 0));

            // 构建节点映射
            Map<String, JSONObject> nodeMap = new HashMap<>();
            for (int i = 0; i < nodes.size(); i++) {
                JSONObject node = nodes.getJSONObject(i);
                nodeMap.put(node.getString("id"), node);
            }

            // 构建依赖图和入度
            Map<String, List<String>> graph = new HashMap<>(); // nodeId -> [依赖的nodeId列表]
            Map<String, Integer> inDegree = new HashMap<>();

            // 初始化
            for (String nodeId : nodeMap.keySet()) {
                graph.put(nodeId, new ArrayList<>());
                inDegree.put(nodeId, 0);
            }

            // 构建依赖关系
            if (edges != null) {
                for (int i = 0; i < edges.size(); i++) {
                    JSONObject edge = edges.getJSONObject(i);
                    String source = edge.getString("source");
                    String target = edge.getString("target");

                    graph.get(target).add(source); // target依赖于source
                    inDegree.put(target, inDegree.get(target) + 1);
                }
            }

            // 拓扑排序
            List<String> executionOrder = topologicalSort(nodeMap.keySet(), graph, inDegree);
            if (executionOrder == null) {
                throw new RuntimeException("流程中存在循环依赖，无法执行");
            }

            logsBuilder.append("执行顺序:\n");
            for (int i = 0; i < executionOrder.size(); i++) {
                String nodeId = executionOrder.get(i);
                JSONObject node = nodeMap.get(nodeId);
                JSONObject nodeData = node.getJSONObject("data");
                logsBuilder.append(String.format("  %d. %s (块ID: %s)\n",
                        i + 1,
                        nodeData.getString("blockName"),
                        nodeData.getInteger("blockId")));
            }
            logsBuilder.append("\n");

            // 更新日志
            executionLog.setLogs(logsBuilder.toString());
            executionLogRepository.save(executionLog);

            // 存储每个节点的输出结果
            Map<String, Map<String, Object>> nodeOutputs = new HashMap<>();

            // 按顺序执行每个节点
            for (int i = 0; i < executionOrder.size(); i++) {
                String nodeId = executionOrder.get(i);
                JSONObject node = nodeMap.get(nodeId);
                JSONObject nodeData = node.getJSONObject("data");

                Integer blockId = nodeData.getInteger("blockId");
                String blockName = nodeData.getString("blockName");

                logsBuilder.append(String.format("--- 执行节点 [%d/%d]: %s ---\n",
                        i + 1, executionOrder.size(), blockName));

                // 从快照获取块信息（优先使用快照，兼容旧流程）
                JSONObject blockSnapshot = nodeData.getJSONObject("blockSnapshot");
                String script;
                Integer pythonEnvId;

                if (blockSnapshot != null && blockSnapshot.getString("script") != null) {
                    // 使用快照中的块信息
                    script = blockSnapshot.getString("script");
                    pythonEnvId = blockSnapshot.getInteger("pythonEnvId");
                    logsBuilder.append("  使用流程快照中的块定义\n");
                } else {
                    // 兼容旧流程：从数据库获取块定义
                    Block block = blockRepository.findById(blockId)
                            .orElseThrow(() -> new RuntimeException("块不存在: " + blockName));
                    script = block.getScript();
                    pythonEnvId = block.getPythonEnvId();
                    logsBuilder.append("  使用数据库中的块定义（旧流程兼容模式）\n");
                }

                // 准备输入参数
                Map<String, Object> blockInputs = new HashMap<>();

                // 1. 添加用户配置的输入值
                JSONObject inputValues = nodeData.getJSONObject("inputValues");
                if (inputValues != null) {
                    blockInputs.putAll(inputValues);
                }

                // 2. 添加从前置节点传递的数据
                if (edges != null) {
                    for (int j = 0; j < edges.size(); j++) {
                        JSONObject edge = edges.getJSONObject(j);
                        if (nodeId.equals(edge.getString("target"))) {
                            String sourceNodeId = edge.getString("source");
                            String sourceHandle = edge.getString("sourceHandle"); // "output-xxx"
                            String targetHandle = edge.getString("targetHandle"); // "input-xxx"

                            if (nodeOutputs.containsKey(sourceNodeId)) {
                                Map<String, Object> sourceOutput = nodeOutputs.get(sourceNodeId);
                                String outputKey = sourceHandle.replace("output-", "");
                                String inputKey = targetHandle.replace("input-", "");

                                if (sourceOutput.containsKey(outputKey)) {
                                    blockInputs.put(inputKey, sourceOutput.get(outputKey));
                                    logsBuilder.append(String.format("  接收参数: %s = %s (来自前置节点)\n",
                                            inputKey, sourceOutput.get(outputKey)));
                                }
                            }
                        }
                    }
                }

                // 3. 添加全局输入参数
                if (inputParams != null) {
                    blockInputs.putAll(inputParams);
                }

                // 4. 注入上下文变量（仅注入脚本中实际使用的上下文变量）
                if (script != null && script.contains("ctx.")) {
                    // 解析脚本中使用的上下文变量 key
                    List<String> contextKeys = ContextVariableUtil.extractContextKeys(script);
                    if (!contextKeys.isEmpty()) {
                        // 根据 key 查询对应的上下文变量
                        List<ContextVariable> contextVariables = contextVariableRepository.findByVarKeyIn(contextKeys);
                        for (ContextVariable cv : contextVariables) {
                            String key = "ctx." + cv.getVarKey();
                            blockInputs.put(key, cv.getVarValue());
                        }
                        if (!contextVariables.isEmpty()) {
                            logsBuilder.append(String.format("  注入上下文变量: %d 个 %s\n",
                                contextVariables.size(),
                                contextVariables.stream()
                                    .map(ContextVariable::getVarKey)
                                    .collect(Collectors.joining(", ", "[", "]"))));
                        }
                    }
                }

                logsBuilder.append(String.format("  输入参数: %s\n", blockInputs));

                // 执行块
                try {
                    PythonScriptExecutor.ExecutionResult result = pythonScriptExecutor.execute(
                            pythonEnvId,
                            script,
                            blockInputs,
                            60L
                    );

                    if (result.isSuccess()) {
                        logsBuilder.append(String.format("  ✓ 执行成功 (耗时: %dms)\n", result.getExecutionTime()));

                        // 保存输出结果
                        Map<String, Object> output = result.getJsonOutput();
                        if (output != null) {
                            nodeOutputs.put(nodeId, output);
                            logsBuilder.append(String.format("  输出结果: %s\n", output));
                        }

                        // 如果有控制台输出，记录
                        if (output != null && output.containsKey("_console_output")) {
                            logsBuilder.append("  控制台输出:\n");
                            String consoleOutput = (String) output.get("_console_output");
                            Arrays.stream(consoleOutput.split("\n"))
                                    .forEach(line -> logsBuilder.append("    ").append(line).append("\n"));
                        }
                    } else {
                        throw new RuntimeException(String.format("块执行失败: %s", result.getError()));
                    }
                } catch (Exception e) {
                    logsBuilder.append(String.format("  ✗ 执行失败: %s\n", e.getMessage()));
                    throw e;
                }

                logsBuilder.append("\n");

                // 更新日志
                executionLog.setLogs(logsBuilder.toString());
                executionLogRepository.save(executionLog);
            }

            // 流程执行成功
            LocalDateTime endTime = LocalDateTime.now();
            logsBuilder.append("=== 流程执行成功 ===\n");
            logsBuilder.append(String.format("结束时间: %s\n", endTime));

            // 构建最终输出
            JSONObject finalOutput = new JSONObject();
            finalOutput.put("success", true);
            finalOutput.put("message", "流程执行成功");
            finalOutput.put("nodeOutputs", nodeOutputs);

            executionLog.setStatus(ExecutionStatus.SUCCESS);
            executionLog.setOutputResult(finalOutput);
            executionLog.setLogs(logsBuilder.toString());
            executionLog.setEndTime(endTime);
            executionLog.setDuration((int) Duration.between(startTime, endTime).getSeconds());

            executionLogRepository.save(executionLog);

            log.info("流程执行成功: executionId={}, workflowId={}, duration={}s",
                    executionId, workflow.getId(), executionLog.getDuration());

        } catch (Exception e) {
            // 流程执行失败
            LocalDateTime endTime = LocalDateTime.now();
            logsBuilder.append("\n=== 流程执行失败 ===\n");
            logsBuilder.append(String.format("错误信息: %s\n", e.getMessage()));
            logsBuilder.append(String.format("结束时间: %s\n", endTime));

            executionLog.setStatus(ExecutionStatus.FAILED);
            executionLog.setErrorMessage(e.getMessage());
            executionLog.setLogs(logsBuilder.toString());
            executionLog.setEndTime(endTime);
            executionLog.setDuration((int) Duration.between(startTime, endTime).getSeconds());

            executionLogRepository.save(executionLog);

            log.error("流程执行失败: executionId={}, workflowId={}, error={}",
                    executionId, workflow.getId(), e.getMessage(), e);
        }
    }

    /**
     * 拓扑排序
     *
     * @param nodes    所有节点ID
     * @param graph    依赖图
     * @param inDegree 入度
     * @return 排序后的节点ID列表，如果存在循环返回null
     */
    private List<String> topologicalSort(Set<String> nodes,
                                         Map<String, List<String>> graph,
                                         Map<String, Integer> inDegree) {
        List<String> result = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();

        // 找到所有入度为0的节点
        for (String nodeId : nodes) {
            if (inDegree.get(nodeId) == 0) {
                queue.offer(nodeId);
            }
        }

        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);

            // 遍历所有依赖当前节点的节点
            for (String nodeId : nodes) {
                if (graph.get(nodeId).contains(current)) {
                    inDegree.put(nodeId, inDegree.get(nodeId) - 1);
                    if (inDegree.get(nodeId) == 0) {
                        queue.offer(nodeId);
                    }
                }
            }
        }

        // 如果有节点未被访问，说明存在循环
        return result.size() == nodes.size() ? result : null;
    }

    @Override
    public ExecutionLog getById(Long id) {
        return executionLogRepository.findById(id)
                .orElseThrow(() -> new ServiceException(500,"执行记录不存在"));
    }


    @Override
    public Page<ExecutionLog> findPage(ExecutionLogPage where) {
        Specification<ExecutionLog> select = EnhanceSpecification.beanWhere(where);
        return executionLogRepository.findAll(select, where.getPage().pageable());
    }

    @Override
    public String getLogs(Long id) {
        ExecutionLog executionLog = getById(id);
        return executionLog.getLogs();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExecutionLog cancel(Long id) {
        ExecutionLog executionLog = getById(id);

        if (executionLog.getStatus() != ExecutionStatus.RUNNING) {
            throw new ServiceException(500,"只能取消正在运行的执行");
        }

        executionLog.setStatus(ExecutionStatus.CANCELLED);
        executionLog.setEndTime(LocalDateTime.now());

        // 计算执行时长
        if (executionLog.getStartTime() != null && executionLog.getEndTime() != null) {
            Duration duration = Duration.between(executionLog.getStartTime(), executionLog.getEndTime());
            executionLog.setDuration((int) duration.getSeconds());
        }

        // TODO: 实际取消执行的逻辑需要在这里实现
        log.info("执行已取消, executionId: {}, workflowId: {}", id, executionLog.getWorkflowId());

        return executionLogRepository.save(executionLog);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (!executionLogRepository.existsById(id)) {
            throw new ServiceException(500,"执行记录不存在");
        }
        executionLogRepository.deleteById(id);
    }

    @Override
    public Long getExecutionCount(Long workflowId) {
        return executionLogRepository.countByWorkflowId(workflowId);
    }

    @Override
    public Long getSuccessExecutionCount(Long workflowId) {
        return executionLogRepository.countSuccessByWorkflowId(workflowId);
    }

    @Override
    public Long getFailedExecutionCount(Long workflowId) {
        return executionLogRepository.countFailedByWorkflowId(workflowId);
    }
}
