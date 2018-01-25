/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable } = require("stream");
const Throught = require("../utils/throught");
const Busboy = require('busboy');

class Ask extends Readable {

    constructor(stream, options = {}) {
        if (!stream) throw new UndefinedError("stream");

        super(options);
        
        this.stream = stream;        
        this.mode = "array";
        
        this.stream.pause();
        
        this.stream.on('data', (chunk) => this.onData(chunk));
        this.stream.on('end', () =>  this.onEnd());
        this.stream.on('error', (error) => this.emit('error', error));

        this.on('pause', () => this.onPause());
        this.on('resume', () => this.onResume());
    }


    onData(chunk) {
        this.push(chunk);
    }

    onEnd(chunk) {
        this.push(null);
    }

    onPause() {
        if (!this.stream.isPaused())
            this.stream.pause();
    }

    onResume() {
        if (this.stream.isPaused())
            this.stream.resume();
    }

    _read(nread) {
        if (this.stream.isPaused())
            this.stream.resume();
    }

    get obj() {
        this.mode = "object";
        return this;
    }
};

module.exports = Ask;
