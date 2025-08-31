const mongoose = require("mongoose");
const axios = require("axios");

// MongoDB Connection
mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define Schema for Waifu Wins
const waifuWinSchema = new mongoose.Schema({
  userID: String,
  winCount: { type: Number, default: 0 }
});
const WaifuWin = mongoose.models.WaifuWin || mongoose.model("WaifuWin", waifuWinSchema);

// Base API URL
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "waifu",
    version: "2.0",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — play\n{pn} list — show leaderboard\n{pn} myrank — show your rank"
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    const { senderID, threadID, messageID } = event;

    try {
      // 🏆 Show my rank
      if (args[0] === "myrank") {
        const stats = await WaifuWin.find().sort({ winCount: -1 });
        const rank = stats.findIndex(entry => entry.userID === senderID) + 1;

        if (rank === 0) return api.sendMessage("❌ | You haven't played yet.", threadID, messageID);
        const userWins = stats[rank - 1].winCount;
        return api.sendMessage(`📊 | Your Waifu Rank: #${rank}\n🥇 Wins: ${userWins}`, threadID, messageID);
      }

      // 🥇 Show leaderboard
      if (args[0] === "list") {
        const waifuStats = await WaifuWin.find().sort({ winCount: -1 });

        if (waifuStats.length === 0) return api.sendMessage("No rankings available yet.", threadID, messageID);

        let msg = "👑 | Waifu Game Rankings:\n\n";
        let i = 0;
        for (const stat of waifuStats.slice(0, 200)) {
          const userName = await usersData.getName(stat.userID);
          msg += `${++i}. ${userName}: ${stat.winCount} wins\n`;
        }
        return api.sendMessage(msg, threadID, messageID);
      }

      // ✅ Play Game
      const maxlimit = 20;
      const waifuTimeLimit = 10 * 60 * 60 * 1000;
      const currentTime = Date.now();
      const userData = await usersData.get(senderID);

      if (!userData.data.waifus) {
        userData.data.waifus = { count: 0, firstWaifu: currentTime };
      }

      const timeElapsed = currentTime - userData.data.waifus.firstWaifu;
      if (timeElapsed >= waifuTimeLimit) {
        userData.data.waifus = { count: 0, firstWaifu: currentTime };
      }

      if (userData.data.waifus.count >= maxlimit) {
        const timeLeft = waifuTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return api.sendMessage(
          `❌ | You have reached your waifu attempt limit (${maxlimit}). Try again in ${hoursLeft}h ${minutesLeft}m.`,
          threadID,
          messageID
        );
      }

      userData.data.waifus.count++;
      await usersData.set(senderID, userData);

      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/waifu`);
      const { name, imgurLink } = response.data.waifu;

      const imageStream = await axios({
        url: imgurLink,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      api.sendMessage(
        {
          body: "A random waifu has appeared! Guess the waifu name.",
          attachment: imageStream.data
        },
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: senderID,
            waifu: name
          });

          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        messageID
      );

    } catch (error) {
      console.error("Waifu Error:", error);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { waifu, author, messageID } = Reply;
    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    const reply = event.body?.trim()?.toLowerCase();

    if (senderID !== author) return api.sendMessage("❌ | This is not your waifu quiz, baby >🐸", event.threadID, event.messageID);
    if (!reply) return;

    const correct = reply === waifu.toLowerCase();
    await api.unsendMessage(messageID);

    if (correct) {
      await usersData.set(senderID, {
        money: userData.money + 1000,
        exp: userData.exp + 121,
        data: userData.data
      });

      await WaifuWin.findOneAndUpdate(
        { userID: senderID },
        { $inc: { winCount: 1 } },
        { upsert: true, new: true }
      );

      api.sendMessage("✅ | Correct answer baby!\nYou've earned 1000 coins and 121 exp.", event.threadID, event.messageID);
    } else {
      await usersData.set(senderID, {
        money: userData.money - 300,
        exp: userData.exp - 100,
        data: userData.data
      });

      api.sendMessage(`❌ | Wrong answer baby.\nYou lost 300 coins and 100 exp.\nCorrect answer: ${waifu}`, event.threadID, event.messageID);
    }
  }
};
