/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");

class Throught extends Transform {

    constructor($qwebs, streamOptions = {}) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        super(streamOptions);
        this.qwebs = $qwebs;
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

    async end(chunk, encoding, callback) {
        if (this.first) {
            await this.pipeEnd(this);
            this.first = false
        }
        super.end(chunk, encoding, callback)
    }
}

module.exports = Throught;