const axios = require("axios");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cricketWinSchema = new mongoose.Schema({
  userID: String,
  winCount: { type: Number, default: 0 }
});

const cricketWin = mongoose.models.cricketWin || mongoose.model("cricketWin", cricketWinSchema);

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "cricketgame",
    aliases: ["cricket"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn}"
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { cricketNames, author, messageID } = Reply;
    const getCoin = 1000;
    const getExp = 121;
    const penaltyCoin = 300;
    const penaltyExp = 100;

    if (event.senderID !== author) {
      return api.sendMessage("𝐓𝐡𝐢𝐬 𝐢𝐬 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐪𝐮𝐢𝐳 𝐛𝐚𝐛𝐲 >🐸", event.threadID, event.messageID);
    }

    const reply = event.body.trim().toLowerCase();
    const isCorrect = cricketNames.some(name => name.toLowerCase() === reply);
    const userData = await usersData.get(event.senderID);

    await api.unsendMessage(messageID);

    if (isCorrect) {
      try {
        await usersData.set(event.senderID, {
          money: userData.money + getCoin,
          exp: userData.exp + getExp
        });

        await cricketWin.findOneAndUpdate(
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
        await usersData.set(event.senderID, {
          money: userData.money - penaltyCoin,
          exp: userData.exp - penaltyExp
        });

        return api.sendMessage(
          `❌ | Wrong Answer baby.\nYou lost ${penaltyCoin} coins & ${penaltyExp} exp.\nCorrect answer was: ${cricketNames.join(" / ")}`,
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
      const cricketTimeLimit = 10 * 60 * 60 * 1000; // 10 hours
      const currentTime = Date.now();
      const userData = await usersData.get(senderID);

      if (!userData.data.crickets) {
        userData.data.crickets = { count: 0, firstCricket: currentTime };
      }

      const timeElapsed = currentTime - userData.data.crickets.firstCricket;
      if (timeElapsed >= cricketTimeLimit) {
        userData.data.crickets = { count: 0, firstCricket: currentTime };
      }

      if (userData.data.crickets.count >= maxlimit) {
        const timeLeft = cricketTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return api.sendMessage(
          `❌ | You have reached your cricket quiz limit.\nTry again in ${hoursLeft}h ${minutesLeft}m.`,
          event.threadID,
          event.messageID
        );
      }

      if (args[0] === "list") {
        const cricketStats = await cricketWin.find().sort({ winCount: -1 });

        if (cricketStats.length === 0) {
          return api.sendMessage("No rankings available yet.", event.threadID, event.messageID);
        }

        let message = "🏏 | Cricket Game Rankings:\n\n";
        let i = 0;
        for (const stat of cricketStats) {
          const userName = await usersData.getName(stat.userID);
          message += `${++i}. ${userName}: ${stat.winCount} wins\n`;
        }

        return api.sendMessage(message, event.threadID, event.messageID);
      }

      if (args[0] === "myrank") {
        const cricketStats = await cricketWin.find().sort({ winCount: -1 });
        const myRank = cricketStats.findIndex(stat => stat.userID === senderID);

        if (myRank === -1) {
          return api.sendMessage("❌ | You have not won any cricket games yet.", event.threadID, event.messageID);
        }

        const userWins = cricketStats[myRank].winCount;
        return api.sendMessage(`🏅 | Your Cricket Rank:\n• Rank: ${myRank + 1}\n• Wins: ${userWins}`, event.threadID, event.messageID);
      }

      userData.data.crickets.count += 1;
      await usersData.set(senderID, userData);

      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/cricket`);
      const { name, imgurLink } = response.data.cricket;
      const cricketNames = Array.isArray(name) ? name : [name];

      const imageStream = await axios({
        url: imgurLink,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      api.sendMessage(
        {
          body: "🏏 A famous cricketer has appeared! Guess their name.",
          attachment: imageStream.data
        },
        event.threadID,
        (err, info) => {
          if (err) return;
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            cricketNames
          });

          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 40000);
        },
        event.messageID
      );
    } catch (error) {
      console.error("Error:", error.message);
      api.sendMessage("Failed to start cricket game.", event.threadID, event.messageID);
    }
  }
};
