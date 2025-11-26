package cn.tannn.cat.block.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 进度日志服务 - 用于实时推送上传/安装进度
 *
 * @author tnnn
 */
@Slf4j
@Service
public class ProgressLogService {

    /**
     * 存储每个任务的SSE连接
     * key: taskId (例如: "upload-python-{envId}")
     * value: SseEmitter
     */
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * 创建SSE连接
     */
    public SseEmitter createEmitter(String taskId) {
        log.info("创建SSE连接，taskId: {}", taskId);

        // 如果已存在连接，先关闭旧连接
        SseEmitter oldEmitter = emitters.get(taskId);
        if (oldEmitter != null) {
            log.warn("taskId {} 已存在SSE连接，关闭旧连接", taskId);
            try {
                oldEmitter.complete();
            } catch (Exception e) {
                log.debug("关闭旧SSE连接时出错: {}", e.getMessage());
            }
            emitters.remove(taskId);
        }

        // 超时时间设置为10分钟
        SseEmitter emitter = new SseEmitter(600000L);

        emitter.onCompletion(() -> {
            log.info("SSE连接完成，taskId: {}", taskId);
            emitters.remove(taskId);
        });

        emitter.onTimeout(() -> {
            log.warn("SSE连接超时，taskId: {}", taskId);
            emitters.remove(taskId);
        });

        emitter.onError((e) -> {
            log.error("SSE连接错误，taskId: {}, error: {}", taskId, e.getMessage());
            emitters.remove(taskId);
        });

        emitters.put(taskId, emitter);

        // 发送初始化消息，确认连接已建立
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("SSE连接已建立"));
            log.info("SSE连接建立成功，taskId: {}", taskId);
        } catch (IOException e) {
            log.error("发送SSE初始化消息失败，taskId: {}", taskId, e);
            emitters.remove(taskId);
        }

        return emitter;
    }

    /**
     * 发送日志消息
     */
    public void sendLog(String taskId, String message) {
        SseEmitter emitter = emitters.get(taskId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("log")
                        .data(message));
            } catch (IOException e) {
                log.error("发送SSE日志失败，taskId: {}, message: {}", taskId, message, e);
                emitters.remove(taskId);
            }
        } else {
            log.warn("未找到SSE连接，taskId: {}, 无法发送日志: {}", taskId, message);
        }
    }

    /**
     * 发送进度消息
     */
    public void sendProgress(String taskId, int progress, String message) {
        SseEmitter emitter = emitters.get(taskId);
        if (emitter != null) {
            try {
                Map<String, Object> data = Map.of(
                        "progress", progress,
                        "message", message
                );
                emitter.send(SseEmitter.event()
                        .name("progress")
                        .data(data));
            } catch (IOException e) {
                log.error("发送SSE进度失败，taskId: {}, progress: {}", taskId, progress, e);
                emitters.remove(taskId);
            }
        } else {
            log.warn("未找到SSE连接，taskId: {}, 无法发送进度: {}%", taskId, progress);
        }
    }

    /**
     * 发送完成消息
     */
    public void sendComplete(String taskId, boolean success, String message) {
        SseEmitter emitter = emitters.get(taskId);
        if (emitter != null) {
            try {
                Map<String, Object> data = Map.of(
                        "success", success,
                        "message", message
                );
                emitter.send(SseEmitter.event()
                        .name("complete")
                        .data(data));
                emitter.complete();
            } catch (IOException e) {
                log.error("发送SSE完成消息失败，taskId: {}", taskId, e);
            } finally {
                emitters.remove(taskId);
            }
        } else {
            log.warn("未找到SSE连接，taskId: {}, 无法发送完成消息", taskId);
        }
    }

    /**
     * 发送错误消息
     */
    public void sendError(String taskId, String error) {
        SseEmitter emitter = emitters.get(taskId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(error));
                emitter.completeWithError(new RuntimeException(error));
            } catch (IOException e) {
                log.error("发送SSE错误消息失败，taskId: {}", taskId, e);
            } finally {
                emitters.remove(taskId);
            }
        } else {
            log.warn("未找到SSE连接，taskId: {}, 无法发送错误消息: {}", taskId, error);
        }
    }
}
