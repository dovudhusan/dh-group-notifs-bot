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

// 🔐 Escape special Markdown characters
function escapeMarkdown(text) {
  if (!text) return text;
  // Escape special characters for Telegram Markdown
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
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
  
    // Escape special characters in dynamic values
    const escapedAppId = escapeMarkdown(app_id);
    const escapedType = escapeMarkdown(type);
    const escapedUserId = escapeMarkdown(user_id);
    const escapedProductId = escapeMarkdown(product_id);
    const escapedStore = escapeMarkdown(store);
    const escapedCountry = escapeMarkdown(country);
    const escapedPriceText = escapeMarkdown(priceText);
    const escapedTime = escapeMarkdown(event_timestamp_ms ? new Date(event_timestamp_ms).toLocaleString() : "—");
  
    return `
  🚀 *${escapedAppId}*
  *Event:* ${escapedType}
  
  👤 *User ID:*
  \`${escapedUserId}\`
  
  📦 *Product:*
  \`${escapedProductId}\`
  
  🏪 *Store:* ${escapedStore}
  🌍 *Country:* ${escapedCountry}
  💰 *Revenue:* ${escapedPriceText}
  
  ⏱ *Time:* ${escapedTime}
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