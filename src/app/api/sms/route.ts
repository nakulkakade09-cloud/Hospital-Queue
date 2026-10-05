import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+91${cleaned}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { ok: false, error: 'Missing "to" or "message" in request body' },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM;

    if (!accountSid || !authToken || !fromPhone) {
      console.warn('Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM). Skipping actual SMS dispatch.');
      return NextResponse.json({
        ok: false,
        error: 'Twilio environment variables not configured',
      });
    }

    const formattedTo = formatPhoneNumber(to);
    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedTo,
    });

    return NextResponse.json({
      ok: true,
      sid: result.sid,
    });
  } catch (err: any) {
    console.error('Twilio SMS error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Failed to send SMS' },
      { status: 200 }
    );
  }
}
