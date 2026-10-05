export async function sendSmsNotification(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!to || to.trim().length < 10) {
      return { ok: false, error: 'Invalid phone number' };
    }

    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to.trim(),
        message: message.trim(),
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('SMS dispatch error:', err);
    return { ok: false, error: err?.message || 'Network error' };
  }
}
