package cn.tannn.cat.block.controller.dto.pythonenvironment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 已上传包文件信息DTO
 *
 * @author tnnn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "已上传包文件信息")
public class UploadedPackageFileDTO implements Serializable {

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "文件大小（字节）")
    private Long fileSize;

    @Schema(description = "文件类型")
    private String fileType;

    @Schema(description = "上传时间")
    private Long uploadTime;

    @Schema(description = "是否已安装")
    private Boolean installed;
}
