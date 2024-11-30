module.exports = {
  config: {
    name: "emi",
    aliases: [],
    version: "6.9.0",
    author: "dipto",
    countDown: 10,
    role: 0,
    shortDescription: "Image Genarator",
    longDescription: "Generate image by Emi",
    category: "Image gen",
    guide: {
      en: "{pn} [prompt]",
    },
  },
  onStart: async function ({ args, event, api }) {
    try {
      const prompt = args.join(" ");
      if (!prompt) {
        return api.sendMessage("Please provide a prompt.");
      }
      const wait = await api.sendMessage("𝗪𝗮𝗶𝘁 𝗸𝗼𝗿𝗼 𝗕𝗮𝗯𝘆 <😘", event.threadID);
      const response = `${
        global.GoatBot.config.api
      }/emi?prompt=${encodeURIComponent(prompt)}`;
      await api.sendMessage(
        {
          body: `✅ | Generated your images`,
          attachment: await global.utils.getStreamFromURL(response),
        },
        event.threadID,
        event.messageID
      );
      await api.unsendMessage(wait.messageID);
    } catch (e) {
      console.error(e);
      await api.sendMessage(
        `Failed to genarate photo!!!!\nError: ${e.message}`,
        event.threadID
      );
    }
  },
};
