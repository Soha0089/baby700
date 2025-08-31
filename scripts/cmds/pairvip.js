const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const { MongoClient } = require("mongodb");

const uri = 'mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'vipUser';

let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });

module.exports = {
  config: {
    name: "pairvip",
aliases: ["pair11", "pvip", "p"],
    author: "MahMUD",
    role: 0,
    countDown: 10,
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    if (!db) return api.sendMessage("❌ | Database connection is not initialized.", event.threadID, event.messageID);

    const checkVip = async (uid) => {
      const collection = db.collection("vipUser");
      const user = await collection.findOne({ uid });
      return user && user.expiredAt > new Date();
    };

    const isVip = await checkVip(event.senderID);
    if (!isVip) return api.sendMessage("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫", event.threadID, event.messageID);

    const pathImg = __dirname + "/cache/background.png";
    const pathAvt1 = __dirname + "/cache/Avtmot.png";
    const pathAvt2 = __dirname + "/cache/Avthai.png";

    const botID = api.getCurrentUserID();
    const id1 = event.senderID;
    const threadInfo = await api.getThreadInfo(event.threadID);
    const all = threadInfo.userInfo;

    let name1 = "", name2 = "", gender1;
    for (let u of all) if (u.id == id1) { name1 = u.name || "User 1"; gender1 = u.gender; break; }

    const candidates = all.filter(u => u.id !== id1 && u.id !== botID && (!gender1 || (gender1 === "FEMALE" && u.gender === "MALE") || (gender1 === "MALE" && u.gender === "FEMALE")));
    if (candidates.length === 0) return api.sendMessage("Không tìm thấy người phù hợp để ghép đôi!", event.threadID, event.messageID);

    const id2 = candidates[Math.floor(Math.random() * candidates.length)].id;
    for (let u of all) if (u.id == id2) { name2 = u.name || "User 2"; break; }

    const random = Math.floor(Math.random() * 100) + 1;
    const chancePool = [random, random, random, "0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    const lovePercent = chancePool[Math.floor(Math.random() * chancePool.length)];

    const backgrounds = ["https://i.imgur.com/FuNQ7Aq.jpeg"];
    const bgURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const getImage = async (url, path) => { const res = await axios.get(url, { responseType: "stream", headers }); const writer = fs.createWriteStream(path); res.data.pipe(writer); return new Promise(resolve => writer.on("finish", resolve)); };
    const getAvatar = async (uid, path) => getImage(`https://graph.facebook.com/${uid}/picture?width=1080&height=1080&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, path);

    await Promise.all([getAvatar(id1, pathAvt1), getAvatar(id2, pathAvt2), getImage(bgURL, pathImg)]);

    const baseImg = await loadImage(pathImg);
    const avt1 = await loadImage(pathAvt1);
    const avt2 = await loadImage(pathAvt2);

    const scale = 2;
    const canvas = createCanvas(baseImg.width * scale, baseImg.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // Rectangular avatars with light border
    const size = Math.floor(canvas.width * 0.22);
    const margin = 20 * scale;
    const spacing = 30 * scale;
    const startY = 20 * scale;
    const offsetX = 25 * scale;

    function drawAvatarRect(ctx, img, x, y, size) {
      ctx.drawImage(img, x, y, size, size);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.strokeRect(x, y, size, size);
    }

    drawAvatarRect(ctx, avt1, margin, startY, size);
    drawAvatarRect(ctx, avt2, margin + offsetX, startY + size + spacing, size);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathImg, buffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    function toBoldUnicode(name) {
      const boldAlphabet = {"a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣","k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭","u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳","A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉","K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓","U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙","0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9"," ":" ","'":"' ",",":",",".":".","-":"-","!":"!","?":"?"};
      return name.split('').map(c => boldAlphabet[c] || c).join('');
    }

    const styledName1 = toBoldUnicode(name1);
    const styledName2 = toBoldUnicode(name2);

    return api.sendMessage(
      {
        body: `🥰𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐩𝐚𝐢𝐫𝐢𝐧𝐠\n• ${styledName1}🎀\n• ${styledName2}🎀\n💌𝐖𝐢𝐬𝐡 𝐲𝐨𝐮 𝐭𝐰𝐨 𝐡𝐮𝐧𝐝𝐫𝐞𝐝 𝐲𝐞𝐚𝐫𝐬 𝐨𝐟 𝐡𝐚𝐩𝐩𝐢𝐧𝐞𝐬𝐬💕\n\n𝐋𝐨𝐯𝐞 𝐩𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞 ${lovePercent}%💙`,
        attachment: fs.createReadStream(pathImg),
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  },
};
