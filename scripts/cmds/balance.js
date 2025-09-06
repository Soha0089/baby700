module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "1.3",
        author: "NTKhang + MahMUD",
        countDown: 5,
        role: 0,
        description: {
            vi: "xem số tiền hiện có của bạn hoặc người được tag",
            en: "view your money or the money of the tagged person"
        },
        category: "economy",
        guide: {
            vi: "   {pn}: xem số tiền của bạn"
                + "\n   {pn} <@tag>: xem số tiền của người được tag",
            en: "   {pn}: view your money"
                + "\n   {pn} <@tag>: view the money of the tagged person"
        }
    },

    langs: {
        vi: {
            money: "Bạn đang có %1$",
            moneyOf: "%1 đang có %2$"
        },
        en: {
            money: ">🎀\n𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: %1$",
            moneyOf: ">🎀\n%1 𝐡𝐚𝐬 %2$"
        }
    },

    // Format big numbers with units
    formatMoney(num) {
        const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃",
            "𝐔𝐧𝐝𝐞𝐜", "𝐃𝐮𝐨𝐝𝐞𝐜", "𝐓𝐫𝐞𝐝𝐞𝐜", "𝐐𝐮𝐚𝐭𝐭𝐮𝐨𝐫𝐝𝐞𝐜", "𝐐𝐮𝐢𝐧𝐝𝐞𝐜",
            "𝐒𝐞𝐱𝐝𝐞𝐜", "𝐒𝐞𝐩𝐭𝐞𝐧𝐝𝐞𝐜", "𝐎𝐜𝐭𝐨𝐝𝐞𝐜", "𝐍𝐨𝐯𝐞𝐦𝐝𝐞𝐜", "𝐕𝐢𝐠",
            "𝐔𝐧𝐯𝐢𝐠", "𝐃𝐮𝐨𝐯𝐢𝐠", "𝐓𝐫𝐞𝐬𝐯𝐢𝐠", "𝐐𝐮𝐚𝐭𝐭𝐮𝐨𝐫𝐯𝐢𝐠", "𝐐𝐮𝐢𝐧𝐯𝐢𝐠",
            "𝐒𝐞𝐬𝐯𝐢𝐠", "𝐒𝐞𝐩𝐭𝐞𝐦𝐯𝐢𝐠", "𝐎𝐜𝐭𝐨𝐯𝐢𝐠", "𝐍𝐨𝐯𝐞𝐦𝐯𝐢𝐠", "𝐓𝐫𝐢𝐠",
            "𝐔𝐧𝐭𝐫𝐢𝐠", "𝐃𝐮𝐨𝐭𝐫𝐢𝐠", "𝐆𝐨𝐨𝐠𝐨𝐥"
        ];
        let unit = 0;
        while (num >= 1000 && ++unit < units.length) num /= 1000;
        const formatted = num.toFixed(1).replace(/\.0$/, "") + units[unit];
        return toBoldNumbers(formatted);
    },

    onStart: async function ({ message, usersData, event, getLang }) {
        // Reply to another user's balance
        if (event.type == "message_reply") {
            const reply = event.messageReply;
            const userID = reply.senderID;
            const userMoney = await usersData.get(userID, "money");
            const userName = reply.senderName || await usersData.get(userID, "name") || "Unknown User";
            return message.reply(getLang("moneyOf", toBoldUnicode(userName), this.formatMoney(userMoney)));
        }

        // Mentioned users
        if (Object.keys(event.mentions).length > 0) {
            const uids = Object.keys(event.mentions);
            let msg = "";
            for (const uid of uids) {
                const userMoney = await usersData.get(uid, "money");
                const userName = event.mentions[uid].replace("@", "");
                msg += getLang("moneyOf", toBoldUnicode(userName), this.formatMoney(userMoney)) + '\n';
            }
            return message.reply(msg);
        }

        // Sender's own balance
        const userData = await usersData.get(event.senderID);
        const userName = event.senderName || await usersData.get(event.senderID, "name") || "Unknown User";
        return message.reply(getLang("money", this.formatMoney(userData.money)));
    }
};

// Convert to bold numbers
function toBoldNumbers(number) {
    const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
    return number.toString().split('').map(c => bold[c] || c).join('');
}

// Convert text to bold
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
