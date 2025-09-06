const { MongoClient } = require('mongodb');
const moment = require('moment-timezone');

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

// Convert to bold numbers
function toBoldNumbers(number) {
  const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
  return number.toString().split('').map(c => bold[c] || c).join('');
}

// Convert text to bold unicode
function toBoldUnicode(text) {
  const bold = {
    "a": "𝐚","b": "𝐛","c": "𝐜","d": "𝐝","e": "𝐞","f": "𝐟","g": "𝐠","h": "𝐡","i": "𝐢","j": "𝐣",
    "k": "𝐤","l": "𝐥","m": "𝐦","n": "𝐧","o": "𝐨","p": "𝐩","q": "𝐪","r": "𝐫","s": "𝐬","t": "𝐭",
    "u": "𝐮","v": "𝐯","w": "𝐰","x": "𝐱","y": "𝐲","z": "𝐳",
    "A": "𝐀","B": "𝐁","C": "𝐂","D": "𝐃","E": "𝐄","F": "𝐅","G": "𝐆","H": "𝐇","I": "𝐈","J": "𝐉",
    "K": "𝐊","L": "𝐋","M": "𝐌","N": "𝐍","O": "𝐎","P": "𝐏","Q": "𝐐","R": "𝐑","S": "𝐒","T": "𝐓",
    "U": "𝐔","V": "𝐕","W": "𝐖","X": "𝐗","Y": "𝐘","Z": "𝐙",
    "0": "𝟎","1": "𝟏","2": "𝟐","3": "𝟑","4": "𝟒","5": "𝟓","6": "𝟔","7": "𝟕","8": "𝟖","9": "𝟗",
    " ": " ","'": "'","-": "-",".": "."
  };
  return text.split('').map(c => bold[c] || c).join('');
}

module.exports = {
  config: {
    name: "vip",
    version: "2.1",
    author: "ntkhang modified by mahmud",
    countDown: 5,
    role: 0,
    category: "admin",
    guide: {
      en: 'Examples:\n' +
        '   {pn} add @tag 5 - Add VIP to mentioned user(s) for 5 days\n' +
        '   {pn} add <uid> 5 - Add VIP by user ID\n' +
        '   Reply to a user\'s message with:\n' +
        '   {pn} add 5 - Add VIP to the replied user\n\n' +
        '   {pn} remove @tag - Remove VIP role\n' +
        '   {pn} list - Show all VIP users\n' +
        '   {pn} cmd - Show VIP commands list'
    }
  },

  langs: {
    en: {
      added: "✅ | Added VIP for %1 days to:\n%2",
      alreadyVip: "⚠️ | Already VIP:\n%1",
      removed: "✅ | Removed VIP:\n%1",
      notVip: "⚠️ | Not VIP:\n%1",
      list: "👑 | List of VIP User Role",
      vipServices: "🎀 | VIP Command List:\n1. art\n2. pair4\n3. pair10\n4. gay\n5. jan edit permission\n6. mistake\n7. wlt\n8. edit\n\n> More VIP commands coming soon!"
    }
  },

  onStart: async function ({ message, args, event, usersData, api, getLang }) {
    if (!db) return message.reply(toBoldUnicode("❌ | Database connection is not initialized."));

    const collection = db.collection("vipUser");
    const senderID = event.senderID;

    // Restrict 'add' and 'remove' to specific UID
    if (["add", "remove"].includes(args[0]) &&
      !["61556006709662", "61561299937137", "100051067476600", "61579092599113", "61580056291787"].includes(senderID)) {
      return message.reply(toBoldUnicode("❌ | You don't have permission to use this command.\nOnly MahMUD can use this"));
    }

    if ((args[0] === "cmd" || args[0] === "command") && event.senderID) {
      return message.reply(toBoldUnicode(getLang("vipServices")));
    }

    switch (args[0]) {
      case "add": {
        let uids = [];
        if (Object.keys(event.mentions).length > 0) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else if (!isNaN(args[1])) uids.push(args[1]);

        if (uids.length === 0) return api.sendMessage(toBoldUnicode("⚠️ | Please mention, reply to a user, or provide a UID."), event.threadID, event.messageID);

        const days = parseInt(args[2] || args[1]);
        if (isNaN(days)) return message.reply(toBoldUnicode("⚠️ | Please provide the number of days."));

        const addedUsers = [];
        const alreadyVipUsers = [];

        for (const uid of uids) {
          const user = await collection.findOne({ uid });
          const expiresAt = moment().tz("Asia/Dhaka").add(days, "days").toDate();
          if (user && user.expiredAt > new Date()) alreadyVipUsers.push(await usersData.getName(uid));
          else {
            await collection.updateOne({ uid }, { $set: { uid, expiredAt: expiresAt } }, { upsert: true });
            addedUsers.push(await usersData.getName(uid));
          }
        }

        if (addedUsers.length > 0) message.reply(toBoldUnicode(`✅ | Added VIP for ${days} days to:\n${addedUsers.join(", ")}`));
        if (alreadyVipUsers.length > 0) message.reply(toBoldUnicode(`⚠️ | Already VIP:\n${alreadyVipUsers.join(", ")}`));
        break;
      }

      case "remove": {
        let uids = [];
        if (Object.keys(event.mentions).length > 0) uids = Object.keys(event.mentions);
        else if (event.messageReply) uids.push(event.messageReply.senderID);
        else if (!isNaN(args[1])) uids.push(args[1]);

        if (uids.length === 0) return api.sendMessage(toBoldUnicode("⚠️ | Please mention, reply to a user, or provide a UID."), event.threadID, event.messageID);

        const removedUsers = [];
        const notVipUsers = [];

        for (const uid of uids) {
          const user = await collection.findOne({ uid });
          if (user) {
            await collection.deleteOne({ uid });
            removedUsers.push(await usersData.getName(uid));
          } else notVipUsers.push(await usersData.getName(uid));
        }

        if (removedUsers.length > 0) message.reply(toBoldUnicode(`✅ | Removed VIP:\n${removedUsers.join(", ")}`));
        if (notVipUsers.length > 0) message.reply(toBoldUnicode(`⚠️ | Not VIP:\n${notVipUsers.join(", ")}`));
        break;
      }

      case "list": {
        const vipUsers = await collection.find({ expiredAt: { $gt: new Date() } }).toArray();
        if (vipUsers.length === 0) return message.reply(toBoldUnicode("❌ | No VIP users found."));

        // Sort descending by expiry
        vipUsers.sort((a, b) => new Date(b.expiredAt) - new Date(a.expiredAt));

        const list = await Promise.all(vipUsers.map(async (user) => {
          const name = await usersData.getName(user.uid);
          const boldName = toBoldUnicode(name);
          const boldDate = toBoldNumbers(moment(user.expiredAt).tz("Asia/Dhaka").format("DD-MM-YYYY"));
          return `╭‣ ${boldName}\n╰‣ ${toBoldUnicode("Expires")}: ${boldDate}`;
        }));

        const total = toBoldNumbers(vipUsers.length);
        return message.reply(`👑 | ${toBoldUnicode("List of VIP User Role")}: ${total}\n\n${list.join("\n\n")}`);
      }

      default:
        return message.reply(toBoldUnicode("⚠️ | Invalid action. Use add/remove/list/cmd."));
    }
  }
};
