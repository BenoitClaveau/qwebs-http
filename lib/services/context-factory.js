/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const Busboy = require('busboy');
const URL = require("url");

class ContextFactory {
    constructor($qwebs, $querystring, $AskReply) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$querystring) throw new UndefinedError("$querystring");
        if (!$AskReply) throw new UndefinedError("$AskReply");
        this.qwebs = $qwebs;
        this.querystring = $querystring;
        this.AskReply = $AskReply;
    }

    getContext(request) {
        if (!request) throw new UndefinedError("request");
        const qwebs = this.qwebs;
        const url = decodeURI(request.url);
        const method = request.method;
        const part = URL.parse(url);
        const auth = part.auth;
        const hash = part.hash;
        const host = part.host;
        const hostname = part.hostname;
        const href = part.href;
        const path = part.path;
        const pathname = part.pathname;
        const port = part.port;
        const protocol = part.protocol;
        const search = part.search;
        const slashes = part.slashes;
        const querystring = part.query;
        const query = this.querystring.parse(querystring);
        return { qwebs, url, method, auth, hash, host, hostname, href, path, pathname, port, protocol, search, slashes, querystring, query };
    }

    getHeaders(request) {
        if (!request) throw new UndefinedError("request");
        return request.headers;
    }

    async getStream(request, response, headers) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("request");
        if (!headers) throw new UndefinedError("headers");
        const { AskReply } = this;
        return new AskReply(this.qwebs, request, response, headers);
    }
}

module.exports = ContextFactory;
