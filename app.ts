/**
 * author = shokkunn
 */
import dotenv from 'dotenv';
import winston from 'winston';
import DiscordTransport, { Levels, LogTransport } from './utils/logger';
import * as config from './config.json';
import { IntentsBitField, Partials, WebhookClient } from 'discord.js';
import OpenAPI from './utils/routes';
import AmadeusClient from './abstracts/head';

dotenv.config();

try {
    winston.configure({
        "levels": Levels,
        "format": winston.format.combine(
            winston.format.timestamp()),
        transports: [new DiscordTransport({ level: "success" }, new WebhookClient({
            "id": process.env.LOGGER_ID,
            "token": process.env.LOGGER_TOKEN,
        })), new LogTransport({ level: "debug" })],
    })
} catch (e) { }

winston.info("Starting...");

OpenAPI.login(process.env.API_KEY); // login to the api

const CLIENT = new AmadeusClient({
    // set intents
    intents: [
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildPresences,
    ],
    /*
    PROD: ADD THIS
    shards: CLUSTER_DATA.SHARD_LIST,
    shardCount: CLUSTER_DATA.TOTAL_SHARDS,
    */
    // set partials
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Reaction
    ]
}, {
    token: process.env.BOT_TOKEN,
    owner_id: config.permissions.owner_id,
});

// load client
CLIENT.activate();