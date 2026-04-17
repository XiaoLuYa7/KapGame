package com.beiguo.scheduler;

import com.beiguo.entity.AdminUser;
import com.beiguo.repository.AdminUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 管理员在线状态定时任务
 * 检查心跳超时，将超时的用户标记为离线
 */
@Component
public class OnlineStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(OnlineStatusScheduler.class);

    @Autowired
    private AdminUserRepository adminUserRepository;

    /**
     * 每分钟执行一次，检查超过5分钟未操作的用户并标记为离线
     */
    @Scheduled(fixedRate = 60000) // 60秒 = 1分钟
    @Transactional
    public void checkOfflineUsers() {
        try {
            LocalDateTime threshold = LocalDateTime.now().minusMinutes(5); // 5分钟超时
            // 查询所有在线的用户
            List<AdminUser> onlineUsers = adminUserRepository.findByOnlineStatus("ONLINE");

            int offlineCount = 0;
            for (AdminUser user : onlineUsers) {
                // 如果心跳时间超过1分钟，设为离线
                if (user.getLastHeartbeatTime() != null && user.getLastHeartbeatTime().isBefore(threshold)) {
                    adminUserRepository.updateOnlineStatus(user.getId(), "OFFLINE");
                    offlineCount++;
                    log.debug("用户 {} 因心跳超时被标记为离线", user.getUsername());
                }
            }

            if (offlineCount > 0) {
                log.info("本次检查将 {} 个用户标记为离线", offlineCount);
            }
        } catch (Exception e) {
            log.error("检查离线用户时发生错误", e);
        }
    }
}
