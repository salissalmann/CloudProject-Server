const express = require('express');

const app = express();
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json({ limit: '50mb' });
const urlencodedParser = bodyParser.urlencoded({ extended: true, limit: '50mb' }); 
const cors = require('cors');

app.use(jsonParser);
app.use(urlencodedParser);

//json-parser
app.use(bodyParser.json());
app.use(
    cors([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
));

require('dotenv').config();

//routes
const fileRoutes = require('./routes/fileRouter');

app.use('/api/files', fileRoutes);


app.listen(3000, () => {
    console.log('Server is running on port 3000');
})