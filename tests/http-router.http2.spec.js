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
const fs = require('fs');

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", inspect(reason));
});

let qwebs;
beforeEach(() => qwebs = new Qwebs({ dirname: __dirname, config: { 
    http2: { 
        port: 8443, 
        cert: `${__dirname}/certificates/certificate.pem`,
        key: `${__dirname}/certificates/private-key.pem`,
    }
}}));
afterEach(async () => await qwebs.unload());

const timeout = ms => new Promise(res => setTimeout(res, ms))

describe("http-router", () => {

    xit("single route", async () => {
        const client = http2.connect('https://stackoverflow.com');

        const req = client.request();
        req.setEncoding('utf8');

        req.on('response', (headers, flags) => {
            console.log(headers);
        });

        let data = '';
        req.on('data', (d) => data += d);
        req.on('end', () => {
            console.log(data);
            client.destroy();
        })
        req.end();
    }).timeout(60000);

    it("single route", async () => {
        qwebs.inject("$http", "../index");
        qwebs.inject("$info", "./services/info");
        await qwebs.load();
        
        await timeout(600000)

        const http = await qwebs.resolve("$http");
        http.get("/whoiam", "$info", "whoiam");
        http.get("/helloworld", "$info", "helloworld");
        
        const client = http2.connect('https://localhost:8443',  {
           ca: fs.readFileSync(`${__dirname}/certificates/certificate.pem`)
        });
        //const client = http2.connect('http://localhost:3000');
        const req = client.request({ ':method': 'GET', ':path': '/' });
        req.on('response', (headers, flags) => {
            for (const name in headers) {
                console.log(`${name}: ${headers[name]}`);
            }
        });

        req.setEncoding('utf8');
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => {
            console.log(`\n${data}`);
            client.close();
        });
        req.end();


    }).timeout(600000);

    

});