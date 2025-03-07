"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
const node_fetch_1 = __importStar(require("node-fetch"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const events_1 = require("events");
/**
 * Top.gg API Client for Posting stats or Fetching data
 * @example
 * ```js
 * const Topgg = require(`@top-gg/sdk`)
 *
 * const api = new Topgg.Api('Your top.gg token')
 * ```
 * @link {@link https://topgg.js.org | Library docs}
 * @link {@link https://docs.top.gg | API Reference}
 */
class Api extends events_1.EventEmitter {
    /**
     * Create Top.gg API instance
     * @param {string} token Token or options
     * @param {object?} options API Options
     */
    constructor(token, options = {}) {
        super();
        this.options = {
            token: token,
            ...options,
        };
    }
    async _request(method, path, body) {
        var _a;
        const headers = new node_fetch_1.Headers();
        if (this.options.token)
            headers.set("Authorization", this.options.token);
        if (method !== "GET")
            headers.set("Content-Type", "application/json");
        let url = `https://top.gg/api/${path}`;
        if (body && method === "GET")
            url += `?${new URLSearchParams(body)}`;
        const response = await node_fetch_1.default(url, {
            method,
            headers,
            body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        });
        let responseBody;
        if ((_a = response.headers.get("Content-Type")) === null || _a === void 0 ? void 0 : _a.startsWith("application/json")) {
            responseBody = await response.json();
        }
        else {
            responseBody = await response.text();
        }
        if (!response.ok) {
            throw new ApiError_1.default(response.status, response.statusText, response);
        }
        return responseBody;
    }
    /**
     * Post bot stats to Top.gg
     * @param {Object} stats Stats object
     * @param {number} stats.serverCount Server count
     * @param {number?} stats.shardCount Shard count
     * @param {number?} stats.shardId Posting shard (useful for process sharding)
     * @returns {BotStats} Passed object
     * @example
     * ```js
     * await api.postStats({
     *   serverCount: 28199,
     *   shardCount: 1
     * })
     * ```
     */
    async postStats(stats) {
        if (!stats || !stats.serverCount)
            throw new Error("Eksik Sunucu Sayısı");
        /* eslint-disable camelcase */
        await this._request("POST", "/bots/stats", {
            server_count: stats.serverCount,
            shard_id: stats.shardId,
            shard_count: stats.shardCount,
        });
        /* eslint-enable camelcase */
        return stats;
    }
    /**
     * Get a bots stats
     * @param {Snowflake} id Bot ID
     * @returns {BotStats} Stats of bot requested
     * @example
     * ```js
     * await api.getStats('461521980492087297')
     * // =>
     * {
     *   serverCount: 28199,
     *   shardCount 1,
     *   shards: []
     * }
     * ```
     */
    async getStats(id) {
        if (!id)
            throw new Error("ID eksik");
        const result = await this._request("GET", `/bots/${id}/stats`);
        return {
            serverCount: result.server_count,
            shardCount: result.shard_count,
            shards: result.shards,
        };
    }
    /**
     * Get bot info
     * @param {Snowflake} id Bot ID
     * @returns {BotInfo} Info for bot
     * @example
     * ```js
     * await api.getBot('461521980492087297') // returns bot info
     * ```
     */
    async getBot(id) {
        if (!id)
            throw new Error("ID eksik");
        return this._request("GET", `/bots/${id}`);
    }
    /**
     * Get user info
     * @param {Snowflake} id User ID
     * @returns {UserInfo} Info for user
     * @example
     * ```js
     * await api.getUser('205680187394752512')
     * // =>
     * user.username // Xignotic
     * ```
     */
    async getUser(id) {
        if (!id)
            throw new Error("ID eksik");
        return this._request("GET", `/users/${id}`);
    }
    /**
     * Get a list of bots
     * @param {BotsQuery} query Bot Query
     * @returns {BotsResponse} Return response
     * @example
     * ```js
     * // Finding by properties
     * await api.getBots({
     *   search: {
     *     username: 'shiro',
     *     certifiedBot: true
     *     ...any other bot object properties
     *   }
     * })
     * // =>
     * {
     *   results: [
     *     {
     *       id: '461521980492087297',
     *       username: 'Shiro',
     *       discriminator: '8764',
     *       lib: 'discord.js',
     *       ...rest of bot object
     *     }
     *     ...other shiro knockoffs B)
     *   ],
     *   limit: 10,
     *   offset: 0,
     *   count: 1,
     *   total: 1
     * }
     * // Restricting fields
     * await api.getBots({
     *   fields: ['id', 'username']
     * })
     * // =>
     * {
     *   results: [
     *     {
     *       id: '461521980492087297',
     *       username: 'Shiro'
     *     },
     *     {
     *       id: '493716749342998541',
     *       username: 'Mimu'
     *     },
     *     ...
     *   ],
     *   ...
     * }
     * ```
     */
    async getBots(query) {
        if (query) {
            if (query.fields instanceof Array)
                query.fields = query.fields.join(", ");
            if (query.search instanceof Object) {
                query.search = Object.entries(query.search)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" ");
            }
        }
        return this._request("GET", "/bots", query);
    }
    /**
     * Get users who've voted
     * @returns {ShortUser[]} Array of users who've voted
     * @example
     * ```js
     * await api.getVotes()
     * // =>
     * [
     *   {
     *     username: 'Xignotic',
     *     discriminator: '0001',
     *     id: '205680187394752512',
     *     avatar: '3b9335670c7213b3a2d4e990081900c7'
     *   },
     *   {
     *     username: 'iara',
     *     discriminator: '0001',
     *     id: '395526710101278721',
     *     avatar: '3d1477390b8d7c3cec717ac5c778f5f4'
     *   }
     *   ...more
     * ]
     * ```
     */
    async getVotes() {
        if (!this.options.token)
            throw new Error("Eksik Token");
        return this._request("GET", "/bots/votes");
    }
    /**
     * Get whether or not a user has voted in the last 12 hours
     * @param {Snowflake} id User ID
     * @returns {Boolean} Whether the user has voted in the last 12 hours
     * @example
     * ```js
     * await api.hasVoted('205680187394752512')
     * // => true/false
     * ```
     */
    async hasVoted(id) {
        if (!id)
            throw new Error("Eksik ID");
        return this._request("GET", "/bots/check", { userId: id }).then((x) => !!x.voted);
    }
    /**
     * Whether or not the weekend multiplier is active
     * @returns {Boolean} Whether the multiplier is active
     * @example
     * ```js
     * await api.isWeekend()
     * // => true/false
     * ```
     */
    async isWeekend() {
        return this._request("GET", "/weekend").then((x) => x.is_weekend);
    }
}
exports.Api = Api;
