const { getPrefix } = global.utils;
const { commands } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "1.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Shows the list of available commands."
    },
    longDescription: {
      en: "Displays a categorized list of commands and their usage."
    },
    category: "info",
    guide: {
      en: "{p}help [command_name]"
    }
  },

  onStart: async function ({ message, event }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);

    const helpText = `╭─────⭓ 𝐈𝐌𝐀𝐆𝐄 
│✧animex
│✧art ✧write
│✧catsay ✧copuledp
│✧memberlist ✧messi
│✧moonwall ✧neymar
│✧ramos ✧cdp2
╰────────────⭓

╭─────⭓ 𝐀𝐈
│✧ai ✧jan
│✧bby ✧hinata
│✧gemini
│✧gpt ✧gpt4
│✧janvi 
│✧baby ✧moji
│✧simma
╰────────────⭓

╭─────⭓ 𝐆𝐄𝐍𝐄𝐑𝐀𝐋
│✧advice ✧callad
│✧cs3 ✧math
│✧prefix ✧spy
│✧supportgc ✧table
│✧uid ✧upt
╰────────────⭓

╭─────⭓ 𝐈𝐌𝐀𝐆𝐄 𝐆𝐄𝐍
│✧anigen ✧art
│✧anim ✧dalle
│✧fluxpro ✧gen
│✧nijix ✧hinata
│✧sdxl ✧xl ✧flux
│✧dalle3 ✧fulxultra
╰────────────⭓

╭─────⭓ 𝐆𝐀𝐌𝐄
│✧animequiz ✧animequiz2
│✧guess ✧daily
│✧fight ✧flag
│✧football ✧footballquiz2
│✧ffquiz ✧ffquiz2
│✧quiz ✧randomnumber
│✧sicbo ✧slot
│✧ttt ✧tttv2
│✧wordgame ✧cartoon
│✧ffqz ✧dice
╰────────────⭓

╭─────⭓ 𝐀𝐃𝐌𝐈𝐍
│✧accept ✧admin
│✧banlist ✧file
│✧offbot ✧owner
│✧respect ✧set2
│✧vip ✧whitelists
╰────────────⭓

╭─────⭓ 𝐁𝐎𝐗 𝐂𝐇𝐀𝐓
│✧adduser ✧all
│✧autosetname ✧badwords
│✧count ✧filteruser
│✧group ✧kick
│✧promote ✧r
│✧request ✧rules
│✧setname ✧spamkick
│✧warn ✧unsend
╰────────────⭓

╭─────⭓ 𝐎𝐖𝐍𝐄𝐑
│✧admingc ✧cmd
│✧eval ✧set ✧shell
╰────────────⭓

╭─────⭓ 𝐅𝐔𝐍𝐍𝐘
│✧ads ✧affect
│✧buttslap ✧buttslap2
│ ✧condom ✧meme
│✧dig ✧emojigif
│✧fact1 ✧fakechat
│✧gay ✧gayfinder
│✧insult ✧jail
│✧pickupline ✧pornhub
│✧poutine ✧propose
│✧roast ✧slap
│✧spiderman ✧stonk
│✧toilet ✧toilet2
│✧trash ✧trigger
│✧wanted ✧emojimix
╰────────────⭓

╭─────⭓ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘
│✧age ✧appstore
│✧color ✧countryinfo
│✧getlink ✧gitadd
│✧hubble ✧linkfb
│✧numinfo ✧ocr
│✧quote2 ✧requestmain
│✧textinfo ✧translate
│✧weather ✧namaz
│✧time
╰────────────⭓

╭─────⭓ 𝐌𝐄𝐃𝐈𝐀
│✧album ✧alldl
│✧download ✧emojis
│✧fbcover ✧fbdl
│✧freefire ✧imgur
│✧lyric ✧pin
│✧random ✧reels
│✧say ✧stalk
│✧tik ✧tiktok
│✧video2audio ✧ytb
│✧ffvideo ✧catvideo
╰────────────⭓

╭─────⭓ 𝐀𝐍𝐈𝐌𝐄
│✧aniavatar ✧anime
│✧anix ✧bankai
│✧goku ✧hentaiwatch
│✧naruto ✧onepiece
│✧anivid
╰────────────⭓

╭─────⭓ 𝐄𝐂𝐎𝐍𝐎𝐌𝐘
│✧balance ✧bank
│✧send ✧top
╰────────────⭓

╭─────⭓ 𝐋𝐎𝐕𝐄
│✧bestie ✧bestu
│✧brother ✧girlfriend
│✧hug4 ✧kissbf
│✧married ✧marry
│✧mybf ✧mygf
│✧pair2 ✧pair3
│✧propose2 ✧sister
│✧wish
╰────────────⭓

╭─────⭓ 𝐑𝐀𝐍𝐊
│✧customrankcard ✧rank
│✧rankup ✧setrankup 
│✧myrank ✧topexp 
│✧ranktop
╰────────────⭓

╭─────⭓ 𝐓𝐎𝐎𝐋𝐒
│✧blur ✧morse
│✧4k ✧tempmail
╰────────────⭓

╭─────⭓ 𝐌𝐔𝐒𝐈𝐂
│✧lyrics ✧playlist
│✧sing2 ✧song ✧spotify
│✧video ✧ytmusic ✧sing
╰────────────⭓

╭─────⭓ 𝐅𝐎𝐑𝐊 
│✧fork 
│✧fork2
╰────────────⭓

╭─────⭓ 𝐂𝐔𝐒𝐓𝐎𝐌 
│✧setalias ✧setlang
│✧setrole ✧setwelcome
╰────────────⭓

╭─ [ YOUR HINATA BABY ]
╰‣ Admin: 𝐌𝐚𝐡 𝐌𝐔𝐃 🎀
╰‣ Total commands: 380
╰‣ 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 
╰‣ m.me/mahmud.x07

⭔Type !help <command> to learn usage.
⭔Type !support to join our bot support group`;

    await message.reply(helpText);
  }
};
