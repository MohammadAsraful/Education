const createError = require('http-errors')
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { successResponse } = require('./responseController');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { jwtAccessKey } = require('../secret');


const handleLogin = async(req, res, next) =>{
    try { // email, password req.body
        const {email, password} = req.body;
          //isExist user
        const user = await User.findOne({email})
        if(!user){
            throw createError(404, 'User does not exist with this email, please register first')
        }

          //comapre the password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch) {
            throw createError(401, 'email/password did not match')
        }

          //isBanned
        if(user.isBanned){
            throw createError(403, 'Your account has been banned, please contact authority')
        }


          //token and send to cookie(http cookie)
        // Create JWT
      const accessToken = createJSONWebToken({user}, jwtAccessKey, '15m');
      res.cookie('accessToken', accessToken,
        {
            maxAge: 15 * 60 * 1000,// 15 minutes
            httpOnly: true,
            // secure: true,
            sameSite: 'none',
        }
      );
      
          // success response
          return successResponse(res,{
            statusCode: 200,
            message: 'User logged in successfully',
            payload: { user}
        })
        
    } catch (error) {
        next(error)
    }
};




const handleLogout = async(req, res, next) =>{
    try { 

        res.clearCookie('accessToken')
          // success response
          return successResponse(res,{
            statusCode: 200,
            message: 'User logged out successfully',
            payload: { }
        })
        
    } catch (error) {
        next(error)
    }
}


module.exports = {handleLogin, handleLogout}