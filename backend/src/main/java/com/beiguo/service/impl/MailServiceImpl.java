package com.beiguo.service.impl;

import com.beiguo.entity.MailAttachment;
import com.beiguo.entity.MailConfig;
import com.beiguo.entity.User;
import com.beiguo.repository.MailAttachmentRepository;
import com.beiguo.repository.MailConfigRepository;
import com.beiguo.repository.UserRepository;
import com.beiguo.service.MailService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MailServiceImpl implements MailService {
    @Autowired
    private MailConfigRepository mailConfigRepository;

    @Autowired
    private MailAttachmentRepository mailAttachmentRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public MailConfig create(MailConfig mailConfig) {
        mailConfig.setStatus("DRAFT");
        MailConfig saved = mailConfigRepository.save(mailConfig);
        // 保存附件
        if (mailConfig.getAttachments() != null && !mailConfig.getAttachments().isEmpty()) {
            for (MailAttachment att : mailConfig.getAttachments()) {
                att.setMailConfig(saved);
                mailAttachmentRepository.save(att);
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public MailConfig update(Long id, MailConfig mailConfig) {
        MailConfig existing = getById(id);
        existing.setTitle(mailConfig.getTitle());
        existing.setContent(mailConfig.getContent());
        existing.setTargetConditions(mailConfig.getTargetConditions());
        existing.setSendTime(mailConfig.getSendTime());
        existing.setExpireTime(mailConfig.getExpireTime());
        existing.setStatus(mailConfig.getStatus());
        return mailConfigRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MailConfig mail = getById(id);
        if ("SENT".equals(mail.getStatus())) {
            throw new RuntimeException("已发送的邮件不能删除");
        }
        mailAttachmentRepository.deleteByMailConfigId(id);
        mailConfigRepository.delete(mail);
    }

    @Override
    public MailConfig getById(Long id) {
        MailConfig mail = mailConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("邮件不存在"));
        // 加载附件
        List<MailAttachment> attachments = mailAttachmentRepository.findByMailConfigId(id);
        mail.setAttachments(attachments);
        return mail;
    }

    @Override
    public List<MailConfig> getAll() {
        return mailConfigRepository.findAllByOrderByCreateTimeDesc();
    }

    @Override
    public List<MailConfig> getByStatus(String status) {
        return mailConfigRepository.findByStatus(status);
    }

    @Override
    @Transactional
    public MailConfig sendMail(Long id, String sentBy) {
        MailConfig mail = getById(id);
        if (!"DRAFT".equals(mail.getStatus())) {
            throw new RuntimeException("只有草稿状态的邮件可以发送");
        }

        // 统计收件人数量
        int recipientCount = countRecipients(mail.getTargetConditions());
        mail.setTotalRecipients(recipientCount);
        mail.setSentCount(recipientCount);
        mail.setStatus("SENT");
        mail.setSendTime(LocalDateTime.now());
        mail.setCreatedBy(sentBy);

        return mailConfigRepository.save(mail);
    }

    @Override
    @Transactional
    public MailConfig saveDraft(MailConfig mailConfig) {
        if (mailConfig.getId() != null) {
            // 更新现有草稿
            MailConfig existing = getById(mailConfig.getId());
            existing.setTitle(mailConfig.getTitle());
            existing.setContent(mailConfig.getContent());
            existing.setTargetConditions(mailConfig.getTargetConditions());
            existing.setExpireTime(mailConfig.getExpireTime());

            // 更新附件：先删除旧的再添加新的
            mailAttachmentRepository.deleteByMailConfigId(mailConfig.getId());
            if (mailConfig.getAttachments() != null) {
                for (MailAttachment att : mailConfig.getAttachments()) {
                    att.setId(null);
                    att.setMailConfig(existing);
                    mailAttachmentRepository.save(att);
                }
            }
            return mailConfigRepository.save(existing);
        } else {
            // 创建新草稿
            mailConfig.setStatus("DRAFT");
            MailConfig saved = mailConfigRepository.save(mailConfig);
            if (mailConfig.getAttachments() != null) {
                for (MailAttachment att : mailConfig.getAttachments()) {
                    att.setMailConfig(saved);
                    mailAttachmentRepository.save(att);
                }
            }
            return saved;
        }
    }

    @Override
    @Transactional
    public void addAttachment(Long mailId, MailAttachment attachment) {
        MailConfig mail = getById(mailId);
        attachment.setMailConfig(mail);
        mailAttachmentRepository.save(attachment);
    }

    @Override
    @Transactional
    public void removeAttachment(Long attachmentId) {
        mailAttachmentRepository.deleteById(attachmentId);
    }

    @Override
    public List<MailAttachment> getAttachments(Long mailId) {
        return mailAttachmentRepository.findByMailConfigId(mailId);
    }

    @Override
    public List<Map<String, Object>> previewRecipients(String conditionsJson) {
        List<User> users = filterUsers(conditionsJson);
        return users.stream().limit(100).map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("nickName", user.getNickName());
            map.put("level", user.getLevel());
            map.put("status", user.getStatus());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public Integer countRecipients(String conditionsJson) {
        return filterUsers(conditionsJson).size();
    }

    /**
     * 根据条件筛选用户
     */
    private List<User> filterUsers(String conditionsJson) {
        if (conditionsJson == null || conditionsJson.trim().isEmpty()) {
            // 无条件时返回所有活跃用户
            return userRepository.findByStatus("ACTIVE");
        }

        Map<String, Object> conditions;
        try {
            conditions = objectMapper.readValue(conditionsJson, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("条件JSON格式错误");
        }

        List<User> allUsers = userRepository.findAll();
        return allUsers.stream().filter(user -> {
            // 注册时间筛选
            if (conditions.containsKey("createTimeStart")) {
                LocalDateTime start = LocalDateTime.parse(conditions.get("createTimeStart").toString());
                if (user.getCreateTime() == null || user.getCreateTime().isBefore(start)) {
                    return false;
                }
            }
            if (conditions.containsKey("createTimeEnd")) {
                LocalDateTime end = LocalDateTime.parse(conditions.get("createTimeEnd").toString());
                if (user.getCreateTime() == null || user.getCreateTime().isAfter(end)) {
                    return false;
                }
            }

            // 等级筛选
            if (conditions.containsKey("levelMin")) {
                int minLevel = Integer.parseInt(conditions.get("levelMin").toString());
                if (user.getLevel() == null || user.getLevel() < minLevel) {
                    return false;
                }
            }
            if (conditions.containsKey("levelMax")) {
                int maxLevel = Integer.parseInt(conditions.get("levelMax").toString());
                if (user.getLevel() == null || user.getLevel() > maxLevel) {
                    return false;
                }
            }

            // 状态筛选
            if (conditions.containsKey("status")) {
                String status = conditions.get("status").toString();
                if (!status.equals(user.getStatus())) {
                    return false;
                }
            }

            // 段位筛选
            if (conditions.containsKey("rank")) {
                String rank = conditions.get("rank").toString();
                if (!rank.equals(user.getRank())) {
                    return false;
                }
            }

            // 钻石数量筛选
            if (conditions.containsKey("diamondMin")) {
                int minDiamond = Integer.parseInt(conditions.get("diamondMin").toString());
                if (user.getDiamond() == null || user.getDiamond() < minDiamond) {
                    return false;
                }
            }

            // 金币数量筛选
            if (conditions.containsKey("goldMin")) {
                int minGold = Integer.parseInt(conditions.get("goldMin").toString());
                if (user.getGold() == null || user.getGold() < minGold) {
                    return false;
                }
            }

            // 最后登录时间筛选（天数内登录过的）
            if (conditions.containsKey("loginDaysWithin")) {
                int days = Integer.parseInt(conditions.get("loginDaysWithin").toString());
                if (user.getLastLoginTime() == null) {
                    return false;
                }
                long daysSinceLogin = ChronoUnit.DAYS.between(user.getLastLoginTime(), LocalDateTime.now());
                if (daysSinceLogin > days) {
                    return false;
                }
            }

            return true;
        }).collect(Collectors.toList());
    }
}
