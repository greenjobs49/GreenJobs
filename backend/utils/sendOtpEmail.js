const transporter = require("../config/email");
const sanitizeHtml = require("sanitize-html");

const APP_NAME = "Green Jobs";

// 🔐 sanitize
const safe = (str) => sanitizeHtml(str ?? "", { allowedTags: [], allowedAttributes: {} });

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:36px;text-align:center;">
              <h1 style="color:#fff;margin:0;">${APP_NAME}</h1>
              <p style="color:#bbf7d0;margin:5px 0;">Secure Verification</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:20px;text-align:center;">
              <p style="font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${APP_NAME}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const greeting = (name) =>
  `<p style="font-size:16px;font-weight:600;">Hi ${safe(name)},</p>`;

const statusBadge = (text) => `
  <span style="background:#dbeafe;color:#1e40af;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;">
    ${text}
  </span>
`;

module.exports = async (email, otp, role = "user", name = "User") => {
  const currentTime = new Date().toLocaleString();
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000).toLocaleString();

  const roleTitles = {
    jobseeker: "Job Seeker Verification",
    recruiter: "Recruiter Verification",
    business: "Business Owner Verification",
    admin: "Admin Verification",
    user: "Account Verification"
  };

  const title = roleTitles[role] || roleTitles.user;

  const content = `
    ${greeting(name)}

    <p style="font-size:18px;font-weight:700;margin-bottom:10px;">
      Your OTP Code
    </p>

    <p style="color:#475569;font-size:15px;">
      Use the following One-Time Password to continue:
    </p>

    <div style="text-align:center;margin:25px 0;">
      <div style="font-size:34px;font-weight:800;letter-spacing:6px;">
        ${otp}
      </div>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      ${statusBadge(title)}
    </div>

    <table width="100%" style="background:#f8fafc;border-radius:8px;padding:15px;">
      <tr>
        <td style="font-size:13px;color:#64748b;">Generated At</td>
      </tr>
      <tr>
        <td style="font-weight:600;">${currentTime}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#64748b;">Expires At</td>
      </tr>
      <tr>
        <td style="font-weight:600;color:#dc2626;">${expiryTime}</td>
      </tr>
    </table>

    <p style="margin-top:20px;color:#64748b;font-size:14px;">
      ⚠️ Do not share this OTP with anyone.
    </p>

    <hr style="margin:25px 0;border:none;border-top:1px solid #e2e8f0;" />

    <p style="font-size:13px;color:#94a3b8;">
      This is an automated email. Please do not reply.
    </p>
  `;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${title} - OTP Code`,
    html: baseTemplate(content),
  });
};