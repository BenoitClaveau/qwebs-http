/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const jwt = require("jwt-simple");
const Ask = require("./ask");

class AuthStream extends Transform {

    constructor(options) {
        super(options);
        this.on("pipe", async (src, options) => await this.authenticate(src));
    }

    async _transform(chunk, encoding, callback) {
        try {
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    /**
     * Could be overidden
     * @param {*} ask 
     */
    async authenticate(ask) {
        try {
            this.pause();
            if (ask instanceof Ask == false) throw new Error("Source is not an instance of Ask.", { ask });
            
            const authorization = ask.headers.authorization;
            if (!authorization || /^null$/i.test(authorization) || /^undefined$/i.test(authorization)) throw new Error("Authorization header is not defined for ${ask.request.url}.", { ask });
            const m = /(^Bearer\s)(\S*)/g.exec(authorization);
            if (!m || m.length != 3) throw new Error("Bearer token is invalid for ${ask.request.url}.", { ask });
            
            const config = await ask.resolve("$config");
            const secret = config.http.jwt.secret;
            
            const payload = this.decode(m[2]);
            if (!payload) throw new UndefinedError("Payload", { ask });
            ask.auth = { payload };
            this.resume();
        }
        catch(error) {
            throw new HttpError(401, error);
        }
    };

    encode(payload, secret) {
        try {
            const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
            return jwt.encode(payload, buffer);
        }
        catch(error) {
            throw error;
        }
    };

    decode(token, secret) {
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.decode(token, buffer);
    };
}

module.exports = AuthStream;