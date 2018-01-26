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
const kResponse = Symbol('response');
const kHeaders = Symbol('headers');
const kReadableStream = Symbol('readablestream');
const kWriteableStream = Symbol('writeablestream');
const kReadableInit = Symbol('readableinit');
const kWriteableInit = Symbol('writeableinit');
const kReadableMode = Symbol('readablemode');
const kWriteableMode = Symbol('writeablemode');

class AskReply extends Readable {

    constructor($qwebs, request, response, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });        
        this[kQwebs] = $qwebs;
        this[kRequest] = request;
        this[kResponse] = response;
        this[kHeaders] = headers;
        this[kReadableStream] = null;
        this[kWriteableStream] = null;
        this[kReadableInit] = false;
        this[kWriteableInit] = false;
        this[kReadableMode] = "array";
        this[kWriteableMode] = "array";

        this[kRequest].pause();

        this.once('readableinit', () => this.onceReadableInit());
        this.once('writeableinit', () => this.onceWriteableInit());
    }

    on(ev, fn) {
        super.on(ev, fn);
        switch(ev) {
            case "file":
            case "data": this.emit("readableinit"); break;
            case "unpipe": this.emit("writeableinit"); break;
            case "drain": this.emit("writeableinit"); break;
        }
    }

    pipe(src, options) {
        super.pipe(src, options);
    }

    async onceReadableInit() {
        const mime = this[kHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const jsonStream = await this[kQwebs].resolve("$json-stream");
            const parser = jsonStream.parse();
            this[kReadableStream] = this[kRequest].pipe(parser);
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kHeaders] });
            busboy.on("file", (...args) => this.emit.apply(this, args));    //re emit
            busboy.on("field", (...args) => this.emit.apply(this, args));
            busboy.on("finish", (...args) => this.emit.apply(this, args));
            this[kReadableStream] = this[kRequest].pipe(busboy);   
        }
        else {
            this[kReadableStream] = this[kRequest];
        }

        this[kReadableStream].on('data', (chunk) => this.onReadableData(chunk));
        this[kReadableStream].on('end', () =>  this.onReadableEnd());
        this[kReadableStream].on('error', (error) => this.emit('error', error));
        this[kReadableInit] = true;
        this.emit("writeableinit");
    }

    async onceWriteableInit() {

        this[kWriteableInit] = true;
        this.emit("writeableinit");
    }
    
    onReadableData(chunk) {
        this.push(chunk);
    }

    onReadableEnd(chunk) {
        this.push(null);
    }

    end() {
        this.push(null);
    }

    read(nread) {
        if (!this[kReadableInit]) {
            this.once('readableinit', this._read.bind(this, nread));
            return;
        }

        if (this[kRequest].isPaused())
            this[kRequest].resume();
    }

    write(chunk, encoding, callback) {
        if (!this[kWriteableInit]) {
            this.once('writeableinit', this.write.bind(this, chunk, encoding, callback));
            return;
        }

        this[kResponse].write(chunk, encoding, callback);
    }

    get obj() {
        this[kReadableMode] = this[kWriteableMode] = "object";
        return this;
    }
};

module.exports = AskReply;
