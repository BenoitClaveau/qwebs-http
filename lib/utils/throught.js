/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error } = require("oups");
const { Transform } = require("stream");

class Throught extends Transform {

    constructor(options) {
        super(options);
        this.first = true;
    }

    async _transform(chunk, encoding, callback) {
        try {
            if (this.first) {
                this.first = false;
                await this.pipeEnd(chunk);
            }
            //console.log(">", Buffer.isBuffer(chunk) ? chunk.toString() : chunk)
            this.push(chunk, encoding);
            callback();
        }
        catch(error) {
            this.first = false;
            callback(error);
        }
    }
}

module.exports = Throught;