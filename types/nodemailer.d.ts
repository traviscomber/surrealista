declare module "nodemailer" {
  export interface TransportOptions {
    host?: string
    port?: number
    secure?: boolean
    auth?: {
      user?: string
      pass?: string
    }
  }

  export interface SendMailOptions {
    from?: string
    to: string | string[]
    subject: string
    html?: string
    text?: string
  }

  export interface SentMessageInfo {
    accepted?: unknown[]
    rejected?: unknown[]
    messageId?: string
    response?: string
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>
  }

  interface NodemailerModule {
    createTransport(options: TransportOptions): Transporter
  }

  const nodemailer: NodemailerModule
  export default nodemailer
}
