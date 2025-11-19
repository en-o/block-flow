package cn.tannn.cat.block.controller.dto.pythonenvironment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Python运行时上传结果DTO
 *
 * @author tnnn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Python运行时上传结果")
public class PythonRuntimeUploadResultDTO implements Serializable {

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "文件大小（字节）")
    private Long fileSize;

    @Schema(description = "上传时间")
    private String uploadTime;

    @Schema(description = "解压路径")
    private String extractPath;

    @Schema(description = "检测到的Python可执行文件路径")
    private String pythonExecutable;

    @Schema(description = "检测到的Python版本")
    private String pythonVersion;

    @Schema(description = "检测到的site-packages路径")
    private String sitePackagesPath;
}
