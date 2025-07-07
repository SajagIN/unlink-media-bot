require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Readable } = require('stream');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOG_USER_ID = process.env.TG_LOG_USER_ID;
const API_KEY = process.env.ZM_IO_VN_API_KEY;
const API_URL = 'https://api.zm.io.vn/v1/social/autolink';

if (!BOT_TOKEN || !API_KEY) process.exit(1);

const DOMAINS = [
    "instagram\\.com", "twitter\\.com", "x\\.com", "youtube\\.com", "youtu\\.be", "tiktok\\.com", "pinterest\\.com", "pin\\.it", "facebook\\.com", "fb\\.watch", "reddit\\.com", "redd\\.it", "soundcloud\\.com", "dailymotion\\.com", "vimeo\\.com", "vk\\.com", "snapchat\\.com", "bilibili\\.com", "twitch\\.tv"
];

const LINK_RE = new RegExp(`(https?://)?(www\\.)?(${DOMAINS.join("|")})/[^\\s]+`, "gi");

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const getUserName = (msg) => msg.from.first_name || msg.from.username || "there";

bot.onText(/\/start(?:@[\w_]+)?/, msg => {
    const name = getUserName(msg);
    bot.sendMessage(msg.chat.id, `Hey ${name}, just send me a social link and I’ll get the stuff for ya.`);
});

bot.onText(/\/help(?:@[\w_]+)?/, msg => {
    bot.sendMessage(msg.chat.id, `📥 Just send a social media link and I’ll try to grab the content.\n🧹 Your original message will be deleted if I have permission.`);
});

bot.on('message', async msg => {
    const id = msg.chat.id;
    const txt = msg.text;
    const mid = msg.message_id;
    const chatType = msg.chat.type;

    if (!txt || txt.startsWith('/')) return;
    if (!['private', 'group', 'supergroup'].includes(chatType)) return;

    const links = [...(txt.matchAll(LINK_RE) || [])].map(m => m[0]);
    if (!links.length) return;

    let tempMsgId;
    const name = getUserName(msg);

    for (let link of links) {
        try {
            const sent = await bot.sendMessage(id, `⏳`);
            tempMsgId = sent.message_id;

            let mediaLink = null;
            let buffer = null;
            let isVid = false, isImg = false, isAud = false;
            let fname = `media_${Date.now()}`;

            const res = await axios.post(API_URL, { url: link }, {
                headers: {
                    'content-type': 'application/json',
                    apikey: API_KEY
                }
            });

            const data = res.data;

            const getQ = str => {
                if (!str) return 0;
                const m = str.match(/(\d+)(p|x\d+)?/);
                if (m) return m[2]?.startsWith('x') ? parseInt(m[2].slice(1)) : parseInt(m[1]);
                return 0;
            };

            if (data?.medias?.length) {
                const vids = data.medias.filter(x => x.type === 'video' && x.extension === 'mp4' && x.url)
                    .sort((a, b) => getQ(b.quality) - getQ(a.quality));
                if (vids.length) {
                    mediaLink = vids[0].url;
                    isVid = true;
                    fname += '.mp4';
                } else {
                    const otherVids = data.medias.filter(x => x.type === 'video' && x.url)
                        .sort((a, b) => getQ(b.quality) - getQ(a.quality));
                    if (otherVids.length) {
                        mediaLink = otherVids[0].url;
                        isVid = true;
                        fname += `.${otherVids[0].extension || 'mp4'}`;
                    } else {
                        const imgs = data.medias.filter(x => (x.type === 'photo' || x.type === 'image') && x.url);
                        if (imgs.length) {
                            mediaLink = imgs[0].url;
                            isImg = true;
                            fname += `.${imgs[0].extension || 'jpg'}`;
                        }
                    }
                }
            } else if (data.url) {
                mediaLink = data.url;
                if (data.type?.includes('video')) { isVid = true; fname += '.mp4'; }
                else if (data.type?.includes('image')) { isImg = true; fname += '.jpg'; }
                else if (data.type?.includes('audio')) { isAud = true; fname += '.mp3'; }
                else {
                    if (mediaLink.match(/\.(mp4|mov|webm)$/i)) { isVid = true; fname += '.mp4'; }
                    else if (mediaLink.match(/\.(jpg|jpeg|png|gif)$/i)) { isImg = true; fname += '.jpg'; }
                    else if (mediaLink.match(/\.(mp3|wav|ogg)$/i)) { isAud = true; fname += '.mp3'; }
                    else { fname += '.bin'; }
                }
            }

            const extra = txt.replace(link, '').trim();
            const cap = `${name} : [🔗 Original Post](${link})${extra ? ` ${extra}` : ''}`;

            if (mediaLink) {
                try {
                    const dl = await axios.get(mediaLink, { responseType: 'arraybuffer' });
                    buffer = Buffer.from(dl.data);
                    const stream = () => {
                        const s = new Readable();
                        s.push(buffer);
                        s.push(null);
                        return s;
                    };

                    const opts = { caption: cap, filename: fname, parse_mode: 'Markdown' };

                    if (isVid) {
                        await bot.sendVideo(id, stream(), opts);
                        await bot.sendVideo(LOG_USER_ID, Readable.from(buffer), opts);
                    } else if (isImg) {
                        await bot.sendPhoto(id, stream(), opts);
                        await bot.sendPhoto(LOG_USER_ID, Readable.from(buffer), opts);
                    } else if (isAud) {
                        await bot.sendAudio(id, stream(), opts);
                        await bot.sendAudio(LOG_USER_ID, Readable.from(buffer), opts);
                    } else {
                        await bot.sendDocument(id, stream(), opts);
                        await bot.sendDocument(LOG_USER_ID, Readable.from(buffer), opts);
                    }

                } catch (e) {
                    await bot.sendMessage(LOG_USER_ID, `❌ Download/send failed: ${e.message}`);
                }
            } else {
                await bot.sendMessage(LOG_USER_ID, `No media found for: ${link}\nResponse:\n${JSON.stringify(data)}`);
            }

            try {
                await bot.deleteMessage(id, mid);
            } catch {
                await bot.sendMessage(id, "ℹ️ Can't delete your message. Please give me 'Delete messages' permission.");
            }

            if (tempMsgId) {
                try {
                    await bot.deleteMessage(id, tempMsgId);
                } catch { }
            }

        } catch (e) {
            let msg = `⚠️ Error with link: ${link}`;
            if (e.response) {
                if ([401, 403].includes(e.response.status)) msg = `❌ API auth failed`;
                else if (e.response.status === 429) msg = `🚫 API rate limit exceeded`;
                else msg = `API error ${e.response.status}`;
            } else {
                msg = `Connection error: ${e.message}`;
            }
            await bot.sendMessage(LOG_USER_ID, msg);
            if (tempMsgId) await bot.deleteMessage(id, tempMsgId).catch(() => { });
        }
    }
});

bot.on('polling_error', e => {
    bot.sendMessage(LOG_USER_ID, `⚠️ Polling error: ${e.code} - ${e.message}`).catch(() => {});
});

bot.on('webhook_error', e => {
    bot.sendMessage(LOG_USER_ID, `⚠️ Webhook error: ${e.code} - ${e.message}`).catch(() => {});
});
