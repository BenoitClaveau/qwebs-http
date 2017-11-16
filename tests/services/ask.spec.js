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
const JSONStream = require('JSONStream');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("ask", () => {

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

});
