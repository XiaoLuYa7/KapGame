package com.beiguo.controller.admin;

import com.beiguo.dto.ApiResponse;
import com.beiguo.entity.MailAttachment;
import com.beiguo.entity.MailConfig;
import com.beiguo.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/mails")
public class MailController {
    @Autowired
    private MailService mailService;

    @GetMapping
    public ApiResponse<List<MailConfig>> getAllMails() {
        try {
            List<MailConfig> mails = mailService.getAll();
            return ApiResponse.success(mails);
        } catch (Exception e) {
            return ApiResponse.error("获取邮件列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<MailConfig> getMail(@PathVariable Long id) {
        try {
            MailConfig mail = mailService.getById(id);
            return ApiResponse.success(mail);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/status/{status}")
    public ApiResponse<List<MailConfig>> getMailsByStatus(@PathVariable String status) {
        try {
            List<MailConfig> mails = mailService.getByStatus(status);
            return ApiResponse.success(mails);
        } catch (Exception e) {
            return ApiResponse.error("获取邮件列表失败: " + e.getMessage());
        }
    }

    @PostMapping("/draft")
    public ApiResponse<MailConfig> saveDraft(@RequestBody MailConfig mailConfig) {
        try {
            MailConfig saved = mailService.saveDraft(mailConfig);
            return ApiResponse.success("保存草稿成功", saved);
        } catch (Exception e) {
            return ApiResponse.error("保存草稿失败: " + e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<MailConfig> createMail(@RequestBody MailConfig mailConfig) {
        try {
            MailConfig created = mailService.create(mailConfig);
            return ApiResponse.success("创建邮件成功", created);
        } catch (Exception e) {
            return ApiResponse.error("创建邮件失败: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<MailConfig> updateMail(@PathVariable Long id, @RequestBody MailConfig mailConfig) {
        try {
            mailConfig.setId(id);
            MailConfig updated = mailService.update(id, mailConfig);
            return ApiResponse.success("更新邮件成功", updated);
        } catch (Exception e) {
            return ApiResponse.error("更新邮件失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteMail(@PathVariable Long id) {
        try {
            mailService.delete(id);
            return ApiResponse.success("删除邮件成功", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/send")
    public ApiResponse<MailConfig> sendMail(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String sentBy = request.getOrDefault("sentBy", "系统管理员");
            MailConfig sent = mailService.sendMail(id, sentBy);
            return ApiResponse.success("发送邮件成功", sent);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/attachments")
    public ApiResponse<List<MailAttachment>> getAttachments(@PathVariable Long id) {
        try {
            List<MailAttachment> attachments = mailService.getAttachments(id);
            return ApiResponse.success(attachments);
        } catch (Exception e) {
            return ApiResponse.error("获取附件失败: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/attachments")
    public ApiResponse<Void> addAttachment(@PathVariable Long id, @RequestBody MailAttachment attachment) {
        try {
            mailService.addAttachment(id, attachment);
            return ApiResponse.success("添加附件成功", null);
        } catch (Exception e) {
            return ApiResponse.error("添加附件失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ApiResponse<Void> removeAttachment(@PathVariable Long attachmentId) {
        try {
            mailService.removeAttachment(attachmentId);
            return ApiResponse.success("删除附件成功", null);
        } catch (Exception e) {
            return ApiResponse.error("删除附件失败: " + e.getMessage());
        }
    }

    @PostMapping("/preview")
    public ApiResponse<List<Map<String, Object>>> previewRecipients(@RequestBody Map<String, String> request) {
        try {
            String conditions = request.get("conditions");
            List<Map<String, Object>> preview = mailService.previewRecipients(conditions);
            return ApiResponse.success(preview);
        } catch (RuntimeException e) {
            return ApiResponse.error("预览收件人失败: " + e.getMessage());
        }
    }

    @PostMapping("/count")
    public ApiResponse<Integer> countRecipients(@RequestBody Map<String, String> request) {
        try {
            String conditions = request.get("conditions");
            Integer count = mailService.countRecipients(conditions);
            return ApiResponse.success(count);
        } catch (RuntimeException e) {
            return ApiResponse.error("统计收件人失败: " + e.getMessage());
        }
    }
}
