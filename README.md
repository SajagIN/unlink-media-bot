# 📥 UNLINK MEDIA BOT
## 🤖 Social Media Grabber Bot

A bot that... grabs stuff. From the internet. For you. You're welcome.

![banner](https://hc-cdn.hel1.your-objectstorage.com/s/v3/b03da5b75d75369af6d7996595e59a4fdabe0b26_bannerbot.png)

## 🧠 What it does

Send this bot a **social media link**, and it’ll do its best to fetch the **video**, **photo**, or **whatever media** is hiding in there. No ads. No BS. Just media.

Supports links from:

* Instagram
* Twitter / X
* TikTok
* YouTube
* Facebook
* Reddit
* Pinterest
* Bilibili
* Twitch
* Vimeo
* SoundCloud
* Dailymotion
* Snapchat
* VK
* And maybe some others I forgot

## 💬 Commands

| Command | Purpose |
|:---:|:---:|
| **/start** | Welcomes you like a polite robot |
| **/about** | Tells you this bot’s creator and link to this repo |
---
## 🛠 How it works

1. You send a link
2. Bot goes “hmm lemme check with zm.io.vn 👀”
3. Gets media URL
4. Downloads it
5. Sends it to you like a loyal digital butler
6. Deletes your message (if it can) so nobody steals your precious memes
7. Sends everything to a **log user** for audit or backup

## 🧪 Tech Stack

* `node-telegram-bot-api` – Telegram bot framework
* `axios` – for poking APIs
* `dotenv` – secrets go brr
* `zm.io.vn` API – the real MVP here
* `stream`, `Buffer`, and `RegExp black magic` – yes

## 📦 Setup

```bash
git clone https://github.com/SajagIN/unlink-media-bot.git  
cd unlink-media-bot  
npm install  
```

Create a `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TG_LOG_USER_ID=your_log_user_tg_user_id_here
ZM_IO_VN_API_KEY=your_zm_api_key_here
```

Then run:

```bash
node index.js
```

## 🧙‍♂️ Creator

This bot was cooked up by [SajagIN](https://github.com/SajagIN) because the internet is full of cool stuff but downloading it shouldn't be a pain.

## 💾 Source & Credits

* ZM.io.vn for the API
* Telegram for the bot platform
* Node.js for not crashing (most days)
* You, for actually reading this far (I know nobody cares but I wrote this README manually)

## 🐛 Known Issues

* Can't delete messages in groups if it’s not an admin (Can't Fix)
* Might send wrong formats on rare edge cases
* API might rate limit if overused – chill, buddy

---

> Life’s too short to screen record everything. ~~Let the bot do it.~~ I don't Care.
