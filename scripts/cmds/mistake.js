const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
  config: {
    name: "mistake",
    aliases: ["cm"],
    version: "2.0",
    author: "Mah MUD",
    countDown: 2,
    role: 2,
    description: "𝗔 𝘀𝗺𝗮𝗹𝗹 𝗺𝗶𝘀𝘁𝗮𝗸𝗲", 
    category: "fun",
    guide: "{pn} (mention someone/uid/idurl/reply to a msg)"
  },

  onStart: async function ({ message, event, args }) {
    const mention = Object.keys(event.mentions);
    let uid;

    if (mention.length === 1) {
      uid = mention[0]; // User mentioned
    } else if (args[0] && args[0].match(regExCheckURL)) {
      // Check for URL and find UID
      try {
        uid = await findUid(args[0]);
      } catch (e) {
        console.log(e.message);
        return message.reply("Invalid URL or UID.");
      }
    } else if (args[0]) {
      // Get UID from args
      uid = args[0];
    } else if (event.messageReply) {
      // If replied, check if it's an image
      const repliedMessage = event.messageReply;
      if (repliedMessage.attachments && repliedMessage.attachments.length > 0) {
        const imageUrl = repliedMessage.attachments[0].url;
        // Create image from the replied image instead of user's avatar
        const imagePath = await createImageFromRepliedImage(imageUrl);
        await message.reply({
          body: "The Biggest Mistake on Earth",
          attachment: fs.createReadStream(imagePath)
        });
        return; // Exit to avoid further processing
      } else {
        uid = repliedMessage.senderID; // Use UID of the user who sent the reply
      }
    }

    if (!uid) {
      return message.reply("Please provide a valid user mention, UID, or reply to a message.");
    }

    try {
      const imagePath = await createMistakeImage(uid);
      await message.reply({
        body: "The Biggest Mistake on Earth",
        attachment: fs.createReadStream(imagePath)
      });
    } catch (error) {
      console.error("Error while running command:", error);
      await message.reply("An error occurred while generating the image.");
    }
  }
};

// Function to create the composite image from a user's avatar
async function createMistakeImage(uid) {
  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const avatar = await jimp.read(avatarURL);
  const image = await jimp.read("https://i.postimg.cc/2ST7x1Dw/received-6010166635719509.jpg");

  image.resize(512, 512).composite(avatar.resize(220, 203), 145, 305); // Composite the images
  const imagePath = path.join(__dirname, 'tmp', `${uid}.png`);
  await image.writeAsync(imagePath); // Write the image to disk
  return imagePath; // Return the image path for sending
}

// Function to create the composite image from a replied image
async function createImageFromRepliedImage(imageUrl) {
  const repliedImage = await jimp.read(imageUrl);
  const overlayImage = await jimp.read("https://i.postimg.cc/2ST7x1Dw/received-6010166635719509.jpg");

  overlayImage.resize(512, 512).composite(repliedImage.resize(220, 203), 145, 305); // Composite the images
  const imagePath = path.join(__dirname, 'tmp', `replied_image.png`);
  await overlayImage.writeAsync(imagePath); // Write the image to disk
  return imagePath; // Return the image path for sending
}
