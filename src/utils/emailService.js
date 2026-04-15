const { Resend } = require('resend');

const resendToken = process.env.RESEND_API_KEY || 're_test_key';
const resend = new Resend(resendToken);

/**
 * Sender Options
 * Note: These should be configured in your Resend verified domains
 */
const SENDERS = {
    DEFAULT: process.env.EMAIL_SENDER || 'Verve Nova Tech <noreply@vervenova.com>',
    CAREER: process.env.EMAIL_CAREER || 'Verve Nova Careers <career@vervenova.com>',
    SUPPORT: process.env.EMAIL_SUPPORT || 'Verve Nova Support <support@vervenova.com>'
};

/**
 * Send an email using Resend
 * 
 * @param {Object} options 
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email content in HTML format
 * @param {string} options.from - Optional specific sender (from SENDERS keys)
 * @returns {Promise<Object>} Resend success response or error response
 */
const sendEmail = async ({ to, subject, html, from = 'DEFAULT' }) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('⚠️ RESEND_API_KEY is not defined in .env! Emails will not be delivered to recipients.');
        }

        const sender = SENDERS[from] || SENDERS.DEFAULT;

        const data = await resend.emails.send({
            from: sender,
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            html: html
        });

        console.log(`✉️ Email successfully dispatched from [${from}] to ${to} (ID: ${data.id})`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail, SENDERS };
