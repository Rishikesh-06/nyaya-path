// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

declare const Deno: any;

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contactName, contactPhone, contactEmail, userName, message } = await req.json();

    // --- TWILIO VOICE CALL ---
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say language="te-IN" voice="Google.te-IN-Standard-A">
    ${userName || 'మీకు తెలిసిన వ్యక్తి'} కి సహాయం అవసరం. దయచేసి వారిని వెంటనే సంప్రదించండి.
  </Say>
  <Pause length="1"/>
  <Say language="hi-IN" voice="Polly.Aditi">
    ${userName || 'आपके परिचित'} को अभी मदद की जरूरत है। कृपया उनसे तुरंत संपर्क करें।
  </Say>
  <Pause length="1"/>
  <Say language="en-IN" voice="Polly.Aditi">
    ${userName || 'Someone you know'} needs emotional support right now. Please contact them immediately.
  </Say>
</Response>`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

    const callResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: contactPhone,
        From: TWILIO_PHONE_NUMBER,
        Twiml: twiml,
      }),
    });

    const callData = await callResponse.json();
    console.log('Twilio call response:', callData);

    if (!callResponse.ok) {
      throw new Error(`Twilio Error: ${callData.message || 'Call failed'}`);
    }

    // --- RESEND EMAIL (if email provided) ---
    if (contactEmail) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NYAYA Crisis Alert <onboarding@resend.dev>',
          to: contactEmail,
          subject: `🚨 ${userName || 'Someone'} needs your support right now`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #ef4444; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Crisis Alert</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">from NYAYA Legal Platform</p>
              </div>
              
              <p style="font-size: 16px; color: #333;">Dear <strong>${contactName}</strong>,</p>
              
              <p style="font-size: 15px; color: #444; line-height: 1.6;">
                <strong>${userName || 'Someone you know'}</strong> is going through a very difficult time right now and may need your emotional support.
              </p>

              <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Their message indicated distress:</strong></p>
                <p style="margin: 8px 0 0 0; color: #78350f; font-style: italic;">"${message?.substring(0, 150)}..."</p>
              </div>

              <p style="font-size: 15px; color: #444;">Please reach out to them as soon as possible. A simple call or message can make a huge difference.</p>

              <div style="background: #f0fdf4; border-left: 4px solid #86efac; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Crisis Helplines (India):</strong></p>
                <p style="margin: 8px 0 0 0; color: #15803d; font-size: 14px;">
                  • iCall: 9152987821<br/>
                  • Vandrevala Foundation: 1860-2662-345<br/>
                  • AASRA: 9820466627<br/>
                  • Women Helpline: 1091
                </p>
              </div>

              <p style="font-size: 13px; color: #888; margin-top: 24px;">This alert was sent automatically by NYAYA — India's legal justice platform.</p>
            </div>
          `,
        }),
      });
      
      if (!resendResponse.ok) {
        const emailErr = await resendResponse.json();
        return new Response(
          JSON.stringify({ success: false, error: `Resend Error: ${emailErr.message || 'Email failed to send'}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, callSid: callData.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Crisis alert error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});