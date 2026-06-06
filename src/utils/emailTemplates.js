/**
 * Premium Email Templates for Verve Nova
 */

const baseEmailStyle = `
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f7f9;
      margin: 0;
      padding: 0;
      color: #334155;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f7f9;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
      border: 1px solid #f1f5f9;
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 40px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: bold;
      margin-top: 8px;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
    }
    .btn-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);
    }
    .credentials-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }
    .cred-row {
      margin-bottom: 12px;
    }
    .cred-row:last-child {
      margin-bottom: 0;
    }
    .cred-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 4px;
    }
    .cred-val {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
    }
    .footer {
      padding: 30px 40px;
      background: #f8fafc;
      text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
`;

/**
 * Account/User Creation Email Template - Verve Nova Edition
 */
const getWelcomeEmailTemplate = (name, role, email, password, loginUrl = 'https://www.vervenovatechcrm.online/login') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseEmailStyle}
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 style="letter-spacing: 2px;">VERVE NOVA TECH</h1>
            <div class="badge">Official Selection</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${name},</div>
            
            <div class="text" style="font-size: 18px; color: #4f46e5; font-weight: 800; margin-top: 10px;">
              Congratulations! 🎉
            </div>
            
            <div class="text" style="margin-top: 15px;">
              We are pleased to inform you that you have successfully cleared the interview process at <b>Verve Nova Tech</b>. 
              Your <b>${role}</b> CRM account has been created successfully.
            </div>

            <div class="credentials-box">
              <div style="font-weight: 900; color: #0f172a; margin-bottom: 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">🔐 Login Details:</div>
              <div class="cred-row">
                <div class="cred-label">CRM Portal</div>
                <div class="cred-val" style="color: #4f46e5;"><a href="${loginUrl}" style="color: #4f46e5; text-decoration: none;">Link to Portal</a></div>
              </div>
              <div class="cred-row">
                <div class="cred-label">Email</div>
                <div class="cred-val">${email}</div>
              </div>
              <div class="cred-row">
                <div class="cred-label">Password</div>
                <div class="cred-val">${password}</div>
              </div>
            </div>

            <div class="text">
              <p style="font-weight: 800; color: #0f172a;">📌 Important Instructions:</p>
              <ul style="padding-left: 20px; font-size: 14px;">
                <li>Please log in using the above credentials.</li>
                <li>Change your password immediately after first login for security purposes.</li>
                <li>Do not share your login details with anyone.</li>
              </ul>
            </div>

            <div class="text" style="margin-top: 25px;">
              <p style="font-weight: 800; color: #0f172a;">📋 What You Can Do in CRM:</p>
              <ul style="padding-left: 20px; font-size: 14px;">
                <li>Manage your assigned projects and tasks</li>
                <li>Track work progress</li>
                <li>Communicate with the team</li>
                <li>Access important company updates</li>
              </ul>
            </div>

            <div class="text" style="margin-top: 25px; background: #fff7ed; padding: 20px; border-radius: 16px; border: 1px solid #ffedd5;">
              <p style="font-weight: 800; color: #9a3412; margin-top: 0;">📞 Support:</p>
              <p style="margin: 0; font-size: 14px;">If you face any issues while logging in or using the CRM, feel free to contact us at:</p>
              <p style="margin: 5px 0 0 0; font-weight: 700;"><a href="mailto:work.vervenova.lko@gmail.com" style="color: #c2410c; text-decoration: none;">📧 work.vervenova.lko@gmail.com</a></p>
            </div>

            <div class="text" style="margin-top: 30px; border-top: 1px solid #f1f5f9; pt: 30px;">
              We look forward to working with you and wish you great success at Verve Nova Tech.
            </div>

            <div style="margin-top: 20px;">
              <div class="greeting" style="font-size: 16px; margin-bottom: 4px;">Best Regards,</div>
              <div style="font-weight: 900; color: #4f46e5;">Verve Nova Tech Team</div>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Verve Nova Tech. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

/**
 * Task/Lead Assignment Email Template
 */
const getAssignmentUpdateTemplate = (name, actionType, description, actionUrl = 'http://localhost:5173') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseEmailStyle}
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>VERVE NOVA</h1>
            <div class="badge">Action Required</div>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <div class="text">
              A new <strong>${actionType}</strong> has been securely routed directly to your queue.
            </div>
            
            <div class="credentials-box">
              <div class="cred-label">Details</div>
              <div class="text" style="margin-top: 8px; font-weight: 500;">
                ${description}
              </div>
            </div>

            <div class="btn-container">
              <a href="${actionUrl}" class="btn">View Details</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Verve Nova Tech. All rights reserved.</p>
            <p style="margin-top: 8px;">Automated Priority Notification</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

/**
 * OTP/Password Reset Email Template
 */
const getOTPEmailTemplate = (name, otp) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseEmailStyle}
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%);">
            <h1 style="letter-spacing: 2px;">SECURITY ALERT</h1>
            <div class="badge" style="background: rgba(255,255,255,0.3);">Action Required</div>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <div class="text" style="margin-top: 15px;">
              We received a request to reset the password for your Verve Nova Tech account. Use the following code to continue:
            </div>
            
            <div style="text-align: center; padding: 40px 0;">
              <div style="display: inline-block; background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 20px 40px;">
                <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: monospace;">${otp}</div>
              </div>
              <div style="margin-top: 15px; font-size: 13px; color: #94a3b8; font-weight: 500;">Valid for 10 minutes</div>
            </div>

            <div class="text" style="background: #f8fafc; padding: 20px; border-radius: 12px; font-size: 13px;">
              If you did not request this, you can safely ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Verve Nova Tech. All rights reserved.</p>
            <p style="margin-top: 8px;">Verve Nova Security Operations Center</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

/**
 * Meeting Invitation Email Template
 */
const getMeetingInviteTemplate = (clientName, meetingDate, meetingTime, meetingLink, meetingTitle, companyName = 'Verve Nova Tech') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      ${baseEmailStyle}
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 style="letter-spacing: 2px;">${companyName.toUpperCase()}</h1>
            <div class="badge">Meeting Invitation</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${clientName},</div>
            <div class="text" style="margin-top: 15px;">
              We have successfully scheduled a meeting with you regarding your recent inquiry. Please find the meeting details below:
            </div>
            
            <div class="credentials-box">
              <div class="cred-row">
                <div class="cred-label">Topic</div>
                <div class="cred-val">${meetingTitle}</div>
              </div>
              <div class="cred-row" style="margin-top: 12px;">
                <div class="cred-label">Date & Time</div>
                <div class="cred-val">${meetingDate} at ${meetingTime}</div>
              </div>
              ${meetingLink ? `
              <div class="cred-row" style="margin-top: 12px;">
                <div class="cred-label">Meeting Link</div>
                <div class="cred-val"><a href="${meetingLink}" style="color: #4f46e5; text-decoration: none;">Join Meeting Here</a></div>
              </div>` : ''}
            </div>

            <div class="btn-container">
              ${meetingLink ? `<a href="${meetingLink}" class="btn">Join Meeting</a>` : ''}
            </div>

            <div class="text">
              We look forward to speaking with you. If you need to reschedule, please let us know.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

module.exports = {
    getWelcomeEmailTemplate,
    getAssignmentUpdateTemplate,
    getOTPEmailTemplate,
    getMeetingInviteTemplate
};
