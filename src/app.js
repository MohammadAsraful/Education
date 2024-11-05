const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const createError = require('http-errors')
const xssClean = require('xss-clean')
const rateLimit = require('express-rate-limit')
const userRouter = require('./routers/userRouter')
const seedRouter = require('./routers/seedRouter')
const { errorResponse } = require('./controllers/responseController')
const authRouter = require('./routers/authRouter')

const app = express()


const rateLimiter = rateLimit({
    windowMs: 1 * 6 * 1000, // 1 min
    max: 5,
    message: 'To many request from this IP, please try again later', 
})
app.use(cookieParser());
app.use(morgan('dev'))
app.use(rateLimiter)
app.use(xssClean())
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}))


app.use('/api/users',userRouter)
app.use('/api/auth',authRouter)
app.use('/api/seed',seedRouter)
  

         
 // client error handling
app.use((req, res, next)=>{
    next(createError(404, 'route not found'))
})

// server error handling --> all error will come here
app.use((err, req, res, next)=>{
    return errorResponse(res,{
        statusCode: err.status,
        message: err.message,
    })
})



module.exports = app;