// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { Resend } from "https://esm.sh/resend@1.1.0"; // Using Resend for email sending

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[send-voucher-email] function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    console.log("[send-voucher-email] Responding to OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toEmail, voucherCode, qrCodeValue, points, cashValue, rewardName } = await req.json();
    console.log(`[send-voucher-email] Received request to send email to: ${toEmail} for voucher: ${voucherCode}`);

    if (!toEmail || !voucherCode || !qrCodeValue || !points || !cashValue || !rewardName) {
      console.error('[send-voucher-email] Error: Missing required fields in request body.');
      return new Response(JSON.stringify({ error: 'Missing required fields: toEmail, voucherCode, qrCodeValue, points, cashValue, rewardName' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error("[send-voucher-email] Error: RESEND_API_KEY is not set in environment variables.");
      throw new Error('RESEND_API_KEY is not set in environment variables.');
    }

    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #28a745;">Your EcoScan AI Shopping Voucher!</h2>
        <p>Hello,</p>
        <p>Thank you for recycling with EcoScan AI! Here is your voucher for <strong>${rewardName}</strong>.</p>
        <p><strong>Voucher Code:</strong> <strong style="font-size: 1.2em; color: #007bff;">${voucherCode}</strong></p>
        <p><strong>Value:</strong> <strong style="font-size: 1.2em; color: #28a745;">$${cashValue}</strong> (from ${points} points)</p>
        <p>Present the QR code below at checkout to redeem your reward.</p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeValue)}" alt="QR Code" style="border: 1px solid #eee; padding: 10px;"/>
        </div>
        <p>This is a one-time use voucher. Enjoy your reward!</p>
        <p>Best regards,<br/>The EcoScan AI Team</p>
      </div>
    `;

    const { data, error: resendError } = await resend.emails.send({
      from: 'EcoScan AI <onboarding@resend.dev>', // Replace with your verified Resend domain
      to: [toEmail],
      subject: `Your EcoScan AI Voucher for ${rewardName}!`,
      html: emailHtml,
    });

    if (resendError) {
      console.error('[send-voucher-email] Error sending email:', resendError);
      throw new Error(`Failed to send email: ${resendError.message}`);
    }

    console.log('[send-voucher-email] Email sent successfully:', data);
    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error(`[send-voucher-email] Uncaught error in function: ${error.message}`);
    return new Response(JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});