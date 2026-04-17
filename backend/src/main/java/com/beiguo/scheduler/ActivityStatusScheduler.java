package com.beiguo.scheduler;

import com.beiguo.service.ActivityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ActivityStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(ActivityStatusScheduler.class);

    @Autowired
    private ActivityService activityService;

    /**
     * 每小时执行一次，检查并更新已过期的活动状态为已结束
     */
    @Scheduled(cron = "0 0 * * * *")
    public void updateExpiredActivities() {
        try {
            int count = activityService.updateExpiredActivities();
            if (count > 0) {
                log.info("自动更新了 {} 个过期活动状态为已结束", count);
            }
        } catch (Exception e) {
            log.error("更新过期活动状态时发生错误", e);
        }
    }
}
