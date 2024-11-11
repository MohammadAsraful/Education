const createError = require('http-errors')
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { successResponse } = require('./responseController');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { jwtAccessKey, jwtRefreshKey } = require('../secret');

// controller for handle logIn
const handleLogin = async(req, res, next) =>{
    try { // email, password req.body
        const {email, password} = req.body;
          //isExist user
        const user = await User.findOne({ email })
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
      const accessToken = createJSONWebToken({user}, jwtAccessKey, '1m');
      res.cookie('accessToken', accessToken,
        {
            maxAge: 1 * 60 * 1000,// 15 minutes
            httpOnly: true,
            // secure: true,
            sameSite: 'none',
        }
      );
      const refreshToken = createJSONWebToken({user},jwtRefreshKey, '7d');
      res.cookie('refreshToken', refreshToken,
        {
            maxAge: 7 * 24* 60 *60 * 1000,// 7 days
            httpOnly: true,
            // secure: true,
            sameSite: 'none',
        }
      );
      //this line for not show password when user login
      const userWithoutPassword = await User.findOne({ email }).select('-password')
          // success response
          return successResponse(res,{
            statusCode: 200,
            message: 'User logged in successfully',
            payload: { userWithoutPassword}
        })
        
    } catch (error) {
        next(error)
    }
};



// controller for handle logout
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

const handleRefreshToken = async(req, res, next) =>{
    try { 
          const oldRefreshToken = req.cookies.refreshToken;

          // verify the old refhresh token
          const decodedToken = jwt.verify(oldRefreshToken, jwtRefreshKey)

          if(!decodedToken){
            throw createError(401, 'Invalid Refresh token, please log in again')
          }

          const accessToken = createJSONWebToken(
            decodedToken.user, 
            jwtAccessKey,
             '1m');
      res.cookie('accessToken', accessToken,
        {
            maxAge: 1 * 60 * 1000,// 15 minutes
            httpOnly: true,
            // secure: true,
            sameSite: 'none',
        }
      );
          return successResponse(res,{
            statusCode: 200,
            message: 'new access token is generated',
            payload: { }
        })
        
    } catch (error) {
        next(error)
    }
}
const handleProtectedRoute = async(req, res, next) =>{
    try { 
          const accessToken = req.cookies.accessToken;

          // verify the old refhresh token
          const decodedToken = jwt.verify(accessToken, jwtAccessKey)

          if(!decodedToken){
            throw createError(401, 'Invalid Access token, please log in again')
          }

 
          return successResponse(res,{
            statusCode: 200,
            message: 'Protected resources accessed',
            payload: { }
        })
        
    } catch (error) {
        next(error)
    }
}


module.exports = {handleLogin, handleLogout, handleRefreshToken, handleProtectedRoute}