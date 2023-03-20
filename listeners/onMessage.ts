// author = shokkunn

import { Message } from "discord.js";
import AmadeusListener from "../abstracts/listeners";
import AmadeusClient from "../abstracts/head";
import Cache from "../utils/cache";
import config from "../config.json";
import { ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
import OpenAPI from "../utils/routes";
import winston from "winston";
import { encode } from "gpt-3-encoder";
import Script from "../abstracts/scripts";

export default class messageCreateListener extends AmadeusListener {
    static markdownRegex = /(?!<.*?>)([\*_~`]|(?<!\\))+/g

    constructor() {
        super("messageCreate", false);
    }

    static async getConversation(channelId: string) {
        const conversation = await Cache.bucket.get("channel_" + channelId) as ChatCompletionRequestMessage[]
        return conversation;
    }

    static setConversation(channelId: string, conversation: ChatCompletionRequestMessage[]) {
        Cache.bucket.set("channel_" + channelId, conversation);
        return conversation;
    }
    
    static isAwaitingResponse(channelId: string) {
        return Cache.bucket.get("awaiting_response_" + channelId);
    }

    static setAwaitingResponse(channelId: string, value: boolean) {
        if (value) Cache.bucket.set("awaiting_response_" + channelId, true);
        else Cache.bucket.del("awaiting_response_" + channelId);
    }
    

    async execute(client: AmadeusClient, message: Message): Promise<any> {
        if (message.content.startsWith("//")) return;
        if (message.content.startsWith("force_convo")) {
            // remove force_convo
            message.content = message.content.replace("force_convo", "");
            return this.handleMessage(client, message);
        }
        if (message.content.includes("stop_convo")) {
            Cache.bucket.del("awaiting_response_" + message.channel.id)
            Cache.bucket.del("channel_" + message.channel.id);
            return message.reply("SYSTEM: Conversation stopped.");
        }
        console.log(message.content)
        if (message.author.bot) return;
        const channel = message.channel;
        //if (messageCreateListener.isAwaitingResponse(channel.id)) return;
        if ((await messageCreateListener.getConversation(channel.id)
            || message.content.toLowerCase().includes(config.initialization.wake_word.toLowerCase()))) return this.handleMessage(client, message);
    }

    formatUserMessage(message: Message) {
        return `${message.author.username}: ${message.content}`;
    }

    formatSystemMessage(str: string) {
        return `SYSTEM: ${str}`;
    }

    checkForConversationLimits(message: Message, conversation: ChatCompletionRequestMessage[]) {
        const tokens = encode(conversation.map((msg) => msg.content).join(" ")).length;
        if (conversation.length > config.limits.max_convo_length, tokens > config.limits.max_convo_token_limit) {
            // remove a single message that is not system messages, preferibly the oldest
            const index = conversation.findIndex((msg) => msg.role !== "system");
            if (index !== -1) conversation.splice(index, 1);
            winston.log("warn", "Conversation is too long, deleting a message.");
        }
    }

    checkForMessageLimits(message: Message) {
        const tokens = encode(message.content).length;
        if (tokens > config.limits.max_message_token_limit) {
            message.reply("Your message is too long!");
            winston.log("warn", "Message is too long, deleting message.")
            return false;
        } 
        return true;
    }

    async handleMessage(client: AmadeusClient, message: Message) {
        let conversation = await messageCreateListener.getConversation(message.channel.id);
        if (!this.checkForMessageLimits(message)) return;

        // start typing
        await message.channel.sendTyping()

        if (!conversation) {
            
            conversation = messageCreateListener.setConversation(message.channel.id, [{
                // the allowed script programmatic_command
                content: this.formatSystemMessage(AmadeusClient.scriptPrompt + " " + "Discord AuditLog Int ID ex: 20 for MemberKick"),
                role: "system",
                name: "System"
            },
            {
                "content": this.formatUserMessage(message),
                "role": "user",
                "name": message.author.id
            }])
        } else {
            // delete a message if the conversation is too long
            this.checkForConversationLimits(message, conversation);
            // add the message to the conversation
            conversation.push({
                "content": this.formatUserMessage(message),
                "role": "user",
                "name": message.author.id
            })
            messageCreateListener.setConversation(message.channel.id, conversation);
        }
        
        // set the awaiting response to true
        //messageCreateListener.setAwaitingResponse(message.channel.id, true);
        // send the message to openai
        const response = await OpenAPI.getCompletion(conversation);
        console.log(response.choices[0].message.content)
        return messageCreateListener.handleResponse(message.channel.id, client, message, response);
    }

    static async handleProgrammaticCommand(client: AmadeusClient, message: Message, response: {
        response: string,
        programmatic_command: string[]
    }) {
        const { response: responseMsg, programmatic_command: scripts } = response;
        if (!scripts || scripts?.length <= 0) return;
        // run the scripts
        for (const script of scripts) {
            try {
                let args = Script.parseArgs(script)
                const command = args.shift();
                const scriptInstance = client.scripts.get(command);
                if (!scriptInstance) continue;
                if (scriptInstance.checks(client, message)) await scriptInstance.execute(client, message, args);
                else { throw Error("Failed check user: " + message.author + " script: " + command);}
            } catch (e) {
                winston.error(e);
            }
        }
    }

    static async handleResponse(channelId: string, client: AmadeusClient, message: Message, response: CreateChatCompletionResponse) {
        const conversation = await messageCreateListener.getConversation(channelId),
        responseMsg = response.choices[0].message
        // response should look like this:
        /*
        {
            "content": "{
                \"response\": \"I have successfully kicked shokkunn#0001 for being a bad person.\",
                \"action\": [
                    "kick\ shokkunn#0001\ for\ being\ a\ bad\ person\",
                    "ban shokkunn#0001 for being a bad person"
                ]
            }",
            "role": "assistant",
        }
        */
        // remove markdown.
        console.log(responseMsg.content)
        try {
            const ret: {
                response: string,
                programmatic_command: string[]
            } = JSON.parse(responseMsg.content);

            // add the response to the conversation
            conversation.push(responseMsg);

            // set the conversation
            messageCreateListener.setConversation(channelId, conversation);

            // action scripts
            await messageCreateListener.handleProgrammaticCommand(client, message, ret);

            // set the awaiting response to false
            messageCreateListener.setAwaitingResponse(channelId, false);

            // send the response
            return message.channel.send(ret.response.replace(messageCreateListener.markdownRegex, ""));
        } catch (e) {
            winston.error(e);
            return message.channel.send("Something went wrong, please try again later.");
        }
    }

}