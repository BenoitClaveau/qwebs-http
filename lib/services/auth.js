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
        if (!$config.http) throw new UndefinedError("Http section in $config");
        if (!$config.http.jwt) throw new UndefinedError("$config.jwt");
        if (!$config.http.jwt.secret) throw new UndefinedError("$config.jwt.secret");
        this.config = $config;
    };

    async identify(ask) {
        try {
            const authorization = ask.headers.authorization;
            if (!authorization || /^null$/i.test(authorization) || /^undefined$/i.test(authorization)) throw new Error("Authorization header is not defined for ${ask.request.url}.", { ask });
            const m = /(^Bearer\s)(\S*)/g.exec(authorization);
            if (!m || m.length != 3) throw new Error("Bearer token is invalid for ${ask.request.url}.", { ask });
            ask.payload = this.decode(m[2]);
            if (!ask.payload) throw new UndefinedError("Payload", { ask });
        }
        catch(error) {
            throw new HttpError(401, error);
        }
    };

    encode(payload) {
        try {
            const secret = Buffer.from(this.config.http.jwt.secret);
            return jwt.encode(payload, secret);
        }
        catch(error) {
            throw error;
        }
    };

    decode(token) {
        const secret = Buffer.from(this.config.http.jwt.secret);
        return jwt.decode(token, secret);
    };
};

exports = module.exports = AuthenticationService;