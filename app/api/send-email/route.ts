import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { logEmail, updateEmailLog } from "@/app/actions/email"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

type SendEmailBody = {
  to: string
  subject: string
  htmlBody: string
  clientId: string
}

function parseSendEmailBody(value: unknown): SendEmailBody | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>

  const to = typeof body.to === "string" ? body.to.trim() : ""
  const subject = typeof body.subject === "string" ? body.subject.trim() : ""
  const htmlBody = typeof body.body === "string" ? body.body : ""
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : ""

  if (!to || !subject || !htmlBody.trim() || !clientId) return null
  return { to, subject, htmlBody, clientId }
}

function getEmailLogId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  return typeof row.id === "string" && row.id ? row.id : null
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function POST(request: NextRequest) {
  try {
    const payload = parseSendEmailBody(await request.json())
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid email request" }, { status: 400 })
    }

    const { to, subject, htmlBody, clientId } = payload

    const logResult = await logEmail({
      client_id: clientId,
      recipient_email: to,
      subject,
      body: htmlBody,
      status: "pending",
      created_by: process.env.SMTP_FROM_NAME || "system",
    })

    const logId = logResult.success ? getEmailLogId(logResult.data) : null
    if (!logId) {
      return NextResponse.json(
        {
          success: false,
          error: "Error registering email log",
        },
        { status: 500 },
      )
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject,
        html: htmlBody,
      })

      const updateResult = await updateEmailLog(logId, "sent")
      if (!updateResult.success) {
        console.error("[send-email] SMTP sent but log update failed", { logId, error: updateResult.error })
      }

      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        logId,
      })
    } catch (emailError: unknown) {
      const message = errorMessage(emailError, "Error sending email")
      await updateEmailLog(logId, "failed", message)

      return NextResponse.json(
        {
          success: false,
          error: message,
          logId,
        },
        { status: 500 },
      )
    }
  } catch (error: unknown) {
    console.error("[send-email] Error processing request:", error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error, "Error processing request"),
      },
      { status: 500 },
    )
  }
}
