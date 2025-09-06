const mongoose = require("mongoose");
const axios = require("axios");

const dbUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  usageCount: { type: Number, default: 0 },
});

const slotStatsSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  winCount: { type: Number, default: 0 },
  lossCount: { type: Number, default: 0 }
});

const UserUsage = mongoose.models.UserUsage || mongoose.model("UserUsage", userSchema);
const SlotGameStats = mongoose.models.SlotGameStats || mongoose.model("SlotGameStats", slotStatsSchema);

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = {
  config: {
    name: "slot",
    version: "1.0",
    author: "xxx",
    countDown: 10,
    shortDescription: {
      en: "Slot game",
    },
    longDescription: {
      en: "Slot game.",
    },
    category: "game",
  },
  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to have a chance to win double",
      not_enough_money: "𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐟 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐭𝐡𝐚𝐭 𝐚𝐦𝐨𝐮𝐧𝐭",
      spin_message: "Spinning...",
      win_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧 %1$",
      lose_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 %1$",
      jackpot_message: "𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬, 𝐁𝐚𝐛𝐲!",
      spin_count: ">🎀",
      wrong_use_message: "❌ | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐧𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐚𝐬 𝐲𝐨𝐮𝐫 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭.",
      time_left_message: "❌ | 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐬𝐥𝐨𝐭 𝐥𝐢𝐦𝐢𝐭. 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 %1𝐡 %2𝐦.",
      max_bet_exceeded: "❌ | The maximum bet amount is 10M.",
    },
  },
  onStart: async function ({ args, message, event, usersData, getLang, api }) {
    const { senderID, threadID, messageID } = event;

    if (args[0] === "list") {
      const stats = await SlotGameStats.find().sort({ winCount: -1, lossCount: 1 });
      if (stats.length === 0) {
        return api.sendMessage("❌ | No one has played the slot game yet!", threadID, messageID);
      }

      let msg = "👑 𝐒𝐥𝐨𝐭 𝐆𝐚𝐦𝐞 𝐑𝐚𝐧𝐤𝐢𝐧𝐠𝐬:\n\n";
      for (let i = 0; i < stats.length; i++) {
        const name = await usersData.getName(stats[i].userID);
        msg += `${toBoldNumbers(i + 1)}. ${toBoldUnicode(name)} → 𝐖𝐢𝐧𝐬: ${toBoldNumbers(stats[i].winCount)} / 𝐋𝐨𝐬𝐬𝐞𝐬: ${toBoldNumbers(stats[i].lossCount)}\n`;
      }

      return api.sendMessage(msg, threadID, messageID);
    }

    if (args[0] === "rank") {
      const allStats = await SlotGameStats.find().sort({ winCount: -1, lossCount: 1 });
      const rank = allStats.findIndex(entry => entry.userID === senderID) + 1;

      if (rank === 0) {
        return api.sendMessage("❌ | You haven't played the slot game yet!", threadID, messageID);
      }

      const myStats = allStats[rank - 1];
      return api.sendMessage(
        `📊 | 𝐘𝐨𝐮𝐫 𝐒𝐥𝐨𝐭 𝐆𝐚𝐦𝐞 𝐑𝐚𝐧𝐤:\n🏅 𝐑𝐚𝐧𝐤: #${toBoldNumbers(rank)}\n• 𝐖𝐢𝐧𝐬: ${toBoldNumbers(myStats.winCount)}\n• 𝐋𝐨𝐬𝐬𝐞𝐬: ${toBoldNumbers(myStats.lossCount)}`,
        threadID,
        messageID
      );
    }

    const maxlimit = 20;
    const slotTimeLimit = 10 * 60 * 60 * 1000;

    const currentTime = new Date();
    const userData = await usersData.get(senderID);

    if (!userData.data.slots) {
      userData.data.slots = { count: 0, firstSlot: currentTime.getTime() };
    }

    const timeElapsed = currentTime.getTime() - userData.data.slots.firstSlot;

    if (timeElapsed >= slotTimeLimit) {
      userData.data.slots = { count: 0, firstSlot: currentTime.getTime() };
    }

    if (userData.data.slots.count >= maxlimit) {
      const timeLeft = slotTimeLimit - timeElapsed;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        getLang("time_left_message", toBoldNumbers(hoursLeft), toBoldNumbers(minutesLeft)),
        threadID,
        messageID
      );
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage(getLang("wrong_use_message"), threadID, messageID);
    }

    if (amount > 10000000) {
      return api.sendMessage(getLang("max_bet_exceeded"), threadID, messageID);
    }

    if (userData.money < amount) {
      return api.sendMessage(getLang("not_enough_money"), threadID, messageID);
    }

    userData.data.slots.count += 1;
    await usersData.set(senderID, { ...userData });

    const slots = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    const winnings = calculateWinnings(slot1, slot2, slot3, amount);

    await usersData.set(senderID, {
      money: userData.money + winnings,
      data: userData.data,
    });

    // Track stats in database
    const slotStats = await SlotGameStats.findOne({ userID: senderID }) || new SlotGameStats({ userID: senderID });
    if (winnings > 0) {
      slotStats.winCount += 1;
    } else {
      slotStats.lossCount += 1;
    }
    await slotStats.save();

    const messageText = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang);

    return message.reply(`${getLang("spin_count")}\n${messageText}`);
  },
};

// ========================
// Utility Functions
// ========================

// Bold numbers
function toBoldNumbers(number) {
  const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
  return number.toString().split('').map(c => bold[c] || c).join('');
}

// Bold text
function toBoldUnicode(text) {
  const bold = {
    "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
    "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
    "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳",
    "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉",
    "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍", "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓",
    "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙",
    " ": " ", "'": "'", ",": ",", ".": ".", "-": "-"
  };
  return text.split('').map(c => bold[c] || c).join('');
}

// Winnings calculation
function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
    return betAmount * 10;
  } else if (slot1 === "💜" && slot2 === "💜" && slot3 === "💜") {
    return betAmount * 5;
  } else if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return betAmount * 3;
  } else {
    return -betAmount;
  }
}

// Spin result message
function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang) {
  if (winnings > 0) {
    if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
      return getLang("jackpot_message", formatMoney(winnings), "❤");
    } else {
      return getLang("win_message", formatMoney(winnings)) + `\n• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: [ ${slot1} | ${slot2} | ${slot3} ]`;
    }
  } else {
    return getLang("lose_message", formatMoney(-winnings)) + `\n• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: [ ${slot1} | ${slot2} | ${slot3} ]`;
  }
}

// Format money with bold
function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;

  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }

  return toBoldNumbers(Number(num.toFixed(1))) + units[unit];
}
