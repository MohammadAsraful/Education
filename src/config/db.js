const mongoose = require('mongoose')
const { mongoDBURL } = require('../secret')

const connectDB = async (options)=>{
    try {
        await mongoose.connect(mongoDBURL, options);
        console.log('Database Connection Established')
        mongoose.connection.on('error', (error) => {
            console.error('DB connection error', error)
        })
    } catch (error) {
        console.error('could not connect to DB', error.toString())
    }
} 


module.exports = connectDB;