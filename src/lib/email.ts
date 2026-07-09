import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_tokgdeg'
const TEMPLATE_ID = 'template_pj52hzk'
const PUBLIC_KEY = '82NUQlh-hTz9vQAz0'

const APP_URL = 'https://adyr-tp-reject.vercel.app'

interface NotificationParams {
  toEmail: string
  recipientName: string
  subject: string
  message: string
  ticketNumber: string
  contractor: string
  // legacy fields kept so the current EmailJS template still renders
  priority?: string
  description?: string
  createdBy?: string
}

async function sendNotification(p: NotificationParams): Promise<boolean> {
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: p.toEmail,
        pm_name: p.recipientName,
        subject: p.subject,
        message: p.message,
        ticket_number: p.ticketNumber,
        contractor: p.contractor,
        priority: p.priority ?? '',
        description: p.description ?? p.message,
        created_by: p.createdBy ?? '',
        reply_to: 'igal.osichunski@gmail.com',
        app_url: APP_URL,
      },
      { publicKey: PUBLIC_KEY }
    )
    return true
  } catch (e) {
    console.error('EmailJS send failed:', e)
    return false
  }
}

export interface NewTicketEmailParams {
  toEmail: string
  pmName: string
  ticketNumber: string
  contractor: string
  priority: string
  description: string
  createdBy: string
}

export async function sendNewTicketEmail(p: NewTicketEmailParams): Promise<boolean> {
  return sendNotification({
    toEmail: p.toEmail,
    recipientName: p.pmName,
    subject: `תקלה חדשה נפתחה: ${p.ticketNumber} — ${p.contractor}`,
    message: `נפתחה תקלה חדשה עבור ${p.contractor} בעדיפות ${p.priority}, ע"י ${p.createdBy}.`,
    ticketNumber: p.ticketNumber,
    contractor: p.contractor,
    priority: p.priority,
    description: p.description,
    createdBy: p.createdBy,
  })
}

export interface StatusChangeEmailParams {
  toEmail: string
  recipientName: string
  ticketNumber: string
  contractor: string
  oldStatus: string
  newStatus: string
  changedBy: string
}

export async function sendStatusChangeEmail(p: StatusChangeEmailParams): Promise<boolean> {
  return sendNotification({
    toEmail: p.toEmail,
    recipientName: p.recipientName,
    subject: `עדכון סטטוס: ${p.ticketNumber} — ${p.newStatus}`,
    message: `סטטוס התקלה ${p.ticketNumber} שונה מ-"${p.oldStatus}" ל-"${p.newStatus}" ע"י ${p.changedBy}.`,
    ticketNumber: p.ticketNumber,
    contractor: p.contractor,
    createdBy: p.changedBy,
  })
}
