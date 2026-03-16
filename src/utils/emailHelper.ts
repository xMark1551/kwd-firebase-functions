import fetch from "node-fetch";
import { activityLogService } from "../services/activity.log.service";

interface InquiryEmailParams {
  to?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  attachmentUrl?: string | null;
}

export async function sendInquiryEmail(params: InquiryEmailParams) {
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID!,
    template_id: process.env.EMAILJS_TEMPLATE_ID!,
    user_id: process.env.EMAILJS_PRIVATE_KEY!, // 🔒 private key
    template_params: {
      to_email: params.to || process.env.ADMIN_EMAIL,
      from_name: params.name,
      subject: params.subject || "New Inquiry Received",
      message: params.message,
      attachment_url: params.attachmentUrl ?? "No attachment",
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://your-domain.com",
    },
    body: JSON.stringify(payload),
  });

  activityLogService.success("Email sent", {
    snapshot: {
      sender: params.name,
      email: params.email,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    activityLogService.fail(
      "CREATE_INQUIRY",
      {
        snapshot: {
          sender: params.name,
          email: params.email,
        },
      },
      text,
    );

    throw new Error(`EmailJS failed: ${text}`);
  }

  return true;
}
