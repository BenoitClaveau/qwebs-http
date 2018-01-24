/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
const expect = require("expect.js");
const Qwebs = require("qwebs");
const process = require("process");
const { inspect } = require("util");
const http2 = require('http2');

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let qwebs;
beforeEach(() => qwebs = new Qwebs({ dirname: __dirname, config: { 
    http2: { 
        port: 3000, 
        cert: `${__dirname}/certificates/certificate.pem`,
        key: `${__dirname}/certificates/private-key.pem`,
    }
}}));
afterEach(async () => await qwebs.unload());

describe("http-router", () => {

    it("single route", async () => {
        qwebs.inject("$http", "../index");
        qwebs.inject("$info", "./services/info");
        await qwebs.load();
        const http = await qwebs.resolve("$http");
        http.get("/whoiam", "$info", "whoiam");
        http.get("/helloworld", "$info", "helloworld");
        //const client = await qwebs.resolve("$client");
        const client = http2.connect('https://localhost:3000');
        client.on('stream', (pushedStream, requestHeaders) => {
            pushedStream.on('push', (responseHeaders) => {
                // process response headers
            });
            pushedStream.on('data', (chunk) => { /* handle pushed data */ });
        });
          
        const req = client.request({ 
            ':path': '/whoiam' 
        });
        req.on('response', (headers) => {
            console.log(headers[http2.constants.HTTP2_HEADER_STATUS]);
        });
        let data = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => data += chunk);
        req.on('end', () => {
            console.log(`The server says: ${data}`);
            client.close();
        });
        //req.end('Jane');

        const timeout = ms => new Promise(res => setTimeout(res, ms))

        await timeout(10000)
        console.log("DONE")
        //const res = await client.get("https://localhost:3000/whoiam");
        //expect(res.body).to.be("I'm Info service.");
    }).timeout(60000);

});