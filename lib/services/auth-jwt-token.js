/*!
 * qwebs-http
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError, HttpError, Error } = require("oups");
const jwt = require("jwt-simple");

class AuthenticationService {

    constructor($config) {
        if (!$config) throw new UndefinedError("$config");
        this.config = $config;
    };

    async authenticate(ask) {
        try {
            const authorization = ask.headers.authorization;
            if (!authorization || /^null$/i.test(authorization) || /^undefined$/i.test(authorization)) throw new Error("Authorization header is not defined for ${ask.request.url}.", { ask });
            const m = /(^Bearer\s)(\S*)/g.exec(authorization);
            if (!m || m.length != 3) throw new Error("Bearer token is invalid for ${ask.request.url}.", { ask });
            const payload = this.decode(m[2]);
            if (!payload) throw new UndefinedError("Payload", { ask });
            ask.auth = { payload };
        }
        catch(error) {
            throw new HttpError(401, error);
        }
    };

    encode(payload, secret = this.config.http.jwt.secret) {
        try {
            const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
            return jwt.encode(payload, buffer);
        }
        catch(error) {
            throw error;
        }
    };

    decode(token, secret = this.config.http.jwt.secret) {
        const buffer = Buffer.isBuffer(secret) ? secret : Buffer.from(secret);
        return jwt.decode(token, buffer);
    };

    // async httpAuthenticate(ask, reply) {
    //     reply.outputType = "object";
    //     ask.pipe(through2.obj(async (chunk, enc, callback) => {
    //         const token = this.auth.encode(chunk);
    //         callback(null, {token});
    //     })).pipe(reply);
	// };
};

exports = module.exports = AuthenticationService;