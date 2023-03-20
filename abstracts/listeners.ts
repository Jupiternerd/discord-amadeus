// author = shokkunn

import AmadeusClient from "./head";

export default abstract class AmadeusListener {
    // variables
    public name: string;
    public once: boolean;

    constructor(name: string, once: boolean) {
        this.name = name;
        this.once = once;
    }

    /**
     * @name execute
     * @description Executes the listener
     * @param {AmadeusClient} client The client
     * @param {any} ...args The arguments to execute the listener with
     * @returns {Promise<void>}
     **/
    abstract execute(client: AmadeusClient, ...args: any): Promise<any>;
}