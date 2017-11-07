/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

//https://github.com/TypeStrong/typedoc/blob/fa87b1c/src/typings/node/node.d.ts#L186

const expect = require("expect.js");
const Qwebs = require("qwebs");
const { FromArray } = require("qwebs");
const http = require("http");
const request = require('request');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("reponse", () => {

    // it("JSON string", () => {
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

    // it("JSON stream", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: {}});
    //     const json = await qwebs.resolve("$json-stream");

    //     let server = http.createServer((request, response) => {
    //         const stream = new FromArray([{ id: 1}, { id: 2}, { id: 3}, { id: 4}]);
    //         stream.pipe(json.stringify).pipe(response);
    //     }).listen(1340, () => {
    //         request({ method: 'GET', uri: 'http://localhost:1340', json: true }, (error, response, body) => {
    //             server.close()
    //             expect(error).to.be(null);
    //             expect(body.length).to.be(4);
    //         });
    //     });
    // });

    it("Reply stream", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("Reply", "../../lib/services/reply", { instanciate: false });
		
        const json = await qwebs.resolve("$json-stream");
        const Reply = await qwebs.resolve("Reply");

        let server = http.createServer((request, response) => {
            const stream = new FromArray([{ id: 1}, { id: 2}, { id: 3}, { id: 4}]);
            //stream.pipe(json.stringify).pipe(response);
            const reply = new Reply(request, response);
            stream.pipe(reply);
        }).listen(1341, () => {
            request({ method: 'GET', uri: 'http://localhost:1341' }, (error, response, body) => {
                server.close()
                expect(error).to.be(null);
                expect(body.length).to.be(4);
            });
        });
    });

});