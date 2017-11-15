/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L186

//EE.listenerCount(dest, 'error')


// const EventEmitter = require('events');
// EventEmitter.usingDomains = true;

const expect = require("expect.js");
const Qwebs = require("qwebs");
const { FromArray } = require("qwebs");
const http = require("http");
const request = require('request');
const fs =  require('fs');
const domain =  require('domain');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("reply", () => {

    xit("404", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2999 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/info", "$info", "getInfo");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        try {
            await client.get({ url: "http://localhost:2999/info2", json: true });
            throw new Error("Unexpected.")
        }
        catch(error) {
            expect(error.statusCode).to.be(404);
        }
    });

    xit("json object", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3000 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/info", "$info", "getInfo");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get({ url: "http://localhost:3000/info", json: true });
        expect(res.statusCode).to.be(200);
        expect(res.body.text).to.be("I'm Info service.");
    });

    xit("json stream", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3001 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/stream", "$info", "getStream");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get({ url: "http://localhost:3001/stream", json: true });
        expect(res.statusCode).to.be(200);
        expect(res.body.length).to.be(2);
        expect(res.body.shift().id).to.be(1);
        expect(res.body.shift().id).to.be(2);
    }, 10000);

    xit("json long stream", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3002 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/stream", "$info", "getStreamWithTimeout");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get({ url: "http://localhost:3002/stream", json: true });
        expect(res.statusCode).to.be(200);
        expect(res.body.length).to.be(2);
        expect(res.body.shift().id).to.be(3);
        expect(res.body.shift().id).to.be(4);
    }, 10000);

    it("file", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3003 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/file", "$info", "getFile", { objectMode: null });
        await qwebs.load();
        request.get({ url: "http://localhost:3003/file" }).on("data", chunk => {
            //console.log(chunk.toString())
        })
        .pipe(fs.createWriteStream(`${__dirname}/../data/output/file.js`));
    }, 10000);

    it("array", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3004 }}});
        qwebs.inject("$http", "../../index");
        qwebs.inject("$info", "./info");
        const http = await qwebs.resolve("$http");
        await http.get("/array", "$info", "getArray");
        await qwebs.load();
        request.get({ url: "http://localhost:3004/array", json: true }).on("data", chunk => {
            console.log(chunk.toString())
        })
        .pipe(fs.createWriteStream(`${__dirname}/../data/output/file.js`));
    }, 10000);

    // xit("JSON string", () => {
    //     let server = http.createServer((request, response) => {
    //         response.writeHead(200, {'Content-Type': 'application/json'});
    //         response.end('{ "id": 3 }');
    //     }).listen(1339, () => {
    //         request({ method: 'GET', uri: 'http://localhost:1339', json: true }, (error, response, body) => {
    //             server.close()
    //             expect(error).to.be(null);
    //             expect(body.id).to.be(3);
    //         });
    //     });
    // });

    // xit("JSON stream", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: {}});
    //     const json = await qwebs.resolve("$json-stream");

    //     let server = http.createServer((request, response) => {
    //         const stream = new FromArray([{ label: 1}, { label: 2}, { label: 3}, { label: 4}]);
    //         stream.pipe(json.stringify).pipe(response);
    //     }).listen(1340, () => {
    //         request({ method: 'GET', uri: 'http://localhost:1340', json: true }, (error, response, body) => {
    //             server.close()
    //             expect(error).to.be(null);
    //             expect(body.length).to.be(4);
    //         });
    //     });
    // });

    // xit("Reply stream", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: {}});
    //     qwebs.inject("Reply", "../../lib/services/reply", { instanciate: false });
    //     const Reply = await qwebs.resolve("Reply");    
        
    //     let server = http.createServer(async (request, response) => {
    //         const stream = new FromArray([{ label: 1}, { label: 2}, { label: 3}, { label: 1}]);
    //         const reply = new Reply(request, response, qwebs);
    //         await reply.mount();
    //         stream.pipe(reply.toJSON);
    //     }).listen(1341, () => {
    //         request({ method: 'GET', uri: 'http://localhost:1341', json: true }, (error, response, body) => {
    //             server.close()
    //             expect(error).to.be(null);
    //             expect(body.length).to.be(4);
    //         });
    //     });
    // });

    // xit("Reply stream with domain", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: {}});
    //     qwebs.inject("Reply", "../../lib/services/reply", { instanciate: false });
    //     const Reply = await qwebs.resolve("Reply");    
        
    //     let server = http.createServer(async (request, response) => {
    //         const stream = new FromArray([{ label: "info"}, { label: "prog"}, { label: "description"}, { label: "date"}]);
    //         const reply = new Reply(request, response, qwebs);
    //         await reply.mount();

    //         const d = domain.create();
    //         d.add(request)
    //         d.add(response)
            
    //         d.on('error', error => {
    //             console.error('Error', error, request.url);
    //             try {
    //                 if (response.headersSent) {
    //                     response.addTrailers({ "error": "Error occurred, sorry." });
    //                     response.end();
                        
    //                 }
    //                 else {
    //                     response.writeHead(500);
    //                     response.end('Error occurred, sorry.');
    //                 }
    //             } catch (error2) {
    //                 console.error('Error sending 500', error2, request.url);
    //             }
    //         })

    //         d.run(() => {
    //             const upper = new ToUpper();
    //             stream.pipe(upper).pipe(reply.toJSON);
    //         });

    //     }).listen(1341, () => {
    //         request({ method: 'GET', uri: 'http://localhost:1341', json: true }, (error, response, body) => {
    //             server.close()
    //             expect(error).to.be(null);
    //             expect(response.statusCode).to.be(200);
    //             expect(body.length).to.be(4);
    //         }).on('data', function(data) {
    //             console.log('> RECEIVE chunk:', data.toString());
    //         })
    //         .on('response', function(response) {
    //             response.on('end', function(data) {
    //                 console.log("> RECEIVE end")
    //                 //console.log('received', data.length, 'bytes of data', data.toString());
    //             }).on('error', function(error) {
    //                 console.error("> RECEIVE error", error);
    //             });
    //         })
    //     });
    // });

});

const { Transform } = require("stream");
class ToUpper extends  Transform {
    constructor() {
        super({ objectMode: true, usingDomains: true });
        this.cpt = 0;
    }

    _transform(chunk, encoding, callback) {
        try {
            setTimeout(() => {
                if (chunk.label == "info") 
                    return callback(new Error("Test"))
                this.push({ ...chunk, label: chunk.label.toUpperCase() });
                callback();
            }, (++this.cpt) * 500)
        }
        catch(error) {
            callback(error);
        }
    }
}
