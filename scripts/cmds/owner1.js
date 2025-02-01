const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
    config: {
        name: "owner",
        version: "1.5",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        shortDescription: {
            vi: "Thêm, xóa, sửa quyền author",
            en: "Add, remove, edit author role"
        },
        longDescription: {
            vi: "Thêm, xóa, sửa quyền author",
            en: "Add, remove, edit author role"
        },
        category: "admin",
        guide: {
            vi: '   {pn} [add | -a] <uid | @tag>: Thêm quyền author cho người dùng'
                + '\n    {pn} [remove | -r] <uid | @tag>: Xóa quyền author của người dùng'
                + '\n    {pn} [list | -l]: Liệt kê danh sách author',
            en: '   {pn} [add | -a] <uid | @tag>: Add author role for user'
                + '\n    {pn} [remove | -r] <uid | @tag>: Remove author role of user'
                + '\n    {pn} [list | -l]: List all authors'
        }
    },

    langs: {
        vi: {
            added: "✅ | Đã thêm quyền author cho %1 người dùng:\n%2",
            alreadyAdmin: "\n⚠️ | %1 người dùng đã có quyền author từ trước rồi:\n%2",
            missingIdAdd: "⚠️ | Vui lòng nhập ID hoặc tag người dùng muốn thêm quyền author",
            removed: "✅ | Đã xóa quyền author của %1 người dùng:\n%2",
            notAdmin: "⚠️ | %1 người dùng không có quyền author:\n%2",
            missingIdRemove: "⚠️ | Vui lòng nhập ID hoặc tag người dùng muốn xóa quyền author",
            listAdmin: "👑 | Danh sách author:\n%1",
            listOwners: "👑 | Danh sách owner:\n%1"
        },
        en: {
            added: "✅ | Added owner role for %1 users:\n%2",
            alreadyAdmin: "\n⚠️ | %1 users already have owner role:\n%2",
            missingIdAdd: "⚠️ | Please enter ID or tag user to add author role",
            removed: "✅ | Removed owner role of %1 users:\n%2",
            notAdmin: "⚠️ | %1 users don't have owner role:\n%2",
            missingIdRemove: "⚠️ | Please enter ID or tag user to remove author role",
            listAdmin: "👑 | List of author:\n%1",
            listOwners: "👑 | List of owners role\n\n%1"
        }
    },

    onStart: async function ({ message, args, usersData, event, getLang, api }) {
        const permission = global.GoatBot.config.GOD;

        // Check if the sender is in the list of owners (admins)
        const isOwner = permission.includes(event.senderID);

        switch (args[0]) {
            case "add":
            case "-a": {
                // Only owners can add others as owners
                if (isOwner) {
                    if (args[1]) {
                        let uids = [];
                        if (Object.keys(event.mentions).length > 0) {
                            uids = Object.keys(event.mentions);
                        } else if (event.messageReply) {
                            uids.push(event.messageReply.senderID);
                        } else {
                            uids = args.filter(arg => !isNaN(arg));
                        }

                        const notAdminIds = [];
                        const authorIds = [];
                        for (const uid of uids) {
                            if (config.GOD.includes(uid)) {
                                authorIds.push(uid);
                            } else {
                                notAdminIds.push(uid);
                            }
                        }

                        config.GOD.push(...notAdminIds);
                        const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
                        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
                        return message.reply(
                            (notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
                            + (authorIds.length > 0 ? getLang("alreadyAdmin", authorIds.length, authorIds.map(uid => `• ${uid}`).join("\n")) : "")
                        );
                    } else {
                        return message.reply(getLang("missingIdAdd"));
                    }
                } else {
                    // If not an owner, deny permission
                    return message.reply(getLang("notAdmin", 1, event.senderID));
                }
            }
            case "remove":
            case "-r": {
                // Only owners can remove others from the owner list
                if (isOwner) {
                    if (args[1]) {
                        let uids = [];
                        if (Object.keys(event.mentions).length > 0) {
                            uids = Object.keys(event.mentions);
                        } else {
                            uids = args.filter(arg => !isNaN(arg));
                        }

                        const notAdminIds = [];
                        const authorIds = [];
                        for (const uid of uids) {
                            if (config.GOD.includes(uid)) {
                                authorIds.push(uid);
                            } else {
                                notAdminIds.push(uid);
                            }
                        }

                        for (const uid of authorIds) {
                            config.GOD.splice(config.GOD.indexOf(uid), 1);
                        }

                        const getNames = await Promise.all(authorIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
                        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
                        return message.reply(
                            (authorIds.length > 0 ? getLang("removed", authorIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
                            + (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
                        );
                    } else {
                        return message.reply(getLang("missingIdRemove"));
                    }
                } else {
                    // If not an owner, deny permission
                    return message.reply(getLang("notAdmin", 1, event.senderID));
                }
            }
            case "list":
            case "-l": {
                // List of owners is now available for everyone (normal users too)
                const getNames = await Promise.all(config.GOD.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
                return message.reply(getLang("listOwners", getNames.map(({ uid, name }) => `╭‣Name: ${name} 👑\n╰‣Uid: ${uid}\n`).join("\n")));
            }
            default:
                return message.SyntaxError();
        }
    }
};
