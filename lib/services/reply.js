/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const http = require("http");
const url = require("url");
const querystring = require("querystring");
const CompressedStream = require("./streams/compressed");
const JsonStream = require("./streams/json");

class Reply {
    
    constructor(request, response, $qwebs) {
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!$qwebs) throw new UndefinedError("$qwebs");

        this.request = request;
        this.response = response;
        this.qwebs = $qwebs;
        this.stream = new CompressedStream(this); //default stream

        this.headers = [];
        this.statusCode = 200;
        
        this.method = request.method;
        const part = url.parse(decodeURI(request.url));
        this.pathname = part.pathname;
        this.query = part.query ? querystring.parse(part.query) : {};

        const acceptEncoding = this.request.headers["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this.headers["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this.headers["Content-Encoding"] = "deflate";
    }

    async json() {
        if (this.reply.response.headersSent) throw new Error("Headers already sent.");

        this.headers["Content-Type"] = "application/json";
        const json = await this.qwebs.resolve("$json");
        this.stream = new JsonStream(json, this); //replace default stream
        return this.stream;
    }
};

module.exports = Reply;
