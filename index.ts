const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')

app.use(express.json())
app.use(cors())
dotenv.config()
const { connectDB } = require('./config/db')
connectDB();

// const authroute = require('./routes/authRoutes')
import authroute from './routes/authRoutes'
import psroute from './routes/psRoutes'

app.use('/api/auth', authroute);
app.use('/api', psroute);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});