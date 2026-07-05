import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_tokgdeg'
const TEMPLATE_ID = 'template_pj52hzk'
const PUBLIC_KEY = '82NUQlh-hTz9vQAz0'

const APP_URL = 'https://adyr-tp-reject.vercel.app'

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
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: p.toEmail,
        pm_name: p.pmName,
        ticket_number: p.ticketNumber,
        contractor: p.contractor,
        priority: p.priority,
        description: p.description,
        created_by: p.createdBy,
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
