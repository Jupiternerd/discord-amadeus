import { OpenAIApi, Configuration, ChatCompletionRequestMessage, CreateChatCompletionResponse } from "openai";
import winston from "winston";
import * as config from "../config.json";

export default class OpenAPI {
    private static _api: OpenAIApi;
    // If system prompt is not set, use this one.
    public static systemPrompt: string = (config.initialization.personality_prompt.length > 0 ? config.initialization.personality_prompt :
        "Personality: You are a student named \"Yui\". You respond like a Yandere. ") +
        // Required for the bot to work 
        "{} = required [] = optional. Respond ONLY in this JSON format:\n" +
        "{\"response\": \"{required_response_text}\"" +
        "\"actions\": [\"{required_action_type} [action_args]\"]}"

    /**
     * @name login
     * @description Login to OpenAI API
     * @param key API key
     */
    static async login(key: string = process.env.API_KEY) {
        try {
            this._api = new OpenAIApi(new Configuration({
                apiKey: key,
            }));
            winston.info("Logged in to OpenAI API");
        } catch (e) {
            winston.error(e);
        }
    }

    /**
     * @name getCompletion
     * @description Get completion from OpenAI API (default settings are set to 256 tokens, 0.6 temperature, 1 top_p, 0.15 presence_penalty, 0 frequency_penalty)
     * @param api Open API instance
     * @param messages the messages to complete, please be wary of the max length of the message
     * @returns 
     */
    static async getCompletion(messages: ChatCompletionRequestMessage[], 
        api: OpenAIApi = OpenAPI._api, 
        options: {
            model?: string,
            max_tokens?: number, 
            temperature?: number, 
            top_p?: number, 
            presence_penalty?: number, 
            frequency_penalty?: number } = config.model_options): 
        Promise<CreateChatCompletionResponse> {

            console.log(messages)
        const response = await api.createChatCompletion({
            "model": options.model,
            "messages": [
                {
                    "role": "system",
                    "name": "System",
                    "content": OpenAPI.systemPrompt,
                }, 
                ...messages
            ],
            ...options
        });
        return response.data;
    }
}

