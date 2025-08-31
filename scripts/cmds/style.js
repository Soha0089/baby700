const fs = require("fs");

module.exports.config = {
  name: "style",
  aliases: ["font"],
  version: "1.7",
  role: 2,
  countDowns: 5,
  author: "MahMUD",
 category: "general",
  guide: { en: "[number] [text]" }
};

module.exports.onStart = async function ({ message, args }) {
  if (args[0] === "list") {
    const fontList = `Available Styles:\n
1: Ă̈r̆̈ĭ̈y̆̈ă̈n̆̈
2: 𝘈𝘳𝘪𝘺𝘢𝘯
3: 𝗔𝗿𝗶𝘆𝗮𝗻
4: 🅐🅡🅘🅨🅐🅝
5: ᴬᴿᴵʸᴬᴺ
6: Ａｒｉｙａｎ
7: 𝙰𝚛𝚒𝚢𝚊𝚗
8: 𝔸𝕣𝕚𝕪𝕒𝕟
9: 𝘼𝙧𝙞𝙮𝙖𝙣
10: Ａⅈ𝚛𝘪𝘺օ𝚗
11: 𝐀𝐫𝐢𝐲𝐚𝐧
12: 🄰🅁🄸🅈🄰🄽
13: Ⓐⓡⓘⓨⓐⓝ
14: 𝕬𝖗𝖎𝖞𝖆𝖓
15: ᴀʀɪʏᴀɴ
16: 🅰🆁🅸🆈🅰🅽
17: ᴬᴿᴵʸᴬᴺ
18: A̷r̷i̷y̷a̷n̷
19: ȺᴿɨɎΛN
20: ∂ιяуαη`;

    await message.reply(fontList);
    return;
  }

  const number = args[0];
  const text = args.slice(1).join(" ");

  if (!text || isNaN(number)) {
    return message.reply("Invalid command. Usage: style <number> <text>");
  }

  const fontData = JSON.parse(fs.readFileSync("style.json", "utf-8"));

  if (!fontData[number]) {
    return message.reply("Invalid style number. Use 'style list' to see available styles.");
  }

  const selectedFont = fontData[number];
  const convertedText = text.split("").map(char => selectedFont[char] || char).join("");

  await message.reply(convertedText);
};
