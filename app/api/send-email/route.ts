import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { logEmail, updateEmailLog } from "@/app/actions/email"

// Get SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, body: htmlBody, clientId, templateId } = body

    // Log the email attempt
    const logResult = await logEmail({
      client_id: clientId,
      recipient_email: to,
      subject,
      body: htmlBody,
      status: "pending",
      created_by: process.env.SMTP_FROM_NAME || "system",
    })

    if (!logResult.success || !logResult.data?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Error registering email log",
        },
        { status: 500 },
      )
    }

    const logId = logResult.data.id

    try {
      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject,
        html: htmlBody,
      })

      // Update log status to sent
      await updateEmailLog(logId, "sent")

      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        logId,
      })
    } catch (emailError: any) {
      // Update log status to failed
      await updateEmailLog(logId, "failed", emailError.message)

      return NextResponse.json(
        {
          success: false,
          error: emailError.message || "Error sending email",
          logId,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Error in send-email route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error processing request",
      },
      { status: 500 },
    )
  }
}
