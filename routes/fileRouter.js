const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const e = require('express');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './draw-chart');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['csv']; 
    const fileType = path.extname(file.originalname).substring(1);
    if (!allowedFileTypes.includes(fileType)) {
        const error = new Error('Incorrect file');
        error.code = 'INCORRECT_FILETYPE';
        return cb(error, false);
        }
        cb(null, true);
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, 
  },
}).single('file');

router.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(200).send({ code: 400, msg: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(200).send({ code: 500, msg: 'Error uploading file' });
    }

    if (!req.file) {
      return res.status(201).send({ code: 401, msg: 'No file provided' });
    }
    if(!fs.existsSync('./draw-chart')){
        fs.mkdirSync('./draw-chart');
    }

    const filePath = path.join('./draw-chart', req.file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ code: 404, msg: 'File not found after upload' });
    }

    return res.status(200).send({ code: 200, msg: 'File uploaded successfully' });
  });
});


router.delete('/delete/:filename', (req, res) => {
    console.log(req.params.filename);
    try {
        const filePath = path.join('./draw-chart', req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(200).send({ code: 404, msg: 'File not found' });
        }
        fs.unlinkSync(filePath);
        return res.status(200).send({ code: 200, msg: 'File deleted successfully' });
    } catch (error) {
        return res.status(500).send({ code: 500, msg: 'Error deleting file' });
    }
})

router.post('/get-chart-data/:filename', (req, res) => {
    try{
        const columns = req.body.columns;
        const filePath = path.join('./draw-chart', req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(200).send({ code: 200, msg: 'File not found' });
        }
        const file = fs.readFileSync(filePath, 'utf8');
        const rows = file.split('\n');
        const data = [];
        let header = rows[0].split(',')       
        for(let i = 0; i < header.length; i++){
            header[i] = header[i].replace(/['"]+/g, '');
        }
        let ValidHeaders = []                  
        for (let i = 0; i < columns.length; i++) {
            for(let j = 0; j < header.length; j++)
            {
                if(header[j].includes(columns[i])){
                    ValidHeaders.push(header[j]);
                }
            }
        }
        if(ValidHeaders.length < 2){
            return res.status(200).send({ code: 400, msg: 'Invalid columns' });
        }
        
        let temp = [];
        for(let i = 0; i < ValidHeaders.length; i++){
            temp.push(ValidHeaders[i]);
        }
        for(let i = 1; i < rows.length; i++){
            let row = rows[i].split('","');
            let temp = [];
            for(let j = 0; j < ValidHeaders.length; j++){
                temp.push(row[header.indexOf(ValidHeaders[j])]);
            }            
            data.push(temp);
        }
        let dateIndex = -1
        for(let i = 0; i < ValidHeaders.length; i++){
            if(ValidHeaders[i].includes('Date')){
                dateIndex = i;
            }
        }          
        for(let i = 0; i < data.length; i++){
            for(let j = 0; j < data[i].length; j++){
                if(j != dateIndex){
                    data[i][j] = data[i][j].replace(/[^0-9.-]/g, '');
                    data[i][j] = parseFloat(data[i][j]);
                }
            }
        }

        //Convert Date to Date object
        for(let i = 0; i < data.length; i++){
            data[i][dateIndex] = data[i][dateIndex].replace(/['"]+/g, '');
            data[i][dateIndex] = data[i][dateIndex].replace(/\r/g, '');
            data[i][dateIndex] = new Date(data[i][dateIndex]);
        }
        console.log(data);


        return res.status(200).send({ code: 200, msg: 'Data retrieved successfully', data: data, columns: ValidHeaders });                
    }
    catch(error){
        return res.status(500).send({ code: 500, msg: 'Error getting chart data' });
    }
})


module.exports = router;
