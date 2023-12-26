const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

const UploadFile = async (req, res) => {
    try {
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(200).send({ code: 400, msg: 'File upload error: ' + err.message });
            } else if (err) {
                return res.status(200).send({ code: 500, msg: 'Error uploading file' });
            }

            if (!req.file) {
                return res.status(201).send({ code: 401, msg: 'No file provided' });
            }
            if (!fs.existsSync('./draw-chart')) {
                fs.mkdirSync('./draw-chart');
            }

            const filePath = path.join('./draw-chart', req.file.filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send({ code: 404, msg: 'File not found after upload' });
            }

            return res.status(200).send({ code: 200, msg: 'File uploaded successfully' });
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).send({ code: 500, msg: 'Error uploading file' });
    }
}

const DeleteFile = async (req, res) => {
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
}

const CleanHeaders = (headers) => headers.map(header => header.replace(/[^a-zA-Z0-9]/g, ''));
const FindMatchedColumns = (headers, columns) => {
    let matchedColumns = [];
    for (let i = 0; i < columns.length; i++) {
        for (let j = 0; j < headers.length; j++) {
            if (headers[j] === columns[i]) {
                matchedColumns.push(headers[j]);
            }
        }
    }
    return matchedColumns;
}

const GetChartData = async  (req, res) => {
    try {
        const columns = req.body.columns;
        const filePath = path.join('./draw-chart', req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(200).send({ code: 400, msg: 'File not found' });
        }
        const file = fs.readFileSync(filePath, 'utf8');
        const rows = file.split('\n');
        let header = rows[0].split(',')
        const CleanHeadersArray = CleanHeaders(header);
        const MatchedColumns = FindMatchedColumns(CleanHeadersArray, columns);
        if (MatchedColumns.length != columns.length) {
            return res.status(200).send({ code: 400, msg: 'Invalid columns' });
        }

        if (MatchedColumns.length < 2) {
            return res.status(200).send({ code: 400, msg: 'At least 2 columns are required' });
        }

        const DateIndex = CleanHeadersArray.indexOf('Date');
        const CSVData = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split('","');
            for (let j = 0; j < row.length; j++) {
                if (j !== DateIndex) {
                    row[j] = parseFloat(row[j].replace(/[^0-9.-]/g, ''));
                }
            }
            CSVData.push(row);
        }
        const MatchedColumnsIndex = [];
        for (let i = 0; i < MatchedColumns.length; i++) {
            MatchedColumnsIndex.push(CleanHeadersArray.indexOf(MatchedColumns[i]));
        }

        const ParsedCSV = [];
        for (let i = 0; i < CSVData.length; i++) {
            let obj = {};
            for (let j = 0; j < CSVData[i].length; j++) {
                for (let k = 0; k < MatchedColumnsIndex.length; k++) {
                    if (j === MatchedColumnsIndex[k]) {
                        if (j !== DateIndex) {
                            CSVData[i][j] = parseFloat(CSVData[i][j]);
                            obj[MatchedColumns[k]] = CSVData[i][j];
                        }
                        else {
                            let date = new Date(CSVData[i][j]);
                            date = date.toLocaleDateString()
                            CSVData[i][j] = date;
                            obj[MatchedColumns[k]] = CSVData[i][j];
                        }
                    }
                }
            }
            ParsedCSV.push(obj);
        }
        const Structured = ParsedCSV.map((row, index) => {
            let obj = {};
            obj['name'] = row[columns[0]];
            for (let i = 1; i < columns.length; i++) {
                obj['y' + i] = row[columns[i]];
            }
            return obj;
        })
        console.log(Structured);
        return res.status(200).send({ code: 200, msg: 'Data retrieved successfully', data: Structured });

    }

    catch (error) {
        console.log(error);
        return res.status(500).send({ code: 500, msg: 'Error getting chart data' });
    }
}






module.exports = {
    UploadFile,
    DeleteFile,
    GetChartData
}
