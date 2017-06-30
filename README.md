# qwebs-http
Http server for Qwebs [Qwebs](https://www.npmjs.com/package/qwebs).

## Features

  * [Qwebs](https://www.npmjs.com/package/qwebs)

## Installation

```shell
npm install $qwebs --save
npm install $qwebs-http --save
```

## Create a service.js

```service.js
"use strict";

class Service {
	constructor() {	
};

index(request, response) {
 let content = {
  text: `hello ${request.params.name}`
 };
 return response.send({ request: request, content: content });
};

exports = module.exports = Service;
```

## Define routes.json

```routes.json
{
    "services": [
        { "name": "$http", "location": "qwebs-http"},
        { "name": "$service", "location": "./service"}
    ],
    "locators": [
        { "get": "/:name", "service": "$service", "method": "index" },
    ]
}
```

## Create config.json

```config.json
{
    "routes": "./routes.json"
    "http": {
        "port": 3000
    }
}
```

## Enjoy

Create a server.js

```server.js
"use strict";

const Qwebs = require("qwebs");
new Qwebs().load();
```

Run server on http://localhost:3000

```shell
node server.js
```
