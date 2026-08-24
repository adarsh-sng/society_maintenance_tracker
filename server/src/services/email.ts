import nodemailer from 'nodemailer'
import { env } from '../../env.ts'

let transporter: nodemailer.Transporter | null = null
let etherealAccount: { user: string; pass: string; host: string; port: number } | null = null

export const initializeEmail = async (): Promise<void> => {
  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT || 587,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
    console.log('📧 Email transporter configured with provided credentials')
    return
  }

  try {
    const testAccount = await nodemailer.createTestAccount()
    etherealAccount = {
      user: testAccount.user,
      pass: testAccount.pass,
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
    }

    transporter = nodemailer.createTransport({
      host: etherealAccount.host,
      port: etherealAccount.port,
      secure: etherealAccount.port === 465,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    })

    console.log('📧 Ethereal Email test account created')
    console.log(`   User: ${etherealAccount.user}`)
    console.log(`   Pass: ${etherealAccount.pass}`)
    console.log(`   Preview URLs will be logged when emails are sent`)
  } catch (error) {
    console.error('❌ Failed to create Ethereal account:', error)
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    })
    console.log('📧 Falling back to local SMTP (Mailhog/smtp4dev)')
  }
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; previewUrl?: string; error?: string }> => {
  if (!transporter) {
    await initializeEmail()
  }

  if (!transporter) {
    return { success: false, error: 'Email transporter not initialized' }
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || etherealAccount?.user || 'noreply@society.local',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`📧 Email preview: ${previewUrl}`)
    }

    return { success: true, previewUrl }
  } catch (error) {
    console.error('❌ Email send failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const sendComplaintStatusEmail = async (
  residentEmail: string,
  residentName: string,
  complaintId: number,
  category: string,
  oldStatus: string,
  newStatus: string,
  note?: string
): Promise<void> => {
  const subject = `Complaint #${complaintId} Status Updated: ${newStatus}`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #64748b; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .badge-open { background: #fef3c7; color: #92400e; }
        .badge-in-progress { background: #dbeafe; color: #1e40af; }
        .badge-resolved { background: #dcfce7; color: #166534; }
        .note { background: white; padding: 12px; border-left: 4px solid #2563eb; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Society Maintenance Tracker</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${residentName}</strong>,</p>
        <p>Your complaint has been updated:</p>
        <p><strong>Complaint #${complaintId}</strong> - ${category}</p>
        <p>
          Status changed from 
          <span class="badge badge-${oldStatus.toLowerCase().replace(' ', '-')}">${oldStatus}</span>
          to
          <span class="badge badge-${newStatus.toLowerCase().replace(' ', '-')}">${newStatus}</span>
        </p>
        ${note ? `<div class="note"><strong>Admin Note:</strong> ${note}</div>` : ''}
        <p>You can view the full details and history in the resident portal.</p>
      </div>
      <div class="footer">
        <p>This is an automated message from Society Maintenance Tracker.</p>
      </div>
    </body>
    </html>
  `
  await sendEmail(residentEmail, subject, html)
}

export const sendImportantNoticeEmail = async (
  residentEmail: string,
  residentName: string,
  noticeContent: string
): Promise<void> => {
  const subject = 'Important Notice from Society Management'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 20px; border: 1px solid #fecaca; }
        .footer { background: #f1f5f9; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #64748b; }
        .notice { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">⚠️ Important Society Notice</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${residentName}</strong>,</p>
        <p>The society management has posted an important announcement:</p>
        <div class="notice">${noticeContent.replace(/\n/g, '<br>')}</div>
        <p>Please check the notice board for more details.</p>
      </div>
      <div class="footer">
        <p>This is an automated message from Society Maintenance Tracker.</p>
      </div>
    </body>
    </html>
  `
  await sendEmail(residentEmail, subject, html)
}

export const getEtherealCredentials = () => etherealAccount