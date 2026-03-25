"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInquiryEmail = sendInquiryEmail;
const node_fetch_1 = __importDefault(require("node-fetch"));
const activity_log_service_1 = require("../services/activity.log.service");
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("Missing EmailJS credentials");
}
async function sendInquiryEmail(params) {
    const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY, // 🔒 private key
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
    activity_log_service_1.activityLogService.success("Email sent", {
        snapshot: {
            sender: params.name,
            email: params.email,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        activity_log_service_1.activityLogService.fail("CREATE_INQUIRY", {
            snapshot: {
                sender: params.name,
                email: params.email,
            },
        }, text);
        throw new Error(`EmailJS failed: ${text}`);
    }
    return true;
}
