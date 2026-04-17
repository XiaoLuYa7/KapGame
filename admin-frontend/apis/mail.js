import api from './index'

export const getMails = (params) => {
  return api.get('/admin/mails', { params })
}

export const getMailById = (id) => {
  return api.get(`/admin/mails/${id}`)
}

export const getMailsByStatus = (status) => {
  return api.get(`/admin/mails/status/${status}`)
}

export const createMail = (data) => {
  return api.post('/admin/mails', data)
}

export const updateMail = (id, data) => {
  return api.put(`/admin/mails/${id}`, data)
}

export const deleteMail = (id) => {
  return api.delete(`/admin/mails/${id}`)
}

export const saveDraft = (data) => {
  return api.post('/admin/mails/draft', data)
}

export const sendMail = (id, sentBy) => {
  return api.post(`/admin/mails/${id}/send`, { sentBy })
}

export const getAttachments = (mailId) => {
  return api.get(`/admin/mails/${mailId}/attachments`)
}

export const addAttachment = (mailId, data) => {
  return api.post(`/admin/mails/${mailId}/attachments`, data)
}

export const removeAttachment = (attachmentId) => {
  return api.delete(`/admin/mails/attachments/${attachmentId}`)
}

export const previewRecipients = (conditions) => {
  return api.post('/admin/mails/preview', { conditions })
}

export const countRecipients = (conditions) => {
  return api.post('/admin/mails/count', { conditions })
}
