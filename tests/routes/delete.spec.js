/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const Qwebs = require("qwebs");
const http = require("http");
const request = require('request');

describe("post", () => {

    // it("post", done => {
    //     let server = null;
    //     return Promise.resolve().then(() => {
    //         let $qwebs = new Qwebs({ dirname: __dirname, config: {}});
            
    //         $qwebs.inject("$info", "../services/info");
    //         $qwebs.delete("/delete", "$info", "delete");

    //         return $qwebs.load().then(() => {
    //             server = http.createServer((request, response) => {
    //                 return $qwebs.invoke(request, response).catch(error => {
    //                     return response.send({ statusCode: 500, request: request, content: error }); //close request
    //                 });
    //             }).listen(1337);
                
    //             let $client = $qwebs.resolve("$client");
    //             return $client.delete({ url: "http://localhost:1337/delete", json: { login: "test" }}).then(res => {
    //                 expect(res.body.status).toBe("deleted");
    //             });
    //         });
    //     }).catch(fail).then(() => {
    //         if (server) server.close();
    //         done();
    //     });
    // });
});
