package com.beiguo.dto.admin;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AdminAuthResponse {
    private String token;
    private String username;
    private Long adminId;
    private String role;
    private List<String> pages;          // 页面权限codes，如 ["MODULE:USER", "MODULE:CARD"]
    private Map<String, List<String>> functions; // 页面下的功能权限，如 {"MODULE:USER": ["VIEW", "CREATE", "EDIT", "DELETE"]}

    public AdminAuthResponse(String token, String username, Long adminId, String role,
                             List<String> pages, Map<String, List<String>> functions) {
        this.token = token;
        this.username = username;
        this.adminId = adminId;
        this.role = role;
        this.pages = pages;
        this.functions = functions;
    }
}
