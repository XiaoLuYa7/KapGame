package com.beiguo.config;

import com.beiguo.repository.AdminUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

/**
 * 在线状态拦截器
 * 拦截所有 /admin/ 请求（除登录登出外），更新用户的 lastHeartbeatTime
 */
@Component
public class OnlineStatusInterceptor implements HandlerInterceptor {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 只在请求成功（2xx状态码）时更新心跳时间
        if (response.getStatus() >= 200 && response.getStatus() < 300) {
            updateHeartbeat();
        }
    }

    private void updateHeartbeat() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                String username = authentication.getName();
                adminUserRepository.findByUsername(username).ifPresent(user -> {
                    adminUserRepository.updateOnlineStatus(user.getId(), "ONLINE");
                    adminUserRepository.updateHeartbeatTime(user.getId(), LocalDateTime.now());
                });
            }
        } catch (Exception e) {
            // 不影响正常业务流程，忽略异常
        }
    }
}
