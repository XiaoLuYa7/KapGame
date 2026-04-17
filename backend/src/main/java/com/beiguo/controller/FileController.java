package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    // 静态资源目录（与 WebMvcConfig 中的目录一致）
    private static final String STATIC_RESOURCES_DIR = "static-resources";

    // 允许的文件类型
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList("video/mp4", "video/webm", "video/ogg");
    private static final List<String> ALLOWED_AUDIO_TYPES = Arrays.asList("audio/mpeg", "audio/ogg", "audio/wav", "audio/mp3");
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList("application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    // 最大文件大小 (50MB)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    @PostMapping("/upload")
    public ApiResponse<String> uploadFile(@RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "type", defaultValue = "general") String type) {
        // 验证文件是否为空
        if (file.isEmpty()) {
            return ApiResponse.error("文件不能为空");
        }

        // 验证文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            return ApiResponse.error("文件大小不能超过 50MB");
        }

        // 获取原始文件名
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            return ApiResponse.error("文件名无效");
        }

        // 获取文件类型
        String contentType = file.getContentType();

        // 验证文件类型
        if (!isAllowedType(contentType)) {
            return ApiResponse.error("不支持的文件类型: " + contentType);
        }

        try {
            // 创建上传目录
            String uploadDir = getUploadDirectory(type);
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // 生成唯一文件名
            String extension = getFileExtension(originalFilename);
            String newFilename = UUID.randomUUID().toString() + extension;

            // 保存文件
            Path filePath = Paths.get(uploadDir, newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 返回访问 URL
            String accessUrl = "/static/" + type + "/" + newFilename;

            return ApiResponse.success("文件上传成功", accessUrl);

        } catch (IOException e) {
            e.printStackTrace();
            return ApiResponse.error("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件访问URL
     */
    @GetMapping("/url")
    public ApiResponse<String> getFileUrl(@RequestParam("path") String path) {
        // 防止路径遍历攻击
        if (path.contains("..") || path.contains("//")) {
            return ApiResponse.error("无效的路径");
        }

        String fullPath = STATIC_RESOURCES_DIR + "/" + path;
        File file = new File(fullPath);

        if (!file.exists()) {
            return ApiResponse.error("文件不存在");
        }

        return ApiResponse.success("/static/" + path);
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/delete")
    public ApiResponse<Void> deleteFile(@RequestParam("path") String path) {
        // 防止路径遍历攻击
        if (path.contains("..") || path.contains("//")) {
            return ApiResponse.error("无效的路径");
        }

        String fullPath = STATIC_RESOURCES_DIR + "/" + path;
        File file = new File(fullPath);

        if (!file.exists()) {
            return ApiResponse.error("文件不存在");
        }

        if (file.delete()) {
            return ApiResponse.success("文件删除成功", null);
        } else {
            return ApiResponse.error("文件删除失败");
        }
    }

    /**
     * 检查文件类型是否允许
     */
    private boolean isAllowedType(String contentType) {
        if (contentType == null) return false;
        return ALLOWED_IMAGE_TYPES.contains(contentType) ||
               ALLOWED_VIDEO_TYPES.contains(contentType) ||
               ALLOWED_AUDIO_TYPES.contains(contentType) ||
               ALLOWED_DOCUMENT_TYPES.contains(contentType);
    }

    /**
     * 获取上传目录
     */
    private String getUploadDirectory(String type) {
        // 根据类型创建子目录
        String subDir;
        if (ALLOWED_IMAGE_TYPES.stream().anyMatch(t -> t.contains(type))) {
            subDir = "images";
        } else if (ALLOWED_VIDEO_TYPES.stream().anyMatch(t -> t.contains(type))) {
            subDir = "videos";
        } else if (ALLOWED_AUDIO_TYPES.stream().anyMatch(t -> t.contains(type))) {
            subDir = "audio";
        } else if (ALLOWED_DOCUMENT_TYPES.stream().anyMatch(t -> t.contains(type))) {
            subDir = "documents";
        } else {
            subDir = type; // 使用指定的类型名作为目录
        }

        return STATIC_RESOURCES_DIR + "/" + subDir;
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0) {
            return filename.substring(dotIndex);
        }
        return "";
    }
}
