const axios = require("axios");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cartoonWinSchema = new mongoose.Schema({
  userID: String,
  winCount: { type: Number, default: 0 }
});

const cartoonWin = mongoose.models.cartoonWin || mongoose.model("cartoonWin", cartoonWinSchema);

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "cartoongame",
    aliases: ["cartoon"],
    version: "1.8",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} | {pn} list | {pn} myrank"
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { cartoonNames, author, messageID } = Reply;
    const getCoin = 1000;
    const getExp = 121;
    const penaltyCoin = 300;
    const penaltyExp = 100;

    if (event.senderID !== author) {
      return api.sendMessage("𝐓𝐡𝐢𝐬 𝐢𝐬 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐪𝐮𝐢𝐳 𝐛𝐚𝐛𝐲 >🐸", event.threadID, event.messageID);
    }

    const reply = event.body.trim().toLowerCase();
    const isCorrect = cartoonNames.some(name => name.toLowerCase() === reply);
    const userData = await usersData.get(event.senderID);

    await api.unsendMessage(messageID);

    if (isCorrect) {
      try {
        userData.money += getCoin;
        userData.exp += getExp;
        await usersData.set(event.senderID, userData);

        await cartoonWin.findOneAndUpdate(
          { userID: event.senderID },
          { $inc: { winCount: 1 } },
          { upsert: true }
        );

        return api.sendMessage(
          `✅ | Correct answer baby.\nYou have earned ${getCoin} coins and ${getExp} exp.`,
          event.threadID,
          event.messageID
        );
      } catch (err) {
        console.log("Error: ", err.message);
      }
    } else {
      try {
        userData.money -= penaltyCoin;
        userData.exp -= penaltyExp;
        await usersData.set(event.senderID, userData);

        return api.sendMessage(
          `❌ | Wrong Answer baby.\nYou lost ${penaltyCoin} coins & ${penaltyExp} exp.\nCorrect answer was: ${cartoonNames.join(" / ")}`,
          event.threadID,
          event.messageID
        );
      } catch (err) {
        console.log("Error: ", err.message);
      }
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const { senderID } = event;
      const maxlimit = 15;
      const cartoonTimeLimit = 12 * 60 * 60 * 1000; // 12 hours
      const currentTime = Date.now();
      const userData = await usersData.get(senderID);

      if (!userData.data.cartoons) {
        userData.data.cartoons = { count: 0, firstCartoon: currentTime };
      }

      const timeElapsed = currentTime - userData.data.cartoons.firstCartoon;
      if (timeElapsed >= cartoonTimeLimit) {
        userData.data.cartoons = { count: 0, firstCartoon: currentTime };
      }

      if (userData.data.cartoons.count >= maxlimit) {
        const timeLeft = cartoonTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return api.sendMessage(
          `❌ | You have reached your cartoon quiz limit.\nTry again in ${hoursLeft}h ${minutesLeft}m.`,
          event.threadID,
          event.messageID
        );
      }

      if (args[0] === "list") {
        const cartoonStats = await cartoonWin.find().sort({ winCount: -1 });

        if (cartoonStats.length === 0) {
          return api.sendMessage("No rankings available yet.", event.threadID, event.messageID);
        }

        let message = "👑 | Cartoon Game Rankings:\n\n";
        let i = 0;
        for (const stat of cartoonStats) {
          const userName = await usersData.getName(stat.userID);
          message += `${++i}. ${userName}: ${stat.winCount} wins\n`;
        }

        return api.sendMessage(message, event.threadID, event.messageID);
      }

      if (args[0] === "myrank") {
        const cartoonStats = await cartoonWin.find().sort({ winCount: -1 });
        const rank = cartoonStats.findIndex(s => s.userID === senderID);

        if (rank === -1) {
          return api.sendMessage("❌ | You haven't played any cartoon quiz yet!", event.threadID, event.messageID);
        }

        return api.sendMessage(`📊 | Your Rank: ${rank + 1}\n🏆 Wins: ${cartoonStats[rank].winCount}`, event.threadID, event.messageID);
      }

      // Increment user cartoon count
      userData.data.cartoons.count += 1;
      await usersData.set(senderID, userData);

      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/cartoon`);
      const { name, imgurLink } = response.data.cartoon;
      const cartoonNames = Array.isArray(name) ? name : [name];

      const imageStream = await axios({
        url: imgurLink,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      api.sendMessage(
        {
          body: "🧸 A random cartoon character has appeared!\nGuess their name below:",
          attachment: imageStream.data
        },
        event.threadID,
        (err, info) => {
          if (err) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: senderID,
            cartoonNames
          });

          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        event.messageID
      );
    } catch (error) {
      console.error("Error:", error.message);
      api.sendMessage("Failed to start cartoon game.", event.threadID, event.messageID);
    }
  }
};
