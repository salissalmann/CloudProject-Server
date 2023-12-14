const express = require('express');

const app = express();
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json({ limit: '50mb' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '50mb' }); 

app.use(jsonParser);
app.use(urlencodedParser);

const cors = require('cors');
//if want to allow all origins
app.use(cors());


//json-parser
app.use(bodyParser.json());

require('dotenv').config();

const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4'
});

const BucketName = "cloudproject-s3bucket"


app.post('/addImageToS3Bucket', (req, res) => {
    try{
        console.log(req.body.fileName);
        const Base64 = req.body.imageFile;
        const FileName = req.body.fileName;
        const base64Data = new Buffer.from(Base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const params = {
            Bucket: BucketName,
            Key: `${FileName}`,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: `image/png`
        };

        const s3 = new AWS.S3();

        s3.upload(params, (err, data) => {
            if (err) {
                res.status(500).send({status: false});
            }
            res.status(200).send({status: true , data: data});
        });
        

    }
    catch(err){
        res.status(500).send(err);
    }
})

//Get S3 Bucket Images
app.get('/getImagesLinksFromS3Bucket', (req, res) => {
    try{
        const s3 = new AWS.S3();
        const params = {
            Bucket: BucketName
        };

        s3.listObjects(params, (err, data) => {
            if (err) {
                res.status(500).send(err);
            }
            let imagesLinks = [];
            data.Contents.forEach((image) => {
                imagesLinks.push(`https://${BucketName}.s3.amazonaws.com/${image.Key}`);
            })
            res.status(200).send(imagesLinks);
        })
    }
    catch(err){
        res.status(500).send(err);
    }
})

const DynamoDBTableName = "cloudproject-table"
//

app.get('/createTable', (req, res) => {
    try {
        const dynamodb = new AWS.DynamoDB();
        const params = {
            TableName: DynamoDBTableName,
            KeySchema: [
                { AttributeName: "id", KeyType: "HASH" }, 
            ],
            AttributeDefinitions: [
                { AttributeName: "id", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        };

        dynamodb.createTable(params, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    } catch (err) {
        res.status(500).send(err);
    }
});
//

app.post('/addDataToDynamoDB',  (req, res) => {
    try {
        console.log(req.body);
        
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: DynamoDBTableName,
            Item: {
                "id": req.body.username,
                "firstname": req.body.firstname,
                "lastname": req.body.lastname,
                "email": req.body.email,
                "phonenumber": req.body.phonenumber,
                "city": req.body.city                
            }   
        };

        docClient.put(params, function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send({status: false});
            } else {
                console.log(data);
                res.status(200).send({status: true});
            }
        });
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/getDataFromDynamoDB', (req, res) => {
    try {
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: DynamoDBTableName
        };

        docClient.scan(params, function (err, data) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    }
    catch (err) {
        res.status(500).send(err);
    }
})







app.listen(3000, () => {
    console.log('Server is running on port 3000');
})