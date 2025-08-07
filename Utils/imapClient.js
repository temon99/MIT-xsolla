// ⚠️ Disables SSL cert validation globally (ONLY for test/dev)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchLatestOtp({ email, appPassword }) {
  // Wait to ensure the OTP email arrives
  await delay(10000); // 10 seconds (adjust if needed)

  const config = {
    imap: {
      user: email,
      password: appPassword,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  const connection = await imaps.connect(config);
  await connection.openBox('INBOX');

  const sinceDate = new Date(Date.now() - 5 * 60 * 1000); // Last 5 mins

  const searchCriteria = [
    ['SINCE', sinceDate.toUTCString()],
    ['FROM', 'noreply@login.xsolla.com'],
    ['SUBJECT', 'Your confirmation code'],
  ];

  const fetchOptions = {
    bodies: ['HEADER', 'TEXT'],
    markSeen: true,
  };

  const messages = await connection.search(searchCriteria, fetchOptions);

  if (!messages.length) {
    await connection.end();
    throw new Error('No recent OTP email found');
  }

  // Sort by date descending to get the most recent
  messages.sort((a, b) => {
    const dateA = new Date(a.attributes.date);
    const dateB = new Date(b.attributes.date);
    return dateB - dateA;
  });

  const latestMessage = messages[0];
  const bodyPart = latestMessage.parts.find(part => part.which === 'TEXT');
  const parsed = await simpleParser(bodyPart.body);

  const otpMatch = parsed.text.match(/\b\d{6}\b/);
  await connection.end();

  if (otpMatch) {
    return otpMatch[0];
  }

  throw new Error('OTP not found in the latest email');
}
