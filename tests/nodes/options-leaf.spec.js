/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const request = require("request");
const process =  require("process");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
});

describe("options", () => {

    it("*", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3005 }}});
        await qwebs.inject("$http", "../../index");
        await qwebs.inject("$info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("$http");
        await http.post("/info", "$info", "info");

        const requestOptions = {
            method : "OPTIONS",
            url    : "http://localhost:3005"
        };

        request(requestOptions, (error, response, body) => {
            expect(response.headers["content-type"]).to.be("image/png");
        });
    });
});
