// author = shokkunn

import { Message } from "discord.js";
import AmadeusClient from "../abstracts/head";
import Script from "../abstracts/scripts";
import winston from "winston";

export default class Ban extends Script {
    constructor() {
        super("ban", "ban <user> \"[reason]\", example: \"ban usr \'Being Rude\'\"");
    }

    async checks(client: AmadeusClient, message: Message): Promise<boolean> {
        if (!message.member.permissions.has("BanMembers")) return false;
        return true;
    }

    async execute(client: AmadeusClient, message: Message, ...args: any): Promise<any> {
        let users = await message.guild.members.fetch();
        let user = users.find(i => (i.user.username === args[0]) || (i.user.id === args[0]));
        if (!user) return winston.log("error", "No user provided, check the json response.")
        const reason = args.slice(1).join(" ") || "No reason provided";
        await user.ban({ reason: reason });
        message.channel.send(`SYSTEM: Banned ${user.user.tag} for ${reason}`);
        winston.log("info", `Banned ${user.user.tag} for ${reason}`)
    }
}