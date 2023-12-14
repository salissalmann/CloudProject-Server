const express = require('express');

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();

const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
});

const BucketName = "cloudproject-bucket"

app.get('/addImageToS3Bucket', (req, res) => {
    try{
        const s3 = new AWS.S3();
        const fileName = "test.jpg";
        const fileContent = "test";
        const params = {
            Bucket: BucketName,
            Key: fileName,
            Body: fileContent
        };
        s3.upload(params, function(err, data){
            if(err){
                res.status(500).send(err);
            }
            res.status(200).send(data);
        });
    }
    catch(err){
        res.status(500).send(err);
    }
})


//Connect to RDS database [MSSQL]

const username = "admin"
const password = "Salis2002"
const dbIdentifier = "cloudproject-db"
const host = "http://cloudproject-db.clhqrc3ybntf.us-east-1.rds.amazonaws.com/"

const sql = require('mssql')

const config = {
    user: username,
    password: password,
    server: host,
    database: dbIdentifier
}

//Connect to RDS database [MSSQL]

const connectToRDS = async () => {
    try {
        await sql.connect(config)
        console.log("Connected to RDS database")
    } catch (err) {
        console.log(err)
    }
}

connectToRDS()





app.listen(3000, () => {
    console.log('Server is running on port 3000');
})