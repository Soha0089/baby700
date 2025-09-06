module.exports = {
  config: {
    name: "fork",
    aliases: [],
    version: "1.7",
    author: "MahMUD",
    countDown: 0,
    role: 0,
    category: "info",
    guide: {
      en: "{pn} - Get the GitHub fork link."
    }
  },

  onStart: async function ({ message }) {
    const forkLink = "https://github.com/mahmudx7/MahMUD-goatbot-v2";
    return message.reply(`🐤 | Fork this project here:\n\n${forkLink}`);
  }
};
