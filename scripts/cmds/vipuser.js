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

module.exports = {
  config: {
    name: "vip",
    version: "2.0",
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
      list: "🎀 | VIP Users List:\n%1",
      vipServices: "🎀 | VIP Command List:\n1. art\n2. pair4\n3. pair10\n4. gay\n5. jan edit permission\n6. mistake\n7. wlt\n8. edit\n\n> More VIP commands coming soon!"
    }
  },

  onStart: async function ({ message, args, event, usersData, api, getLang }) {
    if (!db) return message.reply("❌ | Database connection is not initialized.");

    const collection = db.collection("vipUser");
    const senderID = event.senderID;

    // Restrict 'add' and 'remove' to specific UID
    if (["add", "remove"].includes(args[0]) && !["61556006709662", "61561299937137", "100051067476600", "61579092599113"].includes(senderID)) {
      return message.reply("❌ | You don't have permission to use this command.\nonly MahMUD can use this");
    }

    const isVip = async (uid) => {
      const user = await collection.findOne({ uid });
      return user && user.expiredAt > new Date();
    };

    const formatUserList = async (uids) => {
      return Promise.all(uids.map(async (uid) => {
        const name = await usersData.getName(uid);
        return `• ${name} (${uid})`;
      }));
    };

    if ((args[0] === "cmd" || args[0] === "command") && event.senderID) {
      return message.reply(getLang("vipServices"));
    }

    switch (args[0]) {
      case "add": {
        let uids = [];

        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.messageReply) {
          uids.push(event.messageReply.senderID);
        } else if (!isNaN(args[1])) {
          uids.push(args[1]);
        }

        if (uids.length === 0) {
          return api.sendMessage("⚠️ | Please mention, reply to a user, or provide a UID.", event.threadID, event.messageID);
        }

        const days = parseInt(args[2] || args[1]);
        if (!days || isNaN(days) || days <= 0) {
          return api.sendMessage("⚠️ | Provide a valid number of days.", event.threadID, event.messageID);
        }

        const added = [], already = [];
        const now = new Date();

        for (const uid of uids) {
          const user = await collection.findOne({ uid });
          if (user && user.expiredAt > now) {
            already.push(uid);
          } else {
            const expiredAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            await collection.updateOne(
              { uid },
              { $set: { uid, expiredAt } },
              { upsert: true }
            );
            added.push(uid);
          }
        }

        const addedList = added.length ? getLang("added", days, (await formatUserList(added)).join("\n")) + "\n" : "";
        const alreadyList = already.length ? getLang("alreadyVip", (await formatUserList(already)).join("\n")) : "";

        return api.sendMessage(addedList + alreadyList, event.threadID, event.messageID);
      }

      case "remove": {
        let uids = [];

        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.messageReply) {
          uids.push(event.messageReply.senderID);
        } else if (!isNaN(args[1])) {
          uids.push(args[1]);
        }

        if (uids.length === 0) {
          return api.sendMessage("⚠️ | Please mention, reply to a user, or provide a UID.", event.threadID, event.messageID);
        }

        const removed = [], notVip = [];

        for (const uid of uids) {
          const result = await collection.deleteOne({ uid });
          if (result.deletedCount > 0) removed.push(uid);
          else notVip.push(uid);
        }

        const removedList = removed.length ? getLang("removed", (await formatUserList(removed)).join("\n")) + "\n" : "";
        const notVipList = notVip.length ? getLang("notVip", (await formatUserList(notVip)).join("\n")) : "";

        return api.sendMessage(removedList + notVipList, event.threadID, event.messageID);
      }

      case "list": {
        const vips = await collection.find({ expiredAt: { $gt: new Date() } }).toArray();
        if (!vips.length) return message.reply("❌ | No active VIP users.");

        const list = await Promise.all(vips.map(async ({ uid, expiredAt }) => {
          const name = await usersData.getName(uid);
          const now = moment();
          const end = moment(expiredAt);
          const duration = moment.duration(end.diff(now));
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();

          let timeLeft = '';
          if (days > 0) timeLeft += `${days}d `;
          if (hours > 0) timeLeft += `${hours}h `;
          if (minutes > 0 && days === 0) timeLeft += `${minutes}m`;

          return `• ${name}\n• ${uid}\n   └ 𝐄𝐱𝐩𝐢𝐫𝐞: ${timeLeft.trim()}`;
        }));

        return message.reply(getLang("list", list.join("\n\n")));
      }

      default:
        return message.SyntaxError();
    }
  }
};
