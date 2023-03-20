// author = shokkunn

import { AuditLogEvent, AuditLogOptionsType, GuildAuditLogs, GuildAuditLogsEntry, GuildAuditLogsFetchOptions, GuildAuditLogsResolvable, Message } from "discord.js";
import AmadeusClient from "../abstracts/head";
import Script from "../abstracts/scripts";
import winston from "winston";
import OpenAPI from "../utils/routes";
import messageCreateListener from "../listeners/onMessage";

export default class AuditLog extends Script {
    constructor() {
        super("audit_log", "audit_log <Event_Integer> [Limit], example: \'audit_log 22 10\'");
    }

    async checks(client: AmadeusClient, message: Message): Promise<boolean> {
        if (!message.member.permissions.has("BanMembers")) return false;
        return true;
    }

    async execute(client: AmadeusClient, message: Message, ...args: any[]): Promise<any> {
        if (!parseInt(args[0][0])) return winston.log("error", "No event provided, check the json response.");
        let limit = parseInt(args[0][1]) || 10;
        if (limit > 20) limit = 20;
        const logs = await message.guild.fetchAuditLogs({ limit: limit, type: parseInt(args[0][0]) as any});
        let convo = await messageCreateListener.getConversation(message.channel.id);
        convo.push({
            "content": this.truncateLogs(logs).join(", "),
            "role": "user",
            "name": "Audit_Log"
        });
        messageCreateListener.setAwaitingResponse(message.channel.id, true)
        messageCreateListener.setConversation(message.channel.id, convo)
        const response = await OpenAPI.getCompletion(convo);
        return await messageCreateListener.handleResponse(message.channel.id, client, message, response);
    }

    truncateLogs(log: GuildAuditLogs<any>) {
        const entries = log.entries;
        const truncated: string[] = [];
        for (let [id, log] of entries) 
            truncated.push(`Type: ${AuditLogEvent[log.action]} ` + 
            `| Target: ${log.target.tag} | Reason: ${log.reason} ` + 
            `| Executor: ${log.executor.tag} | Timestamp: ${log.createdTimestamp}`);

        if (truncated.length <= 0) return ["No logs found (stop loop)"];
        return truncated;
    }
}