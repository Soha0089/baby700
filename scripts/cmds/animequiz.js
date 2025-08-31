const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB Connection
mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection.db;

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "animequiz",
    aliases: ["aniqz"],
    version: "2.0",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} | {pn} list | {pn} rank"
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { aniqzNames, author, messageID } = Reply;

    const getCoin = 1000;
    const getExp = 121;
    const penaltyCoin = 300;
    const penaltyExp = 100;

    if (event.senderID !== author)
      return api.sendMessage("𝐓𝐡𝐢𝐬 𝐢𝐬 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐪𝐮𝐢𝐳 𝐛𝐚𝐛𝐲 >🐸", event.threadID, event.messageID);

    const reply = event.body.trim().toLowerCase();
    const isCorrect = aniqzNames.some(name => name.toLowerCase() === reply);
    const userData = await usersData.get(event.senderID) || { money: 0, exp: 0 };

    await api.unsendMessage(messageID);

    if (isCorrect) {
      await usersData.set(event.senderID, {
        money: (userData.money || 0) + getCoin,
        exp: (userData.exp || 0) + getExp
      });

      await db.collection("animeQuizStats").updateOne(
        { userID: event.senderID },
        { $inc: { correctAnswers: 1 } },
        { upsert: true }
      );

      return api.sendMessage(`✅ | Correct answer!\nYou earned ${getCoin} coins and ${getExp} exp.`, event.threadID, event.messageID);
    } else {
      await usersData.set(event.senderID, {
        money: Math.max(0, (userData.money || 0) - penaltyCoin),
        exp: Math.max(0, (userData.exp || 0) - penaltyExp)
      });

      return api.sendMessage(
        `❌ | Wrong Answer baby.\nYou lost ${penaltyCoin} coins & ${penaltyExp} exp.\nCorrect answer was: ${aniqzNames.join(" / ")}`,
        event.threadID,
        event.messageID
      );
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    const { senderID } = event;

    if (args[0] === "list") {
      const quizStats = await db.collection("animeQuizStats")
        .find({ correctAnswers: { $gte: 0 } })
        .sort({ correctAnswers: -1 })
        .toArray();

      if (quizStats.length === 0)
        return api.sendMessage("No rankings available yet.", event.threadID, event.messageID);

      const namePromises = quizStats.map(stat => usersData.getName(stat.userID));
      const names = await Promise.all(namePromises);

      const message = "👑 Anime Quiz Game Rankings:\n\n" + quizStats.map((stat, index) =>
        `${index + 1}. ${names[index] || `User ID ${stat.userID}`}: ${stat.correctAnswers} wins`
      ).join("\n");

      return api.sendMessage(message, event.threadID, event.messageID);
    }

    if (args[0] === "rank") {
      const allStats = await db.collection("animeQuizStats")
        .find({ correctAnswers: { $gte: 0 } })
        .sort({ correctAnswers: -1 })
        .toArray();

      const rank = allStats.findIndex(stat => stat.userID === senderID);
      const score = allStats[rank]?.correctAnswers || 0;

      if (rank === -1)
        return api.sendMessage("❌ | You haven’t played the anime quiz yet!", event.threadID, event.messageID);

      return api.sendMessage(`📊 | Your Rank: ${rank + 1}\n🏆 Correct Answers: ${score}`, event.threadID, event.messageID);
    }

    const maxLimit = 15;
    const animeTimeLimit = 12 * 60 * 60 * 1000;
    const currentTime = Date.now();

    const userData = await usersData.get(senderID);
    if (!userData.data?.animes)
      userData.data.animes = { count: 0, firstAnime: currentTime };

    const timeElapsed = currentTime - userData.data.animes.firstAnime;
    if (timeElapsed >= animeTimeLimit)
      userData.data.animes = { count: 0, firstAnime: currentTime };

    if (userData.data.animes.count >= maxLimit) {
      const timeLeft = animeTimeLimit - timeElapsed;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(`❌ | You have reached your anime quiz limit.\nTry again in ${hoursLeft}h ${minutesLeft}m.`, event.threadID, event.messageID);
    }

    userData.data.animes.count++;
    await usersData.set(senderID, userData);

    const apiUrl = await baseApiUrl();
    const response = await axios.get(`${apiUrl}/api/aniqz`);
    const { name, imgurLink } = response.data.aniqz; 
    const aniqzNames = Array.isArray(name) ? name : [name];

    const imageStream = await axios({
      url: imgurLink,
      method: "GET",
      responseType: "stream",
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    api.sendMessage(
      {
        body: "🎌 A random anime quiz question has appeared!\nGuess the anime name below ⬇️",
        attachment: imageStream.data
      },
      event.threadID,
      (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: senderID,
          aniqzNames
        });

        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 40000);
      },
      event.messageID
    );
  }
};
