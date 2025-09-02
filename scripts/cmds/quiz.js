const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB Connection
const dbUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schema
const quizStatsSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 }
});
const QuizGameStats = mongoose.models.QuizGameStats || mongoose.model("QuizGameStats", quizStatsSchema);

// Load API Base URL
const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "2.0",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} [en|bn]\n{pn} list [page]\n{pn} myrank"
    }
  },

  onStart: async function ({ api, event, usersData, args }) {
    const { senderID, threadID, messageID } = event;

    // 🏆 My Rank
    if (args[0] === "rank") {
      const allStats = await QuizGameStats.find({ correctAnswers: { $gt: 0 } }).sort({ correctAnswers: -1 });
      const rank = allStats.findIndex(entry => entry.userID === senderID) + 1;

      if (rank === 0) {
        return api.sendMessage("❌ | You haven't played the quiz yet!", threadID, messageID);
      }

      const myScore = allStats[rank - 1].correctAnswers;
      return api.sendMessage(`📊 | Your Quiz Game Rank:\n🏅Rank #${rank}\n✅Wins: ${myScore}`, threadID, messageID);
    }

    // 📈 Leaderboard
    if (args[0] === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 200;
      const skip = (page - 1) * perPage;

      const total = await QuizGameStats.countDocuments({ correctAnswers: { $gt: 0 } });
      const pages = Math.ceil(total / perPage);
      const stats = await QuizGameStats.find({ correctAnswers: { $gt: 0 } })
        .sort({ correctAnswers: -1 })
        .skip(skip)
        .limit(perPage);

      if (stats.length === 0) {
        return api.sendMessage("❌ No quiz stats available yet!", threadID, messageID);
      }

      let msg = `👑 Quiz game ranking Page ${page}/${pages}:\n\n`;
      for (let i = 0; i < stats.length; i++) {
        const userName = await usersData.getName(stats[i].userID) || "Unknown";
        msg += `${skip + i + 1}. ${userName}: ${stats[i].correctAnswers} wins\n`;
      }
      msg += `\nUse "${this.config.name} list ${page + 1}" to view next page.`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // ✅ Quiz Start
    const input = args.join("").toLowerCase() || "bn";
    const category = input === "en" || input === "english" ? "english" : "bangla";

    const apiUrl = await mahmud();
    const res = await axios.get(`${apiUrl}/api/quiz?category=${category}`);
    const quiz = res.data;

    if (!quiz?.question) {
      return api.sendMessage("❌ No quiz available from API!", threadID, messageID);
    }

    // Daily limit
    const maxlimit = 15;
    const quizTimeLimit = 10 * 60 * 60 * 1000;
    const currentTime = Date.now();
    const userData = await usersData.get(senderID);

    if (!userData.data.quizs) userData.data.quizs = { count: 0, firstQuiz: currentTime };
    const timeElapsed = currentTime - userData.data.quizs.firstQuiz;

    if (timeElapsed >= quizTimeLimit) {
      userData.data.quizs = { count: 0, firstQuiz: currentTime };
    }

    if (userData.data.quizs.count >= maxlimit) {
      const timeLeft = quizTimeLimit - timeElapsed;
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(`❌ | You reached your quiz limit.\nTry again in ${hours}h ${minutes}m.`, threadID, messageID);
    }

    userData.data.quizs.count++;
    await usersData.set(senderID, userData);

    const { question, correctAnswer, options } = quiz;
    const { a, b, c, d } = options;

    const quizMsg = {
      body: `\n╭──✦ ${question}\n├‣ 𝗔) ${a}\n├‣ 𝗕) ${b}\n├‣ 𝗖) ${c}\n├‣ 𝗗) ${d}\n╰──────────────────‣\n𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐲𝐨𝐮𝐫 𝐚𝐧𝐬𝐰𝐞𝐫.`,
    };

    api.sendMessage(quizMsg, threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        type: "reply",
        commandName: this.config.name,
        author: senderID,
        messageID: info.messageID,
        correctAnswer
      });

      setTimeout(() => {
        api.unsendMessage(info.messageID);
      }, 40000);
    }, messageID);
  },

  onReply: async function ({ event, api, Reply, usersData }) {
    const { correctAnswer, author, messageID } = Reply;
    if (event.senderID !== author)
      return api.sendMessage("❌ This is not your quiz baby!", event.threadID, event.messageID);

    const userAns = event.body.trim().toLowerCase();
    const correctAns = correctAnswer.toLowerCase();
    const userData = await usersData.get(author);

    await api.unsendMessage(messageID);

    if (userAns === correctAns) {
      userData.money += 1000;
      userData.exp += 121;
      await usersData.set(author, userData);

      await QuizGameStats.findOneAndUpdate(
        { userID: author },
        { $inc: { correctAnswers: 1 } },
        { upsert: true }
      );

      return api.sendMessage(`✅ Correct answer baby!\nyou've wins +1000 coins, +121 exp`, event.threadID, event.messageID);
    } else {
      userData.money -= 300;
      userData.exp -= 121;
      await usersData.set(author, userData);

      await QuizGameStats.findOneAndUpdate(
        { userID: author },
        { $inc: { incorrectAnswers: 1 } },
        { upsert: true }
      );

      return api.sendMessage(`❌ Wrong answer baby!\nThe Correct answer: ${correctAnswer}\nYou lost -300 coins, -121 exp`, event.threadID, event.messageID);
    }
  }
};
