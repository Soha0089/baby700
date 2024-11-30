const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");
/*Do not change
        the credit 🙂👍🏻*/
 
module.exports = {
  config: {
    name: "pin",
    aliases: ["pinterest", "pin"],
    version: "1.0",
    author: "Mah MUD",
    role: 0,
    countDown: 20,
    longDescription: {
      en: "Get Image From Pinterest",
    },
    category: "media",
    guide: {
      en: "{pn} <search query> <number of images>\nExample: {pn} Hacker -50"
    },
    langs: {
      "en": {
          "missing": '{pn} anime girl - 50'
      }
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
    const keySearch = args.join(" ");
  const { spotify, pintarest } = require('nayan-server')
    if(keySearch.includes("-") == false) 
      return message.reply("𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝘁𝗵𝗲 𝘀𝗲𝗮𝗿𝗰𝗵 𝗾𝘂𝗲𝗿𝘆 𝗮𝗻𝗱 - 𝗻𝘂𝗺𝗯𝗲𝗿 𝗼𝗳 𝗶𝗺𝗮𝗴𝗲𝘀 (1-10)", event.threadID, event.messageID)
    const keySearchs = keySearch.substr(0, keySearch.indexOf('-'))
    const numberSearch = keySearch.split("-").pop() || 6
    const res = await pintarest(`${encodeURIComponent(keySearchs)}`);
  console.log(res)
    const data = res.data;
    var num = 0;
    var imgData = [];
    for (var i = 0; i < parseInt(numberSearch); i++) {
      let path = __dirname + `/cache/${num+=1}.jpg`;
      let getDown = (await axios.get(`${data[i]}`, { responseType: 'arraybuffer' })).data;
      fs.writeFileSync(path, Buffer.from(getDown, 'utf-8'));
      imgData.push(fs.createReadStream(__dirname + `/cache/${num}.jpg`));
    }
    message.reply({
        attachment: imgData,
        body: numberSearch + ' images for '+ keySearchs
    }, event.threadID, event.messageID)
    for (let ii = 1; ii < parseInt(numberSearch); ii++) {
        fs.unlinkSync(__dirname + `/cache/${ii}.jpg`)
    };
      } catch (error) {
      console.error(error);
      return api.sendMessage(
        `An error occurred.`,
        event.threadID,
        event.messageID
      );
}
}
}
