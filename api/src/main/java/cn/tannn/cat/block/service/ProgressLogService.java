package cn.tannn.cat.block.service;

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
        // 超时时间设置为10分钟
        SseEmitter emitter = new SseEmitter(600000L);

        emitter.onCompletion(() -> emitters.remove(taskId));
        emitter.onTimeout(() -> emitters.remove(taskId));
        emitter.onError((e) -> emitters.remove(taskId));

        emitters.put(taskId, emitter);
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
                emitters.remove(taskId);
            }
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
                emitters.remove(taskId);
            }
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
                // ignore
            } finally {
                emitters.remove(taskId);
            }
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
                // ignore
            } finally {
                emitters.remove(taskId);
            }
        }
    }
}
