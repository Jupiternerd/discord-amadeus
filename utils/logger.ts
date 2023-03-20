import Transport from 'winston-transport';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import chalk from 'chalk';

export enum ColorLevels {
    fatal = "#FF2D00", //red
    error = "#FF9200", //orange
    warn = "#F1FF38", //yellow
    info = "#3EBFFF", //blue
    success = "#32FF5B", //green
    debug = "#FF1B7C", //magenta
}

export const Levels = {
    "fatal": 0,
    "error": 1,
    "warn": 2,
    "info": 3,
    "success": 4,
    "debug": 5,
}

export enum TruncLevels {
    fatal = "FATL",
    error = "EROR",
    warn = "WARN",
    info = "INFO",
    success = "SUSS",
    debug = "DEBG",
}

export type LogInfo = {
    message: string,
    level: string,
    timestamp: string,
    [key: string]: any
}

export default class DiscordTransport extends Transport {
    private _webhook: WebhookClient;
    constructor(opts: Transport.TransportStreamOptions, webhook: WebhookClient) {
        super(opts);
        this._webhook = webhook;
    }

    log(info: LogInfo, callback: () => void, webhook: WebhookClient = this._webhook) {
        setImmediate(async () => {
            if (!this._webhook) return;
            callback();
            await this.logToChannel(info, webhook);
        })
    }

    async logToChannel(info: LogInfo, webhook: WebhookClient = this._webhook) {
        try {
            await webhook.send({
                content: Levels[info.level] <= 0 ? "@here" : "",
                embeds: [new EmbedBuilder().setDescription(`[${info?.level.toUpperCase()}] ${info?.message} :: ${info?.timestamp}`).setColor(ColorLevels[info.level]).setTimestamp(new Date(info.timestamp))]
            })
        } catch (e) {
            console.error(e);
            return;
        }
    }
};

export class LogTransport extends Transport {
    constructor(opts: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info: LogInfo, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info);
            console.log(chalk.whiteBright.bold.bgHex(ColorLevels[info.level])(` ${TruncLevels[info.level]} `), info.message, info.timestamp ? chalk.gray.dim(info.timestamp) : '');
            callback();
        })
    }
};
