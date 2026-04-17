package com.beiguo.service;

import com.beiguo.entity.MailConfig;
import com.beiguo.entity.MailAttachment;
import java.util.List;
import java.util.Map;

public interface MailService {
    // CRUD
    MailConfig create(MailConfig mailConfig);
    MailConfig update(Long id, MailConfig mailConfig);
    void delete(Long id);
    MailConfig getById(Long id);
    List<MailConfig> getAll();
    List<MailConfig> getByStatus(String status);

    // 邮件发送
    MailConfig sendMail(Long id, String sentBy);
    MailConfig saveDraft(MailConfig mailConfig);

    // 附件管理
    void addAttachment(Long mailId, MailAttachment attachment);
    void removeAttachment(Long attachmentId);
    List<MailAttachment> getAttachments(Long mailId);

    // 用户筛选
    List<Map<String, Object>> previewRecipients(String conditionsJson);
    Integer countRecipients(String conditionsJson);
}
