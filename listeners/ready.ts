// author = shokkunn

import AmadeusListener from "../abstracts/listeners";
import AmadeusClient from "../abstracts/head";
import winston from "winston";

export default class readyListener extends AmadeusListener {
    constructor() {
        super("ready", false);
    }

    async execute(client: AmadeusClient): Promise<any> {
        winston.info(`🤖 ${client.user.tag} is ready!`)
    }
}