# @fusebit/cloud-git simple s3 git  storage demo


## Usage

> s3 storage use 

```code

const Express = require("express");
const {S3GitRepository} = require("./index");
const StandaloneStorage = require('pixl-server-storage/standalone');

// pixl-server-storage
const configS3 = {
    "engine": "S3",
    "AWS": {
        "accessKeyId": "minio",
        "secretAccessKey": "minio123",
        "region": "us-west-1",
        "sslEnabled": false,
        "s3ForcePathStyle": true,
        "endpoint": "localhost:9000",
        "correctClockSkew": true,
        "maxRetries": 5,
        "httpOptions": {
            "connectTimeout": 5000,
            "timeout": 5000
        }
    },
    "S3": {
        "keyPrefix": "",
        "fileExtensions": true,
        "params": {
            "Bucket": "s3app"
        },
        "cache": {
            "enabled": true,
            "maxItems": 1000,
            "maxBytes": 10485760
        }
    }
};
const storage = new StandaloneStorage(configS3, function (err) {
    if (err) {
        console.log("not ok")
    }
});
const app = Express();
app.use("/", new S3GitRepository(storage).createExpress(Express));
require("http").createServer(app).listen(3000);

```

## known limits

* after first commit && push then can only modiy 

