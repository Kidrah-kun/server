
function generateVerificationOtpEmailTemplate(otpCode){
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Verify Email</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 22px !important; }
      .otp { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background:#0d0d0d; font-family:'Segoe UI', Roboto, Arial, sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0d0d0d; padding:32px 0;">
    <tr>
      <td align="center">

        <table role="presentation" class="container" cellpadding="0" cellspacing="0" width="480" 
               style="background:#111111; width:480px; border-radius:14px; overflow:hidden; border:1px solid #1f1f1f;">

          <tr>
            <td style="padding:24px; background:#000; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">GoodLIB</h1>
            </td>
          </tr>

          <tr>
            <td class="content" style="padding:32px; color:#e5e5e5; text-align:left;">

              <h2 style="margin:0 0 12px; font-size:20px; color:#ffffff; font-weight:600;">
                Your Verification Code
              </h2>

              <p style="margin:0 0 18px; color:#bbbbbb; line-height:1.6; font-size:14px;">
                Enter the code below to verify your email. This code will expire in <strong>15 minutes</strong>.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:18px 0 28px 0;">
                <tr>
                  <td align="center">
                    <div class="otp" 
                         style="padding:18px 32px; background:#000000; border:1px solid #2a2a2a; border-radius:10px; display:inline-block;">
                      <span style="font-family: 'Courier New', monospace; font-size:32px; font-weight:700; color:#ffffff; letter-spacing:8px;">
                        ${otpCode}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0; color:#7d7d7d; font-size:13px; line-height:1.6;">
                If you didn’t request this, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:18px; text-align:center; background:#0b0b0b; color:#555; font-size:12px;">
              © ${new Date().getFullYear()} GoodLIB. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function generateForgotPasswordEmailTemplate(resetPasswordUrl){
  return`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">

    <h2 style="color: #fff; text-align: center;">Reset Your Password</h2>

    <p style="font-size: 16px;">Dear User,</p>

    <p style="font-size: 16px;">
        You requested to reset your password. Please click the button below to proceed:
    </p>

    <div style="text-align: center; margin: 25px 0;">
        <a href="${resetPasswordUrl}"
            style="display: inline-block; font-size: 16px; font-weight: bold; 
                   color: #000; background-color: #fff; text-decoration: none;
                   padding: 12px 20px; border-radius: 5px; border: 1px solid #fff;">
            Reset Password
        </a>
    </div>

    <p style="font-size: 16px; color: #ccc;">
        If you did not request this, please ignore this email. The link will expire in 10 minutes.
    </p>

    <p style="font-size: 16px; color: #ccc; word-wrap: break-word;">
        If the button above doesn’t work, copy and paste the following URL into your browser:<br>
        <span style="color: #fff;">${resetPasswordUrl}</span>
    </p>

    <footer style="margin-top: 25px; text-align: center; font-size: 14px; color: #666;">
        <p>Thank you,<br><strong>GoodLib Team</strong></p>
        <p style="font-size: 12px; color: #444;">
            This is an automated message. Please do not reply to this email.
        </p>
    </footer>

</div>
`
}

module.exports = {generateVerificationOtpEmailTemplate, generateForgotPasswordEmailTemplate};
