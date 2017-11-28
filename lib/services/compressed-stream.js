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
    
    constructor(reply) {
        if (!reply) throw new UndefinedError("reply");
        super();
        this.stream = this;

        const contentEncoding = reply.headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) this.stream = this.pipe(zlib.createGzip());
        if (/deflate/.test(contentEncoding)) this.stream = this.pipe(zlib.createDeflate());
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
}

module.exports = CompressedStream;