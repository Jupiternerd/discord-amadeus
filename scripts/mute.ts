// author = shokkunn

import { Message } from "discord.js";
import AmadeusClient from "../abstracts/head";
import Script from "../abstracts/scripts";
import winston from "winston";

export default class Mute extends Script {
    constructor() {
        super("mute", "mute <user> <time_in_seconds> [reason]");
    }

    async checks(client: AmadeusClient, message: Message): Promise<boolean> {
        if (!message.member.permissions.has("MuteMembers")) return false;
        return true;
    }

    async execute(client: AmadeusClient, message: Message, ...args: any): Promise<any> {
        const user = await message.guild.members.fetch(args[0]);
        if (!user) return winston.log("error", "No user provided, check the json response.")
        const time = parseInt(args[1]) || 120;
        const reason = args.slice(1).join(" ") || "No reason provided";
        await user.timeout(time, reason);
        message.channel.send(`SYSTEM: Muted ${user.user.tag} for ${reason}`)
        winston.log("info", `Muted ${user.user.tag} for ${reason}`);
    }
}