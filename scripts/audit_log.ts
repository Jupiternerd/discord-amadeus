// author = shokkunn

import { AuditLogEvent, AuditLogOptionsType, GuildAuditLogs, GuildAuditLogsEntry, Message } from "discord.js";
import AmadeusClient from "../abstracts/head";
import Script from "../abstracts/scripts";
import winston from "winston";
import OpenAPI from "../utils/routes";
import messageCreateListener from "../listeners/onMessage";

export default class AuditLog extends Script {
    constructor() {
        super("audit_log", "audit_log <Event> [Limit]");
    }

    async checks(client: AmadeusClient, message: Message): Promise<boolean> {
        if (!message.member.permissions.has("BanMembers")) return false;
        return true;
    }

    async execute(client: AmadeusClient, message: Message, ...args: any[]): Promise<any> {
        console.log(args)
        AuditLogEvent["Guild"]
        const event = AuditLogEvent[args[0] as string];
        if (!event) return winston.log("error", "No event provided, check the json response.");
        let limit = parseInt(args[1]) || 10;
        if (limit > 20) limit = 20;
        const logs = await message.guild.fetchAuditLogs({ limit: limit, type: event});
        let convo = await messageCreateListener.getConversation(message.channel.id);
        convo.push({
            "content": this.truncateLogs(logs).join(", "),
            "role": "system",
            "name": "System"
        });
        messageCreateListener.setAwaitingResponse(message.channel.id, true);
        const response = await OpenAPI.getCompletion(convo);
        return await messageCreateListener.handleResponse(message.channel.id, client, message, response);
    }

    truncateLogs(log: GuildAuditLogs<any>) {
        const entries = log.entries;
        const truncated: string[] = [];
        for (let [id, log] of entries) 
            truncated.push(`Type: ${log.action} ` + 
            `| Target: ${log.target.tag} | Reason: ${log.reason} ` + 
            `| Executor: ${log.executor.tag} | Timestamp: ${log.createdTimestamp}`);

        if (truncated.length <= 0) return ["No logs found"];
        return truncated;
    }
}