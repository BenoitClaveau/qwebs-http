/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable } = require("stream");
const Busboy = require('busboy');
const process = require('process');

const kQwebs = Symbol('qwebs');
const kRequest = Symbol('request');
const kHeaders = Symbol('headers');
const kStream = Symbol('stream');
const kInit = Symbol('init');

class Ask extends Readable {

    constructor($qwebs, request, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });        
        this[kQwebs] = $qwebs;
        this[kRequest] = request;
        this[kHeaders] = headers;
        this[kStream] = null;
        this[kInit] = false;
        this.mode = "array";   
        
        this[kRequest].pause();

        this.on('pause', () => this.onPause());
        this.on('resume', () => this.onResume());

        // this.on('newListener', (event, listener) => {
        //     this.init();
        //     // if (["data", "file", "field", "headers"].some(e => e == event)) {
        //     //     process.nextTick(() => {
        //     //         this.tryFlowing();
        //     //     })
        //     // }
        // })
        
    }

    get mime() {
        return this[kHeaders]["content-type"].split(":").shift();
    }

    async onceReady() {
        const mime = this.mime;
        if (/application\/json/.test(mime)) {
                const jsonStream = await this[kQwebs].resolve("$json-stream");
                const parser = jsonStream.parse();
                this[kStream] = this[kRequest].pipe(parser);
                this.emit("ready");
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kHeaders] });
            busboy.on("file", (...args) => this.emit.apply(this, args));    //re emit
            busboy.on("field", (...args) => this.emit.apply(this, args));
            busboy.on("finish", (...args) => this.emit.apply(this, args));
            this[kStream] = this[kRequest].pipe(busboy);
            this.emit("ready");
        }
        else {
            this[kStream] = this[kRequest];
            this.emit("ready");
        }
        this[kStream].on('data', (chunk) => this.onData(chunk));
        this[kStream].on('end', () =>  this.onEnd());
        this[kStream].on('error', (error) => this.emit('error', error));
        this[Kinit] = true;
    }

    onData(chunk) {
        this.push(chunk);
    }

    onEnd(chunk) {
        this.push(null);
    }

    onPause() {
        if (!this[kRequest].isPaused())
            this[kRequest].pause();
    }

    onResume() {
        //if (this[kRequest].isPaused())
        //    this[kRequest].resume();
    }

    _read(nread) {
        if (!this[kInit]) {
            this.once('ready', this._read.bind(this, nread));
            return;
        }

        if (this[kRequest].isPaused())
            this[kRequest].resume();
    }

    get obj() {
        this.mode = "object";
        return this;
    }
};

module.exports = Ask;
