package cn.tannn.cat.block.controller.dto.pythonenvironment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 包上传结果DTO
 *
 * @author tnnn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "包上传结果")
public class PackageUploadResultDTO implements Serializable {

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "文件大小（字节）")
    private Long fileSize;

    @Schema(description = "上传时间")
    private String uploadTime;

    @Schema(description = "保存路径")
    private String savePath;
}
