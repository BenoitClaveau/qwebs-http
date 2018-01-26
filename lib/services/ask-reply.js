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
const kInit = Symbol('init');

class AskReply extends Duplex {

    constructor(ask, reply) {
        if (!ask) throw new UndefinedError("ask");
        if (!reply) throw new UndefinedError("reply");
        
        super({ objectMode: true })
        this.pause();
        this[kAsk] = ask;
        this[kReply] = reply;
        this[kInit] = false;
        //this.once('ready', () => this.onceReady());
    }

    // on(ev, fn) {
    //     super.on(ev, fn);
    //     if (ev == "file") {
    //         console.log("*******")
    //         if (!this[kInit]) this.emit("ready");
    //     }
    // }

    onceReady() {
        this[kReply].on("error", (...args) => this.emit.apply(this, args));
        this[kReply].on("drain", (...args) => this.emit.apply(this, args));

        this[kAsk].on('data', (chunk) => this.onAskData(chunk));
        this[kAsk].on('end', () =>  this.onAskEnd());
        this[kAsk].on("error", (...args) => this.emit.apply(this, args));
        this[kAsk].on("file", (...args) => this.emit.apply(this, args));
        this[kAsk].on("field", (...args) => this.emit.apply(this, args));
        this[kAsk].on("finish", (...args) => this.emit.apply(this, args));
        //this[Kinit] = true;
    }

    _read(nread) {
        if (!this[kInit]) {
            this.once('ready', this._read.bind(this, nread));
            return;
        }
        
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

    get headers() {
        return this[kReply].headers
    }
};

module.exports = AskReply;
