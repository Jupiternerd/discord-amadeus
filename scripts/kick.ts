// author = shokkunn

import { Message } from "discord.js";
import AmadeusClient from "../abstracts/head";
import Script from "../abstracts/scripts";
import winston from "winston";

export default class Kick extends Script {
    constructor() {
        super("kick", "kick <user> \"[reason]\", example: \"ban usr \'Being Rude\'\"");
    }

    async checks(client: AmadeusClient, message: Message): Promise<boolean> {
        if (!message.member.permissions.has("KickMembers")) return false;
        return true;
    }

    async execute(client: AmadeusClient, message: Message, ...args: any): Promise<any> {
        let users = await message.guild.members.fetch();
        let user = users.find(i => (i.user.username === args[0]) || (i.user.id === args[0]));
        if (!user) return winston.log("error", "No user provided, check the json response.")
        const reason = args.slice(1).join(" ") as string || "No reason provided";
        await user.kick(reason);
        message.channel.send(`SYSTEM: Kicked ${user.user.tag} for ${reason}`);
        winston.log("info", `Kicked ${user.user.tag} for ${reason}`)
    }
}