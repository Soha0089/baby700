const mongoose = require("mongoose");
const axios = require("axios");

const dbUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  usageCount: { type: Number, default: 0 },
});

const flagStatsSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  winCount: { type: Number, default: 0 },
});

const UserUsage = mongoose.models.UserUsage || mongoose.model("UserUsage", userSchema);
const FlagGameStats = mongoose.models.FlagGameStats || mongoose.model("FlagGameStats", flagStatsSchema);

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "flag",
    version: "1.8",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} — play the flag game\n{pn} list — leaderboard\n{pn} myrank — show your flag game rank"
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { flag, author } = Reply;
    const getCoin = 1000;
    const getExp = 121;
    const penaltyCoin = 300;
    const penaltyExp = 100;
    const userData = await usersData.get(event.senderID);

    if (event.senderID !== author) {
      return api.sendMessage("❌ | This is not your flag baby >🐸", event.threadID, event.messageID);
    }

    const reply = event.body.toLowerCase();
    if (reply === flag.toLowerCase()) {
      await api.unsendMessage(Reply.messageID);
      userData.money += getCoin;
      userData.exp += getExp;
      await usersData.set(event.senderID, userData);

      await FlagGameStats.findOneAndUpdate(
        { userID: event.senderID },
        { $inc: { winCount: 1 } },
        { upsert: true, new: true }
      );

      return api.sendMessage(
        `✅ | Correct answer baby.\nYou have earned ${getCoin} coins and ${getExp} exp.`,
        event.threadID, event.messageID
      );
    } else {
      await api.unsendMessage(Reply.messageID);
      userData.money -= penaltyCoin;
      userData.exp -= penaltyExp;
      await usersData.set(event.senderID, userData);

      return api.sendMessage(
        `❌ | Wrong Answer baby!\nCorrect answer was: ${flag}\nyou lost ${penaltyCoin} coins & ${penaltyExp} exp.`,
        event.threadID, event.messageID
      );
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    try {
      const { senderID, threadID, messageID } = event;

      // 🏆 Show Leaderboard
      if (args[0] === "list") {
        const flagStats = await FlagGameStats.find().sort({ winCount: -1 });
        if (flagStats.length === 0) {
          return api.sendMessage("❌ | No one has won the flag game yet!", threadID, messageID);
        }

        let msg = "👑 Flag Game Rankings:\n\n";
        for (let i = 0; i < flagStats.length; i++) {
          const name = await usersData.getName(flagStats[i].userID);
          msg += `${i + 1}. ${name}: ${flagStats[i].winCount} wins\n`;
        }

        return api.sendMessage(msg, threadID, messageID);
      }

      // 🥇 My Rank
      if (args[0] === "myrank") {
        const allStats = await FlagGameStats.find({ winCount: { $gt: 0 } }).sort({ winCount: -1 });
        const rank = allStats.findIndex(entry => entry.userID === senderID) + 1;

        if (rank === 0) {
          return api.sendMessage("❌ | You haven't played the flag game yet!", threadID, messageID);
        }

        const myWins = allStats[rank - 1].winCount;
        return api.sendMessage(`📊 | Your Flag Game Rank:\n🏅 Rank: #${rank}\n✅ Wins: ${myWins}`, threadID, messageID);
      }

      // ⏳ Daily limit system
      const maxLimit = 20;
      const attemptTimeLimit = 10 * 60 * 60 * 1000;
      const currentTime = Date.now();
      const userData = await usersData.get(senderID);

      if (!userData.data.flagAttempts) {
        userData.data.flagAttempts = { count: 0, firstAttempt: currentTime };
      }

      const timeElapsed = currentTime - userData.data.flagAttempts.firstAttempt;
      if (timeElapsed >= attemptTimeLimit) {
        userData.data.flagAttempts = { count: 0, firstAttempt: currentTime };
      }

      if (userData.data.flagAttempts.count >= maxLimit) {
        const timeLeft = attemptTimeLimit - timeElapsed;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return api.sendMessage(
          `❌ | You have reached your daily limit.\nTry again in ${hours}h ${minutes}m.`,
          threadID, messageID
        );
      }

      userData.data.flagAttempts.count++;
      await usersData.set(senderID, userData);

      // 🎌 Fetch random flag from API
      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/flag`, {
        responseType: "json",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const { link, country } = response.data;

      const imageStream = await axios({
        method: "GET",
        url: link,
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      api.sendMessage(
        {
          body: "🌍 A random flag has appeared!\nGuess the flag name (e.g., Bangladesh)",
          attachment: imageStream.data
        },
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: senderID,
            flag: country
          });

          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        messageID
      );
    } catch (error) {
      console.error("Flag game error:", error.message);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
