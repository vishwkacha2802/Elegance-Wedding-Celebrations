import { isAxiosError } from "axios";

import api from "@/api/axios";

export interface ContactInquiryPayload {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  venue: string;
  message: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; error?: string } | undefined;
    return responseData?.message || responseData?.error || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export async function createContactInquiry(payload: ContactInquiryPayload) {
  try {
    const { data } = await api.post<{
      success?: boolean;
      message?: string;
      inquiry?: ContactInquiryPayload & { id?: string; status?: string; createdAt?: string };
    }>("/contact-inquiries", {
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      phone: String(payload.phone || "").trim(),
      eventDate: String(payload.eventDate || "").trim(),
      guestCount: String(payload.guestCount || "").trim(),
      venue: String(payload.venue || "").trim(),
      message: String(payload.message || "").trim(),
    });

    return {
      success: Boolean(data.success),
      message: String(data.message || "Your inquiry has been submitted successfully."),
      inquiry: data.inquiry,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to submit your inquiry."));
  }
}
