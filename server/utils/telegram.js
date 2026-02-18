const axios = require("axios");

const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "[Telegram] BOT_TOKEN or CHAT_ID not set. Skipping notification.",
    );
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
    console.log("[Telegram] Notification sent.");
  } catch (err) {
    console.error("[Telegram] Failed to send notification:", err.message);
  }
};

module.exports = { sendTelegramMessage };
