const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');

const user = require('./routes/api/user');
const course = require('./routes/api/course');

app.use(cors());
app.use(express.json());

app.use('/user', user);
app.use('/dashboard', course);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
