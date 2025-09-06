const { MongoClient } = require("mongodb");

const mongoUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";

function formatMoney(amount) {
return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

module.exports = {
  config: {
    name: "bank",
    version: "1.7",
    description: "Deposit, withdraw money, and earn interest",
    guide: {
    en: "{pn}Bank:\n - Interest\n - Balance\n - Withdraw\n - Deposit\n - Transfer\n - Top\n - Loan\n - Payloan",
    },
    category: "economy",
    countDown: 10,
    role: 0,
    author: "Loufi | SiAM | Samuel\n\nModified: Shikaki",
  },

  onStart: async function ({ args, message, event, api, usersData }) {
    const { getPrefix } = global.utils;
    const p = getPrefix(event.threadID);

    const commandAliases = {
      "bal": "balance",
      "-d": "deposit",
      "-w": "withdraw",
      "-i": "interest",
      "-t": "transfer",
      "-l": "loan",
      "-pl": "payloan"
    };

    const command = commandAliases[args[0]?.toLowerCase()] || args[0]?.toLowerCase();
    
    const userMoney = await usersData.get(event.senderID, "money");
    const userId = parseInt(event.senderID);

    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
      await client.connect();
      const database = client.db("GoatBotV2");
      const bankCollection = database.collection("bankData");

      let bankData = await bankCollection.findOne({ userId });
      if (!bankData) {
        bankData = { userId, bank: 0, lastInterestClaimed: Date.now() };
        await bankCollection.insertOne(bankData);
      }

      const bankBalance = bankData.bank || 0;
      const amount = parseInt(args[1]);

     if (command === "balance") {
    if (event.type === "message_reply") {
        const reply = event.messageReply;
        const userID = reply.senderID;
        const userName = reply.senderName || (await usersData.get(userID, "name")) || "𝐔𝐧𝐤𝐧𝐨𝐰𝐧 𝐔𝐬𝐞𝐫";
        let repliedUserBankData = await bankCollection.findOne({ userId: parseInt(userID) });
        if (!repliedUserBankData) {
         repliedUserBankData = { userId: parseInt(userID), bank: 0, lastInterestClaimed: Date.now() };
         await bankCollection.insertOne(repliedUserBankData);
        }
        const repliedUserBankBalance = repliedUserBankData.bank || 0;
        return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n${userName}'s 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐬: ${formatMoney(repliedUserBankBalance)}.`);
    }

    if (Object.keys(event.mentions).length > 0) {
        const uids = Object.keys(event.mentions);
        const mentionsBalances = await Promise.all(
            uids.map(async (uid) => {
                const userName = event.mentions[uid] || (await usersData.get(uid, "name")) || "𝐔𝐧𝐤𝐧𝐨𝐰𝐧 𝐔𝐬𝐞𝐫";
                let userBankData = await bankCollection.findOne({ userId: parseInt(uid) });
                if (!userBankData) {
                    userBankData = { userId: parseInt(uid), bank: 0, lastInterestClaimed: Date.now() };
                    await bankCollection.insertOne(userBankData);
                }
                const userBankBalance = userBankData.bank || 0;
                return `${userName}'s 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐬: ${formatMoney(userBankBalance)}`;
            })
        );
        return message.reply(`[🏦𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n${mentionsBalances.join("\n")}`);
    }

    return message.reply(`╭─[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n│\n│‣𝐘𝐨𝐮𝐫 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(bankBalance || 0)}.\n╰────────────⭓`);
}
	    

if (command === "deposit") {
    console.log("𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐝𝐞𝐩𝐨𝐬𝐢𝐭...");
    if (isNaN(amount) || amount <= 0) {
        return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐝𝐞𝐩𝐨𝐬𝐢𝐭.");
    }
    if (userMoney < amount) {
        return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐟𝐮𝐧𝐝𝐬 𝐭𝐨 𝐝𝐞𝐩𝐨𝐬𝐢𝐭.");
    }
    try {
        const result = await bankCollection.updateOne({ userId }, { $inc: { bank: amount } });
        if (result.modifiedCount === 0) {
            console.log("𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐮𝐩𝐝𝐚𝐭𝐞 𝐛𝐚𝐧𝐤 𝐝𝐚𝐭𝐚.");
            return message.reply("[🏦 𝐇𝐢𝐧𝐚𝐭𝐚 𝐁𝐚𝐧𝐤 🏦]\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐝𝐞𝐩𝐨𝐬𝐢𝐭𝐢𝐧𝐠 𝐲𝐨𝐮𝐫 𝐟𝐮𝐧𝐝𝐬.");
        }
        await usersData.set(event.senderID, { money: userMoney - amount });

        return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐝𝐞𝐩𝐨𝐬𝐢𝐭𝐞𝐝 $${formatMoney(amount)}`);
    } catch (error) {
        console.error("𝐄𝐫𝐫𝐨𝐫 𝐝𝐮𝐫𝐢𝐧𝐠 𝐝𝐞𝐩𝐨𝐬𝐢𝐭:", error);
        return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐩𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐲𝐨𝐮𝐫 𝐝𝐞𝐩𝐨𝐬𝐢𝐭 𝐫𝐞𝐪𝐮𝐞𝐬𝐭.");
    }
}

if (command === "withdraw") {
    if (isNaN(amount) || amount <= 0) {
        return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐭𝐡𝐞 𝐜𝐨𝐫𝐫𝐞𝐜𝐭 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐰𝐢𝐭𝐡𝐝𝐫𝐚𝐰.");
    }
    if (amount > bankBalance) {
        return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐰𝐢𝐭𝐡𝐝𝐫𝐚𝐰.");
    }
    await bankCollection.updateOne({ userId }, { $inc: { bank: -amount } });
    await usersData.set(event.senderID, { money: userMoney + amount });

    return message.reply(`╭─[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n│\n│‣✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐰𝐢𝐭𝐡𝐝𝐫𝐞𝐰 $${formatMoney(amount)}\n╰────────────⭓`);
}
	
if (command === "set") {
  if (args.length < 3) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐲 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐮𝐬𝐞𝐫 𝐈𝐃(𝐬) 𝐚𝐧𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐬𝐞𝐭.");
  }

  const targetUIDs = args.slice(1, args.length - 1);
  const newAmount = parseInt(args[args.length - 1]);

  if (isNaN(newAmount) || newAmount < 0) {
    return message.reply("[🏦𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐬𝐞𝐭.");
  }

  if (event.senderID !== '61556006709662') {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐝𝐨 𝐧𝐨𝐭 𝐡𝐚𝐯𝐞 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧 𝐭𝐨 𝐬𝐞𝐭 𝐭𝐡𝐞 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞.");
  }

  if (targetUIDs.length === 0) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐲 𝐚𝐭 𝐥𝐞𝐚𝐬𝐭 𝐨𝐧𝐞 𝐮𝐬𝐞𝐫 𝐈𝐃.");
  }

  let successfulUpdates = [];
  let failedUpdates = [];

  for (let i = 0; i < targetUIDs.length; i++) {
    const targetUID = parseInt(targetUIDs[i]);

    if (isNaN(targetUID)) {
      failedUpdates.push(targetUID);
      continue;
    }

    const targetBankData = await bankCollection.findOne({ userId: targetUID });
    if (!targetBankData) {
      failedUpdates.push(targetUID);
      continue;
    }

    await bankCollection.updateOne(
      { userId: targetUID },
      { $set: { bank: newAmount } }
    );

    successfulUpdates.push(targetUID);
  }

  let responseMessage = "[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n";
  if (successfulUpdates.length > 0) {
    responseMessage += `✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐬𝐞𝐭 𝐛𝐚𝐧𝐤 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐨𝐟 𝐮𝐬𝐞𝐫(𝐬) ${successfulUpdates.join(", ")} 𝐭𝐨 $${formatMoney(newAmount)}.\n`;
  }
  if (failedUpdates.length > 0) {
    responseMessage += `❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐟𝐢𝐧𝐝 𝐮𝐬𝐞𝐫(𝐬) ${failedUpdates.join(", ")} 𝐨𝐫 𝐢𝐧𝐯𝐚𝐥𝐢𝐝 𝐮𝐬𝐞𝐫 𝐈𝐃𝐬.\n`;
  }

  return message.reply(responseMessage);
}
	 	    
if (command === "interest") {
  const interestRate = 0.01; 
  const lastInterestClaimed = bankData.lastInterestClaimed || 0;
  const maxBankLimit = 20_000_000; 

  const currentTime = Date.now();
  const timeDiffInSeconds = (currentTime - lastInterestClaimed) / 1000;

  if (timeDiffInSeconds < 86400) {
    const remainingTime = Math.ceil(86400 - timeDiffInSeconds);
    const remainingHours = Math.floor(remainingTime / 3600);
    const remainingMinutes = Math.floor((remainingTime % 3600) / 60);

    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐜𝐚𝐧 𝐜𝐥𝐚𝐢𝐦 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 " + remainingHours + " 𝐡 𝐚𝐧𝐝 " + remainingMinutes + " 𝐦");
  }

  if (bankData.bank <= 0) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐚𝐧𝐲 𝐦𝐨𝐧𝐞𝐲 𝐢𝐧 𝐲𝐨𝐮𝐫 𝐛𝐚𝐧𝐤 𝐚𝐜𝐜𝐨𝐮𝐧𝐭 𝐭𝐨 𝐞𝐚𝐫𝐧 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭");
  }

  if (bankData.bank >= maxBankLimit) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐭𝐡𝐞 𝐦𝐚𝐱𝐢𝐦𝐮𝐦 𝐛𝐚𝐧𝐤 𝐥𝐢𝐦𝐢𝐭 𝐨𝐟 $20𝐦. 𝐍𝐨 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐜𝐚𝐧 𝐛𝐞 𝐞𝐚𝐫𝐧𝐞𝐝.");
  }

  const interestEarned = Math.floor(bankData.bank * interestRate);

  await bankCollection.updateOne(
    { userId }, 
    { 
      $set: { lastInterestClaimed: currentTime }, 
      $inc: { bank: interestEarned } 
    }
  );

  return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐞𝐚𝐫𝐧𝐞𝐝 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭 𝐨𝐟 $" + formatMoney(interestEarned));
}
  
if (command === "loan") {
  const maxLoanAmount = 100000;
  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐥𝐨𝐚𝐧 𝐚𝐦𝐨𝐮𝐧𝐭");
  }

  if (amount > maxLoanAmount) {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐓𝐡𝐞 𝐦𝐚𝐱𝐢𝐦𝐮𝐦 𝐥𝐨𝐚𝐧 𝐚𝐦𝐨𝐮𝐧𝐭 𝐢𝐬 $${formatMoney(maxLoanAmount)}.`);
  }

  const bankData = await bankCollection.findOne({ userId });
  
  if (!bankData) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐍𝐨 𝐛𝐚𝐧𝐤 𝐝𝐚𝐭𝐚 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫 𝐭𝐡𝐢𝐬 𝐮𝐬𝐞𝐫. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.");
  }

  const userLoan = bankData.loan || 0;
  const loanPayed = bankData.loanPayed !== undefined ? bankData.loanPayed : true;

  if (!loanPayed && userLoan > 0) {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐭𝐚𝐤𝐞 𝐚 𝐧𝐞𝐰 𝐥𝐨𝐚𝐧 𝐮𝐧𝐭𝐢𝐥 𝐲𝐨𝐮 𝐩𝐚𝐲 𝐨𝐟𝐟 𝐲𝐨𝐮𝐫 𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐥𝐨𝐚𝐧.\n\n𝐘𝐨𝐮𝐫 𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐥𝐨𝐚𝐧 𝐭𝐨 𝐩𝐚𝐲: $${formatMoney(userLoan)}.`);
  }

  const newLoanBalance = userLoan + amount;
  await bankCollection.updateOne(
    { userId },
    { 
      $set: { loan: newLoanBalance, loanPayed: false },
      $inc: { bank: amount }
    }
  );

  return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐭𝐚𝐤𝐞𝐧 𝐚 𝐥𝐨𝐚𝐧 𝐨𝐟 $${formatMoney(amount)}. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐧𝐨𝐭𝐞 𝐭𝐡𝐚𝐭 𝐥𝐨𝐚𝐧𝐬 𝐦𝐮𝐬𝐭 𝐛𝐞 𝐫𝐞𝐩𝐚𝐢𝐝 𝐰𝐢𝐭𝐡𝐢𝐧 𝐚 𝐜𝐞𝐫𝐭𝐚𝐢𝐧 𝐩𝐞𝐫𝐢𝐨𝐝.`);
}
	    
if (command === "payloan") {
  const amount = parseInt(args[1]);
  const bankData = await bankCollection.findOne({ userId });

  if (!bankData) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐍𝐨 𝐛𝐚𝐧𝐤 𝐝𝐚𝐭𝐚 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫 𝐭𝐡𝐢𝐬 𝐮𝐬𝐞𝐫. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.");
  }

  const loanBalance = bankData.loan || 0;

  if (isNaN(amount) || amount <= 0) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭 𝐭𝐨 𝐫𝐞𝐩𝐚𝐲 𝐲𝐨𝐮𝐫 𝐥𝐨𝐚𝐧");
  }

  if (loanBalance <= 0) {
    return message.reply("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐚𝐧𝐲 𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐥𝐨𝐚𝐧 𝐩𝐚𝐲𝐦𝐞𝐧𝐭𝐬");
  }

  if (amount > loanBalance) {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐓𝐡𝐞 𝐚𝐦𝐨𝐮𝐧𝐭 𝐫𝐞𝐪𝐮𝐢𝐫𝐞𝐝 𝐭𝐨 𝐩𝐚𝐲 𝐨𝐟𝐟 𝐭𝐡𝐞 𝐥𝐨𝐚𝐧 𝐢𝐬 𝐠𝐫𝐞𝐚𝐭𝐞𝐫 𝐭𝐡𝐚𝐧 𝐲𝐨𝐮𝐫 𝐝𝐮𝐞 𝐚𝐦𝐨𝐮𝐧𝐭. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐚𝐲 𝐭𝐡𝐞 𝐞𝐱𝐚𝐜𝐭 𝐚𝐦𝐨𝐮𝐧𝐭\n𝐘𝐨𝐮𝐫 𝐭𝐨𝐭𝐚𝐥 𝐥𝐨𝐚𝐧: $${loanBalance}.`);
  }

  const userMoney = await usersData.get(event.senderID, "money");

  if (amount > userMoney) {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐝𝐨 𝐧𝐨𝐭 𝐡𝐚𝐯𝐞 $${amount} 𝐢𝐧 𝐲𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐭𝐨 𝐫𝐞𝐩𝐚𝐲 𝐭𝐨 𝐥𝐨𝐚𝐧`);
  }

  const updatedLoanBalance = loanBalance - amount;
  const loanPayedStatus = updatedLoanBalance === 0;

  await bankCollection.updateOne(
    { userId }, 
    { 
      $set: { loan: updatedLoanBalance, loanPayed: loanPayedStatus },
    }
  );

  await usersData.set(event.senderID, {
    money: userMoney - amount
  });

  if (loanPayedStatus) {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐫𝐞𝐩𝐚𝐲𝐝 𝐲𝐨𝐮𝐫 𝐥𝐨𝐚𝐧 𝐨𝐟 $${amount}. 𝐘𝐨𝐮𝐫 𝐥𝐨𝐚𝐧 𝐢𝐬 𝐧𝐨𝐰 𝐟𝐮𝐥𝐥𝐲 𝐩𝐚𝐢𝐝 𝐨𝐟𝐟.`);
  } else {
    return message.reply(`[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐫𝐞𝐩𝐚𝐲𝐝 $${amount} 𝐭𝐨𝐰𝐚𝐫𝐝𝐬 𝐲𝐨𝐮𝐫 𝐥𝐨𝐚𝐧. 𝐘𝐨𝐮𝐫 𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐥𝐨𝐚𝐧 𝐭𝐨 𝐩𝐚𝐲: $${updatedLoanBalance}.`);
  }
}
	    
const toBoldUnicode = (text) => {
  const boldAlphabet = {
    "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
    "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
    "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳", "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃",
    "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍",
    "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗",
    "Y": "𝐘", "Z": "𝐙", " ": " ", "'": "'", ",": ",", ".": ".", "-": "-", "!": "!", "?": "?"
  };
  return text.split('').map(char => boldAlphabet[char] || char).join('');
};

if (command === "transfer") {
  let recipientID;
  let transferAmount;

  try {
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      recipientID = Object.keys(event.mentions)[0];
    } else if (event.messageReply && event.messageReply.senderID) {
      recipientID = event.messageReply.senderID;
    } else {
      recipientID = args[0];
    }

    if (!recipientID || isNaN(parseInt(recipientID))) {
      return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐩𝐞𝐜𝐢𝐟𝐲 𝐭𝐡𝐞 𝐫𝐞𝐜𝐢𝐩𝐢𝐞𝐧𝐭."));
    }

    transferAmount = parseInt(args[args.length - 1]);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭."));
    }

    if (parseInt(recipientID) === userId) {
      return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐜𝐚𝐧𝐧𝐨𝐭 𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐦𝐨𝐧𝐞𝐲 𝐭𝐨 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟."));
    }

    let recipientBankData = await bankCollection.findOne({ userId: parseInt(recipientID) });
    if (!recipientBankData) {
      await bankCollection.insertOne({ userId: parseInt(recipientID), bank: 0, lastInterestClaimed: Date.now() });
      recipientBankData = { userId: parseInt(recipientID), bank: 0 };
    }

    const bankBalance = await bankCollection.findOne({ userId });
    if (transferAmount > bankBalance.bank) {
      return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐞𝐧𝐨𝐮𝐠𝐡 𝐟𝐮𝐧𝐝𝐬."));
    }

    await bankCollection.updateOne({ userId }, { $inc: { bank: -transferAmount } });
    await bankCollection.updateOne({ userId: parseInt(recipientID) }, { $inc: { bank: transferAmount } });

    const recipientInfo = await api.getUserInfo(recipientID).catch(err => {
      console.error("Error fetching recipient info:", err);
      return {}; 
    });
    const recipientName = recipientInfo[recipientID]?.name || "Unknown User";

    return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫𝐫𝐞𝐝 $" + formatMoney(transferAmount) + " 𝐭𝐨 " + recipientName + "."));
  } catch (error) {
    console.error("Error during transfer:", error);
    return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐡𝐚𝐧𝐝𝐥𝐢𝐧𝐠 𝐭𝐡𝐞 𝐭𝐫𝐚𝐧𝐬𝐟𝐞𝐫."));
  }
}

if (command === "top") {
  try {
    // Fetch top users sorted by bank balance
    const topUsers = await bankCollection.find({}).sort({ bank: -1 }).limit(20).toArray();

    if (!topUsers || topUsers.length === 0) {
      return message.reply(toBoldUnicode("【🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦】\n\n❌ 𝐍𝐨 𝐝𝐚𝐭𝐚 𝐟𝐨𝐮𝐧𝐝."));
    }

    let replyText = toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n𝐓𝐨𝐩 20 𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬:\n");

    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const userId = user?.userId;

      if (!userId) continue;

      let userName = "Unknown";
      try {
        userName = await usersData.getName(userId) || "Unknown";
      } catch (err) {
        console.error(`Error fetching name for user ${userId}:`, err);
      }

      let bankBalance = user.bank ?? 0;
      const symbol = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `[${i + 1}.]`;

      replyText += `${symbol} ${toBoldUnicode(userName)}: ${toBoldUnicode(formatMoney(bankBalance))}\n`;
    }

    return message.reply(replyText.trim());

  } catch (err) {
    console.error("Full error from top command:", err);
    return message.reply(toBoldUnicode("❌ 𝐀𝐧 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝 𝐰𝐡𝐢𝐥𝐞 𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐭𝐡𝐞 𝐭𝐨𝐩 𝐮𝐬𝐞𝐫𝐬."));
  }
}
// Default response if an invalid command is given
return message.reply(toBoldUnicode(`╭─[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]
│‣ 𝐁𝐚𝐥𝐚𝐧𝐜𝐞
│‣ 𝐃𝐞𝐩𝐨𝐬𝐢𝐭
│‣ 𝐖𝐢𝐭𝐡𝐝𝐫𝐚𝐰
│‣ 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭
│‣ 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫
│‣ 𝐓𝐨𝐏
│‣ 𝐋𝐨𝐚𝐧
│‣ 𝐏𝐚𝐲𝐋𝐨𝐚𝐧
╰────────────⭓`));
} catch (error) {
  console.error("Error during MongoDB operation:", error);
  return message.reply(toBoldUnicode("[🏦 𝐇𝐈𝐍𝐀𝐓𝐀 𝐁𝐀𝐍𝐊 🏦]\n\n❌ | An error occurred while processing your request. Please try again later."));
} finally {
  await client.close();
}
  },
};

// Helper function to format large numbers with units
function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;

  // Cap the unit at a maximum safe unit index for huge numbers
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }

  // Format large numbers with 1 or 2 decimal places
  if (num >= 1000) {
    return Number(num.toFixed(1)) + units[unit]; // Shows 1 decimal place
  } else {
    return Number(num.toFixed(1)) + units[unit]; // Shows 1 decimal place for smaller numbers too
  }

					}
