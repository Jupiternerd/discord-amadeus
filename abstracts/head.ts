// author = shokkunn

// extend client from Discord.js
import { Client, ClientOptions, Collection, REST, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js';
import { statSync, readdirSync } from 'fs';
import AmadeusListener from '../abstracts/listeners';
import Script from './scripts';
import winston from "winston"
export default class AmadeusClient extends Client {
    // internal variables
    public scripts = new Collection<string, Script>();
    public static scriptPrompt: string = "Allowed programmatic_command:";
    private _token: string;
    private _owner_id: string;

    // shards
    /** 
     * PROD: ADD THIS
    public cluster: Cluster.Client = new Cluster.Client(this);
    */

    constructor(options: ClientOptions, internal: { token: string, owner_id: string }) {
        super(options);
        this._token = internal.token;
        this._owner_id = internal.owner_id;
    }

    // getters
    get owner_id(): string {
        return this._owner_id;
    }

    /**
     * @name driveThroughLocalFiles
     * @desc This function recursively loops through the files in the directory, ignoring folders and spitting back file paths.
     * @param {string} path | String that leads to the path.
     * @param {function} callback | Function that is called when a file is found.
     * @param {function} filter | Function that is ran before a callback is passed. Passes the file name. ie: "file.js"
     */
    static async driveThroughLocalFiles(path: string, callback: Function, filter: Function = async () => { return true }): Promise<void> {
        // drive through the files in the directory.
        try {
            for (const file of readdirSync(path)) {
                // if the file is a directory.
                if (statSync(path + file).isDirectory()) {
                    // see this function again.
                    await this.driveThroughLocalFiles(path + file + "/", callback, filter);
                } else {
                    // if the file matches the filter, we return the callback.
                    if (filter(file)) await callback(path + file);
                }
            }
        } catch (error) {
            // incase the path is not available.
            winston.error(error);
        }
    }

    /**
     * @name queueListeners
     * @description Queues the listeners
     * @param {string } path The path to the listeners
     */
    async queueListeners(path: string = "./listeners/"): Promise<void> {
        await AmadeusClient.driveThroughLocalFiles(path, async (file: string) => {
            // import the listener
            const event = await import(`../${file}`);
            const ev: AmadeusListener = new event.default(); // init new event listener
            if (ev.once) { // if it is once
                super.once(ev.name, (...args) => ev.execute(this, ...args))
            } else { // if it is continuous
                super.on(ev.name, (...args) => ev.execute(this, ...args))
            }
            // inform the user
            winston.log("success", `🎧 Loaded listener: ${ev.name}`);
        }, (onlyFile: string) => onlyFile.endsWith(".js"))
    }

    async loadScripts(path: string = "./scripts/"): Promise<void> {
        await AmadeusClient.driveThroughLocalFiles(path, async (file: string) => {
            // import the script
            const script = await import(`../${file}`);
            const sc: Script = new script.default(); // init new script
            this.scripts.set(sc.name, sc); // set the script    
            // inform the user
            winston.log("success", `🎧 Loaded script: ${sc.name}`);
            // insert into script prompt
            AmadeusClient.scriptPrompt += `${sc.modelGuide}| `;
        }, (onlyFile: string) => onlyFile.endsWith(".js"))
    }


    /**
     * @name activate
     * @description Activates the client
     * @param {string} token The token to login with
     */
    async activate(token: string | null | undefined = this._token): Promise<void> {
        // queue listeners
        await this.queueListeners();

        // load scripts
        await this.loadScripts();

        if (!token) winston.log("fatal", "No token provided.")
        // start the client
        this.login(token);
    }
}