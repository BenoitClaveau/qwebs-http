/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const zlib = require("zlib");
const crypto = require("crypto");

class CompressedStream extends Transform {
    
    constructor(reply, options = {}) {
        if (!reply) throw new UndefinedError("reply");
        super(options);
        this.stream = this;
        
        const contentEncoding = reply.headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) this.stream = this.stream.pipe(zlib.createDeflate());

        this.stream = this.stream.pipe(reply.response);
        const headers = this.headers(reply.headers, reply.request.headers);
        this.response.writeHead(reply.statusCode, headers);
    }

    _transform(chunk, encoding, callback) {
        try {
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    charset(headers) {
        if (/charset/.test(headers["Content-Type"] == false)) 
            headers["Content-Type"] += "; charset=utf-8";
    }

    vary(headers) {
        headers["Vary"] = "Accept-Encoding";
    }

    headers(headers, requestHeaders) {
        const contentType = headers["Content-Type"];
        if (!contentType) throw new UndefinedError("Content-Type");
        
        if (/application\/json/.test(contentType)) {
            this.charset(headers);
            this.vary(headers);
        }
        else if (/text\/html/.test(contentType)) {
            this.charset(headers);
            this.vary(headers);
        }
        
        const atime = new Date(Date.now());
        headers["Date"] = headers["Date"] || atime.toUTCString();
        headers["Cache-Control"] = headers["Cache-Control"] || "no-cache";
        headers["Expires"] = headers["Expires"] || atime.toUTCString();
        
        headers["Access-Control-Allow-Origin"] = headers["Access-Control-Allow-Origin"] || "*";
        headers["Access-Control-Allow-Methods"] = headers["Access-Control-Allow-Methods"] || headers["Allow"] || requestHeaders["access-control-request-method"] || "*";
        headers["Access-Control-Max-Age"] = headers["Access-Control-Max-Age"] || "3600";
        headers["Access-Control-Allow-Headers"] = headers["Access-Control-Allow-Headers"] || "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With";

        return headers;
    }
}

module.exports = CompressedStream;