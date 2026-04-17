package com.beiguo.dto;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private boolean requiresReLogin; // 标记当前用户是否需要重新登录

    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.requiresReLogin = false;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "成功", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>(true, "成功", null);
    }

    public static ApiResponse<Void> successMessage(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public void setRequiresReLogin(boolean requiresReLogin) {
        this.requiresReLogin = requiresReLogin;
    }
}