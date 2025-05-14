const nodemailer = require('nodemailer');
require("dotenv").config(); // Load .env variables

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // e.g. your Gmail address
        pass: process.env.EMAIL_PASS  // Gmail App Password (not your regular password)
    }
});

// Send mail function
const sendMail = async (to, subject, message) => {
    try {
        const info = await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Must match EMAIL_USER
            to: to, // recipient email
            subject: subject || "No Subject",
            text: message, // plain text version
            html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
                      <p>${message}</p>
                   </div>`
        });

        console.log("✅ Email sent: " + info.response);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = sendMail;
