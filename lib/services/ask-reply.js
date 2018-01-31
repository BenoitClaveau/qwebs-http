/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const { Readable, PassThrough, Transform } = require("stream");
const Busboy = require('busboy');
const process = require('process');

const kQwebs = Symbol('qwebs');
const kRequest = Symbol('request');
const kResponse = Symbol('response');
const kRequestHeaders = Symbol('requestheaders');
const kResponseHeaders = Symbol('responseheaders');
const kReadableStreamCurrent = Symbol('readablestreamcurrent');
const kReadableStreamEnd = Symbol('readablestreamend');
const kWritableStreamStart = Symbol('writablestreamstart');
const kWritableStreamCurrent = Symbol('writablestreamcurrent');
const kReadableInit = Symbol('readableinit');
const kWritableInit = Symbol('writableinit');
const kReadableMode = Symbol('readablemode');
const kWritableMode = Symbol('writablemode');

class AskReply extends Readable {

    /**
     * KRequest, ..., kReadableStream.
     * kWritableStream, ..., kRequest
     */
    constructor($qwebs, request, response, headers) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!request) throw new UndefinedError("request");
        if (!response) throw new UndefinedError("response");
        if (!headers) throw new UndefinedError("headers");
        super({ objectMode: true });
        const atime = new Date(Date.now());   
        request.pause();
        this[kQwebs] = $qwebs;
        this[kRequest] = request;
        this[kReadableStreamCurrent] = this[kRequest];
        this[kReadableStreamEnd] = new PassThrough({ objectMode: true });
        this[kWritableStreamStart] = new MyTransform(this);
        this[kWritableStreamCurrent] = this[kWritableStreamStart];
        this[kResponse] = response;

        this[kRequestHeaders] = headers;
        this[kReadableInit] = false;
        this[kWritableInit] = false;
        this[kReadableMode] = "array";
        this[kWritableMode] = "array";
        this[kResponseHeaders] = {
            "Date": atime.toUTCString(),
            "Cache-Control": "no-cache",
            "Expires": atime.toUTCString(),
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "deny",
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline'",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": headers["access-control-request-method"] || "*",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With",
            "Content-Type": "application/json"
        };
        const acceptEncoding = this[kRequestHeaders]["accept-encoding"];
        if (/gzip/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "gzip";
        if (/defalte/.test(acceptEncoding)) this[kResponseHeaders]["Content-Encoding"] = "deflate";

        this.once('readableinit', this.onceReadableInit.bind(this));
        this.once('writableinit', this.onceWritableInit.bind(this));
    }

    // on(ev, fn) {
    //     switch(ev) {
    //         case "data": 
    //         case "end":
    //         case "file": this.emit("readableinit"); break;
    //     }
    //     super.on(ev, fn);
    // }

    async onceReadableInit() {
        const mime = this[kRequestHeaders]["content-type"].split(":").shift();

        if (/application\/json/.test(mime)) {
            const jsonStream = await this[kQwebs].resolve("$json-stream");
            const parser = jsonStream.parse();
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(parser);        
        }
        else if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers: this[kRequestHeaders] });
            busboy.on("file", (...args) => this.emit.apply(this, args));    //re emit
            busboy.on("field", (...args) => this.emit.apply(this, args));
            busboy.on("finish", (...args) => this.emit.apply(this, args));
            this[kReadableStreamCurrent] = this[kReadableStreamCurrent].pipe(busboy); 
        }

        this[kReadableStreamEnd] = this[kReadableStreamCurrent];
        this[kReadableStreamEnd].on('data', (chunk) => this.onReadableData(chunk));
        this[kReadableStreamEnd].once('end', () =>  this.emit.bind(this, "end"));
        this[kReadableInit] = true;
        this.emit('readableready');
    }

    async onceWritableInit(chunk) {
        const headers = this[kResponseHeaders];
        const contentType = this[kResponseHeaders]["Content-Type"]
        if (!contentType) this[kResponse].emit('error', new UndefinedError("Content-Type"));

        if (/charset/.test(contentType) == false) headers["Content-Type"] += "; charset=utf-8";

        if (/application\/json/.test(contentType)) {
            const json = await this[kQwebs].resolve("$json-stream");
            const isArray = this[kWritableMode] == "array";
            const stringifier = json.stringify({ isArray })
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(stringifier); 
        }

        //Compression
        const contentEncoding = headers["Content-Encoding"];
        if (/gzip/.test(contentEncoding)) {
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(zlib.createGzip());
        }
        if (/deflate/.test(contentEncoding)) {
            this[kWritableStreamCurrent] = this[kWritableStreamCurrent].pipe(zlib.createDeflate());
        }

        this[kResponse].writeHead(200, { headers });
        this[kWritableStreamCurrent].pipe(this[kResponse]);
        this[kWritableInit] = true;
        this.emit('writableready');
    }
    
    onReadableData(chunk) {
        const value = chunk ? chunk : null; //undefined is not accepeted
        //this.emit("data", value);
        this.push(value);
    }

    end() {
    }

    read() {
        if (!this[kReadableInit]) {
            this.once('readableready', this.read.bind(this));
            this.emit('readableinit');
            return;
        }
        
        return this[kRequest].read(0);
    }

    write(chunk, encoding, callback) {
        if (!this[kReadableInit]) {
            this.once('writableready', this.read.bind(this));
            this.emit('writableinit');
            return;
        }
        
        this[kWritableStreamStart].write(chunk, encoding, callback);
    }


    get obj() {
        this[kReadableMode] = this[kWritableMode] = "object";
        return this;
    }
};

class MyTransform extends Transform {
    
    constructor(duplex) {
        super({ objectMode: true });
        this.duplex = duplex;
        this.first = true;
    }

    async _transform(chunk, encodeing, callback) {
        if (this.first) {
            this.first = false;
            await this.duplex.writableInit(chunk);
        }
        this.push(chunk);
        callback();
    }
}

module.exports = AskReply;
