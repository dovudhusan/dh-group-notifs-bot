import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_GROUP_ID,
  REVENUECAT_WEBHOOK_SECRET,
  PORT = 3000
} = process.env;

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
      type = "—",
      app_id = "—",
      user_id = "—",
      product_id = "—",
      store = "—",
      price,
      currency,
      country = "—",
      event_timestamp_ms
    } = event;
  
    const priceText = price ? `${price} ${currency}` : "—";
  
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
  
  ⏱ *Time:* ${event_timestamp_ms ? new Date(event_timestamp_ms).toLocaleString() : "—"}
  `;
  }  

// 🎯 RevenueCat Webhook
app.post("/webhook/revenuecat", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return res.status(401).send("Unauthorized");
    }

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
