const createError = require('http-errors')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const User = require('../models/userModel');
const { successResponse } = require('./responseController');
const { findUserById } = require('../services/findUserById');
const { deleteImage } = require('../helper/deleteImage');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { jwtActivationKey, clientUrl, defaultImagePath, jwtResetPasswordKey } = require('../secret');
const { emailWithNodeMailer } = require('../helper/email');
const {deleteOldImage } = require ('../helper/deleteImageHelper');
const { handleUserAction, findUsers, findSingleUserById, deleteSingleUserById, updateSingleUserById, updateUserPasswordById, forgetPasswordByEmail } = require('../services/userService');


// get all users
const getUsers = async (req, res, next)=>{
    try {
        // req.user.isAdmin;
        const search = req.query.search || "" ;
        const page = Number(req.query.page )|| 1 ;
        const limit = Number(req.query.limit) || 5 ;

        
        // imported from service>userService
        const {users,pagination} = await findUsers(search, page, limit)
       

        

        
        return successResponse(res,{
            statusCode: 200,
            message: 'Users were returned successfully',
            payload: {
                users: users,
            pagination: pagination,
            }
        })

    } catch (error) {
        next(error)
    }
}

// get single user by id
const getUser = async (req, res, next)=>{
    try {
       
        const id = req.params.id;
        const options = {password: 0};
        const user = await findSingleUserById(id, options)
      
        return successResponse(res,{
            statusCode: 200,
            message: 'User returned successfully',
            payload: 
            { user }
        })

    } catch (error) {
        
        next(error)
    }
}
// delete single user by Id
const deleteUser = async (req, res, next)=>{
    try {
        const id = req.params.id;
        const options = {password: 0};
        await deleteSingleUserById(id, options)
// find solution tutorial 42 for remove userImagePath
      
        return successResponse(res,{
            statusCode: 200,
            message: 'User deleted successfully',
            payload: 
            {  }
        })

    } catch (error) {
        
        next(error)
    }
}
// creaat a user
const processRegister = async (req, res, next) => { 
    try {
      const { name, email, password, phone, address } = req.body;
      let imagePath = defaultImagePath;
  
      if (req.file) {
        const image = req.file;
        if (image.size > 1024 * 1024 * 2) {
          throw new Error('File is too large, it must be less than 2 MB');
        }
        imagePath = image.path;
      }
  
      const userExist = await User.exists({ email: email });
      if (userExist) {
        throw createError(409, 'User with this email already exists, please sign in');
      }
  
      // Create JWT
      const tokenPayload = { name, email, password, phone, address, image: imagePath };
      const token = createJSONWebToken(tokenPayload, jwtActivationKey, '10m');
  
      // Prepare email
      const emailData = {
        email,
        subject: 'Account Activation Email',
        html: `
          <h2>Hello ${name}!</h2>
          <p>Please click here to 
          <a href="${clientUrl}/api/users/activate/${token}" target="_blank">activate your account</a></p>
        `,
      };
  
      // Send email with nodemailer
      try {
        // await emailWithNodeMailer(emailData);
      } catch (emailError) {
        next(createError(500, 'Failed to send verification email'));
        return;
      }
  
      return successResponse(res, {
        statusCode: 200,
        message: `Please go to your ${email} to complete your registration process`,
        payload: {token },
      });
    } catch (error) {
      next(error);
    }
  };
  
// active a user by receiving token
const activateUserAccount = async (req, res, next)=>{
    try {
        const token = req.body.token;
        if(!token) throw createError(404, 'token not found')

        try {
        const decoded = jwt.verify(token, jwtActivationKey)
        if(!decoded) throw createError(401, 'user unable to verified')
        const userExist = await User.exists({email: decoded.email})
        if(userExist){
            throw createError(409, 'User with this email is already exist, please sign in')
        }
        await User.create(decoded)
      
        return successResponse(res,{
            statusCode: 201,
            message: `user was registered successfully`, 
        })

        } catch (error) {
            if(error.name == 'TokenExpiredError'){
                throw createError(401, 'Token has expired')
            }
            else if(error.name == 'JsonWebTokenError'){
                throw createError(401, 'Invalid token')
            } else {
                throw error;
            }
        }
    } catch (error) {
        
        next(error)
    }
}
// update a user byId
const updateUserById = async (req, res, next)=>{
    try {
        const userId = req.params.id;
        
        const updatedUser = await updateSingleUserById(userId,req)

        return successResponse(res,{
            statusCode: 200,
            message: 'User updated successfully',
            payload: { updatedUser}
        
        })

    } catch (error) {
        
        next(error)
    }
}

// const handleBanUserById = async (req, res, next)=>{
//     try {
//         const userId = req.params.id;
        
//         await findUserById(User, userId)
//         const updates = { isBanned: true}
//         const updateOptions = {new: true, runValidators: true, context: 'query'};


//         const updatedUser = await User.findByIdAndUpdate(userId,updates, updateOptions).select('-password')

//         if(!updatedUser) {
//             throw createError(404, 'User does not update successfully')
//         }

//         return successResponse(res,{
//             statusCode: 200,
//             message: 'User has been banned successfully',
//             payload: { updatedUser}
        
//         })

//     } catch (error) {
        
//         next(error)
//     }
// }


const handleManageUserStatusById = async (req, res, next)=>{
    try {
        const userId = req.params.id;
        const action = req.body.action;
       
        const successMessage = await handleUserAction(userId, action)

        return successResponse(res,{
            statusCode: 200,
            message: successMessage,
            payload: {} 
        })

    } catch (error) {
        
        next(error)
    }
}
const handleUpdatePassword = async (req, res, next)=>{
    try {
        const {email, oldPassword, newPassword, confirmPassword} = req.body;
        const userId = req.params.id;

        const updateUser = await updateUserPasswordById(userId,email, oldPassword, newPassword, confirmPassword)

        return successResponse(res,{
            statusCode: 200,
            message: 'password updated successfully',
            payload: {updateUser} 
        })

    } catch (error) {
        
        next(error)
    }
}
const handleForgetPassword = async (req, res, next)=>{
    try {
        const {email} = req.body;
      
        const token =await forgetPasswordByEmail(email)
    
        return successResponse(res, {
          statusCode: 200,
          message: `Please go to your ${email} for reseting the password`,
          payload: {token },
        });
    } catch (error) {
        
        next(error)
    }
}
const handleResetPassword = async (req, res, next)=>{
    try {
       
        const {token, password} = req.body;
        const decoded = jwt.verify(token, jwtResetPasswordKey)
        if(!decoded) {
            throw createError(400, 'Invalid/Expired token')
        }

        const filter = {email: decoded.email}
        const updates = {password: password}
        const updateOptions = {new: true}
        const updateUser = await User.findOneAndUpdate(
            filter,
           updates, 
           updateOptions, 
       ).select('-password')

       if(!updateUser){
           throw createError(400, 'password reset failed')
       }

        return successResponse(res,{
            statusCode: 200,
            message: 'Password reset successfully',
            payload: { }   
        })

    } catch (error) {
        
        next(error)
    }
}


module.exports = {
    getUsers,
     getUser,
      deleteUser,
       processRegister,
        activateUserAccount,
         updateUserById,
          handleManageUserStatusById,
           handleUpdatePassword,
            handleForgetPassword,
             handleResetPassword,
        }   