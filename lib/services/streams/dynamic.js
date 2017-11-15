/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");
const CompressedStream = require("./compressed");

class DynamicStream extends Transform {

    constructor(streamOptions = {}) {
        super({ ...streamOptions, objectMode: true });
        this.first = true;
    }

    async _transform(chunk, encoding, callback) {
        try {
            if (this.first) {
                await this.pipeEnd(this);
                this.first = false;
            }
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            callback(error);
        }
    }

    pipeEnd(stream) {
        stream.pipe(new CompressedStream());
    }
}

module.exports = DynamicStream;