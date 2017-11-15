/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const CompressedStream = require("./compressed");

class JsonStream extends Transform {
    constructor($json, reply, jsonOptions = {}, streamOptions = {}) {
        if (!reply) throw new UndefinedError("reply");
        super({ ...streamOptions, objectMode: true });
        this.reply = reply;
        this.jsonOptions = jsonOptions;
        this.first = true;
    }

    _transform(chunk, encoding, callback) {
        try {
            if (this.first) {
                this.first = false;
                this.pipe($json.stringify(this.jsonOptions)).pipe(new CompressedStream(this.reply))
            }
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    end(chunk, encoding, callback) {
        if (this.first && !this.jsonOptions.outputType) this.jsonOptions.outputType == "object";
        super.end(chunk, encoding, callback);
    }
}

module.exports = JsonStream;