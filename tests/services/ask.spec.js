/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const http = require("http");
const request = require('request');
const fs =  require('fs');
const JSONStream =  require('JSONStream');

require("process").on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

describe("ask", () => {

    // it("post object -> object", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2996 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
        
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveOne");
    //     const client = await qwebs.resolve("$client");
    //     await client.post({ url: "http://localhost:2996/save", json: {
    //         name: "ben",
    //         value: 0,
    //         test: "454566"
    //     } }).then(res => {
    //         expect(res.body.name).to.be("ben");
    //         expect(res.body.value).to.be(0);
    //         expect(res.body.test).to.be("454566");
    //     });
    // });

    // it("post object -> array", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2997 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
        
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveMany");
    //     const client = await qwebs.resolve("$client");
    //     await client.post({ url: "http://localhost:2997/save", json: {
    //         name: "ben",
    //         value: 0,
    //         test: "454566"
    //     } }).then(res => {
    //         expect(res.body.length).to.be(1);
    //         expect(res.body[0].name).to.be("ben");
    //         expect(res.body[0].value).to.be(0);
    //         expect(res.body[0].test).to.be("454566");
    //     });
    // });

    // it("post array -> object", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2998 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
        
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveOne");
    //     const client = await qwebs.resolve("$client");
    //     await client.post({ url: "http://localhost:2998/save", json: [
    //         {
    //             name: "ben",
    //             value: 0,
    //             test: "454566"
    //         },
    //         {
    //             name: "toto",
    //             value: 32,
    //             test: "zz"
    //         }
    //     ]}).then(res => {
    //         expect(res.body.name).to.be("ben");
    //         expect(res.body.value).to.be(0);
    //         expect(res.body.test).to.be("454566");
    //     });
    // });
    
    // it("post array -> array", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 2999 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
        
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveMany");
    //     const client = await qwebs.resolve("$client");
    //     await client.post({ url: "http://localhost:2999/save", json: [
    //         {
    //             name: "ben",
    //             value: 0,
    //             test: "454566"
    //         },
    //         {
    //             name: "toto",
    //             value: 32,
    //             test: "zz"
    //         }
    //     ]}).then(res => {
    //         expect(res.body.length).to.be(2);
    //         expect(res.body[0].name).to.be("ben");
    //         expect(res.body[0].value).to.be(0);
    //         expect(res.body[0].test).to.be("454566");
    //         expect(res.body[1].name).to.be("toto");
    //         expect(res.body[1].value).to.be(32);
    //         expect(res.body[1].test).to.be("zz");
    //     });
    // });

    // it("upload json stream", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3000 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveMany");
    //     const jsonstream = await qwebs.resolve("$json-stream");

    //     let receive = false;
    //     let sending = false;

    //     fs.createReadStream(`${__dirname}/../data/npm.array.json`)
    //         .on("data", data => {
    //             if (!sending) console.log("FIRST SENDING", new Date())
    //             sending = sending || true;
    //         })
    //         .on("end", () => {
    //             console.log("FILE END", new Date())
    //         })
    //         .pipe(request.post("http://localhost:3000/save"))
    //         .pipe(jsonstream.parse())
    //         .on("end", data => {
    //             console.log("REQUEST END", new Date())
    //         })
    //         .on("data", data => {
    //             if (!receive) console.log("FIRST RECEIVE", new Date())
    //             receive = receive || true;
    //         })
    // });

    // it("upload image stream", async () => {
    //     let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3001 }}});
    //     await qwebs.inject("$http", "../../index");
    //     await qwebs.inject("$info", "./info");
    //     await qwebs.load();
    //     const http = await qwebs.resolve("$http");
    //     await http.post("/save", "$info", "saveMany");
    //     const jsonstream = await qwebs.resolve("$json-stream");

    //     let receive = false;
    //     let sending = false;

    //     fs.createReadStream(`${__dirname}/../data/npm.array.json`)
    //         .on("data", data => {
    //             if (!sending) console.log("FIRST SENDING", new Date())
    //             sending = sending || true;
    //         })
    //         .on("end", () => {
    //             console.log("FILE END", new Date())
    //         })
    //         .pipe(request.post("http://localhost:3001/save"))
    //         .pipe(jsonstream.parse())
    //         .on("end", data => {
    //             console.log("REQUEST END", new Date())
    //         })
    //         .on("data", data => {
    //             if (!receive) console.log("FIRST RECEIVE", new Date())
    //             receive = receive || true;
    //         })
    // });

    it("upload stream", async () => {
        let qwebs = new Qwebs({ dirname: __dirname, config: { http: { port: 3002 }}});
        await qwebs.inject("$http", "../../index");
        await qwebs.inject("$info", "./info");
        await qwebs.load();
        const http = await qwebs.resolve("$http");
        await http.post("/upload", "$info", "uploadFile");

        const requestOptions = {
            formData : {
              file : fs.createReadStream(`${__dirname}/../data/npm.array.json`)
            },
            method : 'POST',
            url    : 'http://localhost:3002/upload'
          };
        

        request(requestOptions)
            .on("data", data => {
                console.log(data)
            })
            .on("error", error => {
                console.error(error)
            })
            .on("end", () => {
                console.log("END")
            })
    });

    
});
