/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable } = require("stream");
const Throught = require("../utils/throught");
const Busboy = require('busboy');
const process = require('process');

const kRequest = Symbol('request');
const kHeaders = Symbol('headers');
const kStream = Symbol('stream');

class Ask extends Readable {

    constructor($qwebs, request, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });        
        this.qwebs = $qwebs;
        this[kRequest] = request;
        this[kHeaders] = headers;
        this[kStream] = null;
        this.mode = "array";   
        
        this[kRequest].pause();

        this.once('ready', () => this.onceReady());
        this.on('pause', () => this.onPause());
        this.on('resume', () => this.onResume());

        this.on('newListener', (event, listener) => {
            this.init();
            // if (["data", "file", "field", "headers"].some(e => e == event)) {
            //     process.nextTick(() => {
            //         this.tryFlowing();
            //     })
            // }
        })
        
    }

    get mime() {
        return this[kHeaders]["content-type"].split(":").shift();
    }

    init() {
        if (this[kStream]) return;
        const mime = this.mime;
        process.nextTick(async () => { //async operations
            try {
                if (/application\/json/.test(mime)) {
                    const jsonStream = await this.qwebs.resolve("$json-stream");
                    const parser = jsonStream.parse();
                    this[kStream] = this[kRequest].pipe(parser);
                    this.emit("ready");
                }
                if (/multipart\/form-data/.test(mime)) {
                    const busboy = new Busboy({ headers: this[kHeaders] });
                    busboy.on("file", (...args) => this.emit.apply(this, args));    //re emit
                    busboy.on("field", (...args) => this.emit.apply(this, args));
                    busboy.on("finish", (...args) => this.emit.apply(this, args));
                    this[kStream] = this[kRequest].pipe(busboy);
                    this.emit("ready");
                }
            }
            catch(error) {
                this.emit("error", error);
            }
        })
    }

    onceReady() {
        this[kStream].on('data', (chunk) => this.onData(chunk));
        this[kStream].on('end', () =>  this.onEnd());
        this[kStream].on('error', (error) => this.emit('error', error));
    }

    onData(chunk) {
        this.push(chunk);
    }

    onEnd(chunk) {
        this.push(null);
    }

    onPause() {
        if (!this[kStream]) return;
        if (!this[kStream].isPaused())
            this[kStream].pause();
    }

    onResume() {
        if (!this[kStream]) return;
        if (this[kStream].isPaused())
            this[kStream].resume();
    }

    _read(nread) {
        if (!this[kStream]) {
            this.once('ready', this._read.bind(this, nread));
            this.init();
            return;
        }
        if (this[kStream].isPaused())
            this[kStream].resume();
    }

    get obj() {
        this.mode = "object";
        return this;
    }
};

module.exports = Ask;
