const { config } = global.GoatBot;
const fs = require("fs-extra");
const axios = require("axios");

const allowedThreadID = "7460623087375340"; // Bot Support Group ID
const specialUID = "61556006709662"; // Special User ID

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "approve"],
    version: "1.7",
    author: "Mah MUD",
    countDown: 10,
    role: 2,
    category: "utility",
    whiteListModeThread: {
      whiteListThreadIds: [] // Store the whitelisted thread IDs
    }
  },

  onReply: async function ({ message, api, event, Reply, usersData }) {
    const { author, pending } = Reply;
    const { body, threadID, messageID, senderID } = event;

    // Allow special UID to bypass restrictions
    if (senderID !== specialUID && threadID !== allowedThreadID) {
      return api.sendMessage(
        "❌ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐫𝐨𝐮𝐩 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.\n\n𝐓𝐲𝐩𝐞 !joingc 𝐭𝐨 𝐚𝐝𝐝 𝐲𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩 𝐭𝐨 𝐛𝐨𝐭 𝐬𝐮𝐩𝐩𝐨𝐫𝐭.",
        threadID,
        messageID
      );
    }

    if (String(senderID) !== String(author) && senderID !== specialUID) return;

    let count = 0;
    const index = body.split(/\s+/);

    for (const singleIndex of index) {
      if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > pending.length)
        return api.sendMessage(`❯ ${singleIndex} Not a valid number`, threadID, messageID);

      api.unsendMessage(messageID);

      api.changeNickname(
        `𝙔𝙤𝙪𝙧 𝙗𝙖𝙗𝙮 め`,
        pending[singleIndex - 1].threadID,
        api.getCurrentUserID()
      );
      api.sendMessage(
        { body: `Bot is now connected! Use !help to see the Command Lists` },
        pending[singleIndex - 1].threadID
      );

      const approvedByName = await usersData.getName(senderID);
      api.sendMessage(`✅ | 𝐆𝐫𝐨𝐮𝐩 𝐚𝐩𝐩𝐫𝐨𝐯𝐞𝐝 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐛𝐲 ${approvedByName}`, pending[singleIndex - 1].threadID);

      const directID = pending[singleIndex - 1].threadID;
      if (!this.config.whiteListModeThread.whiteListThreadIds.includes(directID)) {
        this.config.whiteListModeThread.whiteListThreadIds.push(directID);
      }

      count += 1;
    }

    return api.sendMessage(`✅ | 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐚𝐩𝐩𝐫𝐨𝐯𝐞𝐝 ${count} 𝐭𝐡𝐫𝐞𝐚𝐝`, threadID, messageID);
  },

  onStart: async function ({ message, api, event }) {
    const { threadID, messageID, senderID } = event;
    const commandName = this.config.name;

    // Allow special UID to bypass restrictions
    if (senderID !== specialUID && threadID !== allowedThreadID) {
      return api.sendMessage(
        "❌ 𝐎𝐧𝐥𝐲 𝐁𝐨𝐭 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐫𝐨𝐮𝐩 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.\n\n𝐓𝐲𝐩𝐞 !joingc 𝐭𝐨 𝐚𝐝𝐝 𝐲𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩 𝐭𝐨 𝐛𝐨𝐭 𝐬𝐮𝐩𝐩𝐨𝐫𝐭.",
        threadID,
        messageID
      );
    }

    let msg = "", index = 1;

    try {
      var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) {
      return api.sendMessage("[ ERR ] can't get the current list", threadID, messageID);
    }

    const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    for (const single of list) {
      const threadName = single.name || "Unknown";
      msg += `│${index++}. ${threadName}\n│𝐓𝐈𝐃:${single.threadID}\n`;
    }

    if (list.length !== 0) {
      return api.sendMessage(
        `╭─╮\n│𝐓𝐨𝐭𝐚𝐥 𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐠𝐫𝐨𝐮𝐩: ${list.length} \n${msg}╰───────────ꔪ\n\n𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐭𝐡𝐞 𝐨𝐫𝐝𝐞𝐫 𝐧𝐮𝐦𝐛𝐞𝐫 𝐛𝐞𝐥𝐨𝐰 𝐭𝐨 𝐚𝐩𝐩𝐫𝐨𝐯𝐞`,
        threadID,
        (error, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );
    } else {
      return api.sendMessage("There are currently no groups in the queue", threadID, messageID);
    }
  }
};
