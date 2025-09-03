const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["ffuid"],
    version: "1.1",
    author: "Raihan (Converted) + MahMUD Edit",
    role: 0,
    shortDescription: "Get Free Fire player info",
    longDescription: "Fetches Free Fire player profile info using UID",
    category: "game",
    guide: "{pn} <uid>"
  },

  onStart: async function ({ api, event, args }) {
    const uid = args[0];
    if (!uid) return api.sendMessage("⚠️ Please provide a Free Fire UID.", event.threadID, event.messageID);

    try {
      const res = await axios.get(`https://info-ina-1.onrender.com/info?uid=${uid}`);
      const data = res.data;

      if (data.error) return api.sendMessage(`❌ ${data.error}`, event.threadID, event.messageID);

      let msg = `🎮 Player Information 🎮\n\n`;
      msg += `👤 Name: ${data.nickname}\n`;
      msg += `🆔 UID: ${data.uid}\n`;
      msg += `⭐ Level: ${data.level} (Exp: ${data.exp})\n`;
      msg += `🌍 Region: ${data.region}\n`;
      msg += `👍 Likes: ${data.likes}\n`;
      msg += `🏅 Honor Score: ${data.honorScore}\n`;
      msg += `💬 Signature: ${data.signature}\n\n`;

      msg += `📅 Created: ${data.createdAt}\n`;
      msg += `⏰ Last Login: ${data.lastLogin}\n`;
      msg += `📊 BR Rank: ${data.brRank}\n`;
      msg += `📊 CS Rank: ${data.csRank}\n\n`;

      if (data.pet) {
        msg += `🐾 Pet: ${data.pet.name} (Lv.${data.pet.level}, Exp: ${data.pet.exp})\n`;
      }

      if (data.guild) {
        msg += `👥 Guild: ${data.guild.name} (Lv.${data.guild.level})\n`;
        msg += `🔑 Leader: ${data.guild.leader}\n`;
      }

      // ✅ Profile Image fetch & send
      let attachment = [];
      if (data.avatar) {
        const imgPath = __dirname + `/cache/${uid}.jpg`;
        const imgRes = await axios.get(data.avatar, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(imgRes.data, "binary"));
        attachment.push(fs.createReadStream(imgPath));
      }

      api.sendMessage({ body: msg, attachment }, event.threadID, () => {
        if (attachment.length > 0) fs.unlinkSync(__dirname + `/cache/${uid}.jpg`);
      }, event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ API error, try again later.", event.threadID, event.messageID);
    }
  }
};
