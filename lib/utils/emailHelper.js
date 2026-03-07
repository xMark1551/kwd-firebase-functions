"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInquiryEmail = sendInquiryEmail;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function sendInquiryEmail(params) {
    const payload = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PRIVATE_KEY, // 🔒 private key
        template_params: {
            to_email: params.to || process.env.ADMIN_EMAIL,
            from_name: params.name,
            subject: params.subject || "New Inquiry Received",
            message: params.message,
            attachment_url: params.attachmentUrl ?? "No attachment",
        },
    };
    const response = await (0, node_fetch_1.default)("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: "https://your-domain.com",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`EmailJS failed: ${text}`);
    }
    return true;
}
