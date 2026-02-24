type SendEmailPayload = {
  toEmail: string
  toName?: string | null
  subject: string
  textContent: string
  htmlContent: string
}

const brevoApiKey = process.env.BREVO_API_KEY
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL
const brevoSenderName = process.env.BREVO_SENDER_NAME ?? "Filmly"

export async function sendEmail(payload: SendEmailPayload) {
  if (!brevoApiKey || !brevoSenderEmail) {
    throw new Error("Brevo env vars are missing. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.")
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: brevoSenderEmail,
        name: brevoSenderName,
      },
      to: [
        {
          email: payload.toEmail,
          name: payload.toName ?? undefined,
        },
      ],
      subject: payload.subject,
      textContent: payload.textContent,
      htmlContent: payload.htmlContent,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo send failed: ${response.status} ${detail}`)
  }
}

export async function sendPasswordResetCodeEmail(params: {
  toEmail: string
  toName?: string | null
  code: string
  minutesValid: number
}) {
  const subject = "Your Filmly password reset code"
  const textContent = `Your Filmly reset code is ${params.code}. It expires in ${params.minutesValid} minutes.`
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Use the code below to reset your Filmly password:</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${params.code}</p>
      <p>This code expires in ${params.minutesValid} minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `

  return sendEmail({
    toEmail: params.toEmail,
    toName: params.toName,
    subject,
    textContent,
    htmlContent,
  })
}
