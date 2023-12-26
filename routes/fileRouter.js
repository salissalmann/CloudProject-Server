const express = require('express');
const { UploadFile, DeleteFile, GetChartData } = require('../controllers/filesContoller');

const router = express.Router();
router.post('/upload', UploadFile);
router.delete('/delete/:filename', DeleteFile)
router.post('/get-chart-data/:filename', GetChartData);

module.exports = router;
