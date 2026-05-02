package com.beiguo.controller;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.User;
import com.beiguo.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/bind-phone")
    public ApiResponse<User> bindPhone(@Valid @RequestBody BindPhoneRequest request) {
        try {
            return ApiResponse.success("手机号保存成功", userService.bindPhone(request.getPhone(), request.getCode()));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/real-name")
    public ApiResponse<User> verifyRealName(@Valid @RequestBody RealNameRequest request) {
        try {
            return ApiResponse.success("实名认证成功", userService.verifyRealName(request.getRealName(), request.getIdCard()));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/settings")
    public ApiResponse<User> updateSettings(@RequestBody UserSettingsRequest request) {
        try {
            return ApiResponse.success(
                    "设置保存成功",
                    userService.updateUserSettings(
                            request.getSoundEffectsEnabled(),
                            request.getMusicEnabled(),
                            request.getVibrationEnabled()
                    )
            );
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @Data
    public static class BindPhoneRequest {
        @NotBlank(message = "手机号不能为空")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
        private String phone;

        @NotBlank(message = "验证码不能为空")
        @Pattern(regexp = "^\\d{6}$", message = "验证码格式不正确")
        private String code;
    }

    @Data
    public static class RealNameRequest {
        @NotBlank(message = "真实姓名不能为空")
        private String realName;

        @NotBlank(message = "身份证号不能为空")
        @Pattern(
                regexp = "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$",
                message = "身份证号格式不正确"
        )
        private String idCard;
    }

    @Data
    public static class UserSettingsRequest {
        private Boolean soundEffectsEnabled;
        private Boolean musicEnabled;
        private Boolean vibrationEnabled;
    }
}
