// author = shokkunn
import NodeCache from "node-cache";
import config from "../config.json";

export default class Cache {
    static bucket: NodeCache = new NodeCache({
        stdTTL: config.caching.ttl,
        checkperiod: config.caching.checkPeriod,
        deleteOnExpire: true,
    }); 
} 