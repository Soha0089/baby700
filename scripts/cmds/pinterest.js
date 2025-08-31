const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get(
        `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
    );
    return base.data.api;
};

module.exports = {
    config: {
        name: "pin",
        aliases: ["pinterest"],
        version: "1.7",
        author: "Dipto",
        countDown: 10,
        role: 0,
        category: "Image gen",
        guide: {
            en: "{pn} query - amount\nExample: {pn} goku Ultra - 10",
        },
    },

    onStart: async function ({ api, event, args }) {
        const queryAndLength = args.join(" ").split("-");
        const keySearch = queryAndLength[0]?.trim();
        const count = queryAndLength[1]?.trim();

        if (!keySearch) {
            return api.sendMessage(
                "❌ | Please enter a search query.\nExample: {pn} goku Ultra - 10.",
                event.threadID,
                event.messageID,
            );
        }

        const numberSearch = count ? Math.min(parseInt(count), 20) : 6;

        try {
            const response = await axios.get(
                `${await baseApiUrl()}/pinterest?search=${encodeURIComponent(keySearch)}&limit=${numberSearch}`,
            );
            const data = response.data.data;

            if (!data || data.length === 0) {
                return api.sendMessage(
                    "❌ | No images found for your query.",
                    event.threadID,
                    event.messageID,
                );
            }

            const diptoo = [];

            for (let i = 0; i < numberSearch; i++) {
                const imgUrl = data[i];
                const imgResponse = await axios.get(imgUrl, {
                    responseType: "arraybuffer",
                });
                const imgPath = path.join(__dirname, "dvassests", `${i + 1}.jpg`);
                await fs.outputFile(imgPath, imgResponse.data);
                diptoo.push(fs.createReadStream(imgPath));
            }

            await api.sendMessage(
                {
                    body: `✅ | Here Your Images baby`,
                    attachment: diptoo,
                },
                event.threadID,
                event.messageID,
            );
        } catch (error) {
            console.error(error);
            await api.sendMessage(
                `❌ | Error: ${error.message}`,
                event.threadID,
                event.messageID,
            );
        }
    },
};
