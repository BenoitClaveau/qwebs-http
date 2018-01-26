/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Duplex } = require("stream");
const process = require('process');

const kAsk = Symbol('ask');
const kReply = Symbol('reply');

class AskReply extends Duplex {

    constructor(ask, reply) {
        if (!ask) throw new UndefinedError("ask");
        if (!reply) throw new UndefinedError("reply");
        super({ objectMode: true })
        this[kAsk] = ask;
        this[kReply] = reply;

        this[kAsk].on('data', (chunk) => this.onAskData(chunk));
        this[kAsk].on('end', () =>  this.onAskEnd());
        this[kAsk].on("error", (...args) => this.emit.apply(this, args));
        this[kAsk].on("file", (...args) => this.emit.apply(this, args));
        this[kAsk].on("field", (...args) => this.emit.apply(this, args));
        this[kAsk].on("finish", (...args) => this.emit.apply(this, args));
        
        this[kReply].on("error", (...args) => this.emit.apply(this, args));
        this[kReply].on("drain", (...args) => this.emit.apply(this, args));
        //this[kReply].on("finish", (...args) => this.emit.apply(this, args));

        //this[kReply].on('drain', (chunk) => this.onData(chunk));
        //this[kReply].on('end', () =>  this.onEnd());
    }


    _read(nread) {
        this[kAsk].read(nread);
    }

    _write(chunk, encoding, callback) {
        this[kReply].write(chunk, encoding, callback);
    }

    onAskData(chunk) {
        this.push(chunk);
    }

    onAskEnd(chunk) {
        this.push(null);
    }

};

module.exports = AskReply;
