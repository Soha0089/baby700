const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { MongoClient } = require("mongodb");

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
    name: "edit",
    aliases: ['imgedit'],
    author: "Mahi--",
    version: "1.5",
    cooldowns: 20,
    role: 0,
    shortDescription: "Edit image with text prompt",
    longDescription: "Edits an image using the provided text prompt and image link or replied image",
    category: "image",
    guide: "{p}edit <prompt> (reply to image) or {p}edit <image_url> <prompt>",
  },
  onStart: async function ({ message, args, api, event }) {
    if (!db) {
      return message.reply("❌ | Database connection is not initialized.");
    }

    // VIP check function
    const checkVip = async (uid) => {
      const collection = db.collection("vipUser");
      const user = await collection.findOne({ uid });
      return user && user.expiredAt > new Date();
    };

    const isVip = await checkVip(event.senderID);
    if (!isVip) {
      return message.reply("🥹 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐚𝐫𝐞 𝐧𝐨𝐭 𝐚 𝐕𝐈𝐏 𝐮𝐬𝐞𝐫");
    }
    
    // Obfuscated author name check
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 105, 45, 45);
    if (this.config.author !== obfuscatedAuthor) {
      return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    // Get image URL and prompt
    let imageUrl, prompt;
    
    if (event.messageReply && event.messageReply.attachments.length > 0) {
      // Case: Reply to an image with prompt in arguments
      imageUrl = event.messageReply.attachments[0].url;
      prompt = args.join(" ");
    } else if (args.length >= 2) {
      // Case: Image URL and prompt provided as arguments
      imageUrl = args[0];
      prompt = args.slice(1).join(" ");
    } else {
      return api.sendMessage("❌ | Invalid format. Use:\n• Reply to an image with '{p}edit <prompt>'\n• Or '{p}edit <image_url> <prompt>'", event.threadID);
    }

    if (!prompt) {
      return api.sendMessage("❌ | Please provide a text prompt for the image editing.", event.threadID);
    }

    api.sendMessage("🔄 | Editing your image, please wait...", event.threadID, event.messageID);

    try {
      const editApiUrl = `https://mahi-apis.onrender.com/api/edit?url=${encodeURIComponent(imageUrl)}&txt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(editApiUrl, {
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_edited_image.jpg`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: `✅ | Image edited with prompt: "${prompt}"`,
        attachment: stream
      });
    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred while editing the image. Please try again later.");
    }
  }
};
