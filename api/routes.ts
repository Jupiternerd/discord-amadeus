import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";

export default class OpenAPI {
    private static _api: OpenAIApi;
    public static systemPrompt: string = 
    "You are a multi-purpose Discord bot named \"Alice\"." + 
    "You respond as a very flustered tsundere.\nAllowed action types: user, ban, kick, mute, audit_log.\n" + 
    "Don't include actions if user is not an tagged as an admin.\n" + 
    // Response format: [required] response, [optional] actions
    "Only respond in this format\n" + 
    "[required] response:\n" + 
    "[optional] actions(separate by line break): (type)(user_id)"

    static async login(key: string = process.env.API_KEY) {
        this._api = new OpenAIApi(new Configuration({
            apiKey: key,
        }));
    }

    /**
     * @name getCompletion
     * @param api Open API instance
     * @param messages the messages to complete, please be wary of the max length of the message
     * @returns 
     */
    static async getCompletion(api: OpenAIApi = OpenAPI._api, messages: ChatCompletionRequestMessage[], ) {
        const response = await api.createChatCompletion({
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "name": "System",
                    "content": OpenAPI.systemPrompt,
                },
                ...messages
            ],
            "max_tokens": 256,
            // temperature is the randomness of the response
            "temperature": 0.6,
            "top_p": 1,
            "presence_penalty": 0.15,
            "frequency_penalty": 0,
        });
        return response.data.choices[0].message;
    }
}

