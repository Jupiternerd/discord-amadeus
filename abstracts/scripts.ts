// author = shokkunn

import { Message } from "discord.js";
import AmadeusClient from "./head";

export default abstract class Script {
    // vars
    public name: string;
    public modelGuide: string;

    constructor(name: string, modelGuide: string) {
        this.name = name;
        this.modelGuide = modelGuide;
    }

    static defaultCheck(client: AmadeusClient, message: Message): boolean {
        if (message.author.bot) return false;
        if (!message.guild) return false;
    }

    static parseArgs(str: string): string[] {
        return str.split(" ");
    }

    abstract checks(client: AmadeusClient, message: Message): Promise<boolean>;

    abstract execute(client: AmadeusClient, message: Message, ...args: any): Promise<any>;
}