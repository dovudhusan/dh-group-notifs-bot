import express from "express";
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ verify: verifyRevenueCatSignature }));

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_GROUP_ID,
  REVENUECAT_WEBHOOK_SECRET,
  PORT
} = process.env;

// 🔐 Verify RevenueCat signature
function verifyRevenueCatSignature(req, res, buf) {
  const signature = req.headers["x-revenuecat-signature"];
  if (!signature) return;

  const hmac = crypto
    .createHmac("sha256", REVENUECAT_WEBHOOK_SECRET)
    .update(buf)
    .digest("hex");

  if (hmac !== signature) {
    throw new Error("Invalid RevenueCat signature");
  }
}

// 📩 Send message to Telegram
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: TELEGRAM_GROUP_ID,
    text,
    parse_mode: "Markdown"
  });
}

// 🧠 Format RevenueCat event
function formatMessage(event) {
  const {
    type,
    app_id,
    user_id,
    product_id,
    store,
    price,
    currency,
    country,
    event_timestamp_ms
  } = event;

  const priceText = price
    ? `${price} ${currency}`
    : "—";

  return `
🚀 *${app_id}*
*Event:* ${type}

👤 *User ID:*
\`${user_id}\`

📦 *Product:*
\`${product_id}\`

🏪 *Store:* ${store}
🌍 *Country:* ${country}
💰 *Revenue:* ${priceText}

⏱ *Time:* ${new Date(event_timestamp_ms).toLocaleString()}
`;
}

// 🎯 RevenueCat Webhook
app.post("/webhook/revenuecat", async (req, res) => {
  try {
    const event = req.body.event;

    if (!event) return res.sendStatus(400);

    const message = formatMessage(event);
    await sendTelegramMessage(message);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
