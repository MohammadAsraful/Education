const createError = require('http-errors')
const jwt = require('jsonwebtoken');
const { jwtAccessKey } = require('../secret');
const isLoggedIn = async(req, res, next) => {
    try {
        const accessTkn = req.cookies.accessToken;
        if(!accessTkn){
            throw createError(401, 'Access denied, token not found')
        }

        const decoded = jwt.verify(accessTkn, jwtAccessKey)
        if(! decoded) {
            throw createError(401, 'Invalid access token, please login again')
        }
       req.user = decoded.user;

       next()

    } catch (error) {
        return next(error)
    }
}
const isLoggedOut = async(req, res, next) => {
    try {
        const accessTkn =await req.cookies.accessToken;
        if(accessTkn){
           try {
            const decoded = jwt.verify(accessTkn, jwtAccessKey)
            if(decoded){
                
                throw createError(400, 'User already logged in')
            }
           } catch (error) {
            throw error;
           }
        }


       next()

    } catch (error) {
        return next(error)
    }
}
const isAdmin = async(req, res, next) => {
    try {
        
        console.log('Admin',req.user.isAdmin)
    
        if(!req.user.isAdmin){
            throw createError(403, 'Forbidden, Only admin can access this resources')
        }

       next()

    } catch (error) {
        return next(error)
    }
}


module.exports = {isLoggedIn, isLoggedOut, isAdmin}