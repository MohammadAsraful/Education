const createError = require('http-errors')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const User = require("../models/userModel");
const { deleteImage } = require('../helper/deleteImage');
const { deleteOldImage } = require('../helper/deleteImageHelper');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { emailWithNodeMailer } = require('../helper/email');
const { jwtResetPasswordKey, clientUrl } = require('../secret');


// service for GET all users
const findUsers = async(search, page, limit) => {
   try {
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');

    const filter = {
        isAdmin: {$ne: true},
        $or: [
            {name: {$regex: searchRegExp}},
            {email: {$regex: searchRegExp}},
            {phone: {$regex: searchRegExp}},
            {address: {$regex: searchRegExp}},
        ]
    }
    
    const options = {password: 0};

    const users = await User.find(filter, options)
    .limit(limit)
    .skip((page-1) * limit)

    const count = await User.find(filter).countDocuments();

    if(!users || users.length == 0) {throw createError(404, 'no users found')}

    return {
        users,
        pagination: {
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    previousPage: page-1 > 0 ? page-1 : null,
                    nextPage: page + 1 <= Math.ceil(count/limit) ? page + 1 : null,
                    }
    }
   } catch (error) {
     throw error;
   }

        // res.status(200).send({
        //     message:'Users were returned successfully',
        //     users,
        //     pagination: {
        //         totalPages: Math.ceil(count / limit),
        //         currentPage: page,
        //         previousPage: page-1 > 0 ? page-1 : null,
        //         nextPage: page + 1 <= Math.ceil(count/limit) ? page + 1 : null,
        //     }
        // })
        // return successResponse(res,{
        //     statusCode: 200,
        //     message: 'Users were returned successfully',
        //     payload: {
        //         users,
        //     pagination: {
        //         totalPages: Math.ceil(count / limit),
        //         currentPage: page,
        //         previousPage: page-1 > 0 ? page-1 : null,
        //         nextPage: page + 1 <= Math.ceil(count/limit) ? page + 1 : null,
        //         }
        //     }
        // })
}

const findSingleUserById = async (id, options={}) => {
    try {
        const user = await User.findById(id, options);
        if(!user){
            throw createError(404, 'User not found')
        }
        return user;
    } catch (error) {
        throw error;
    }
}

const deleteSingleUserById = async (id, options={}) => {
    try {
       
        const user = await User.findByIdAndDelete({_id: id,          
            isAdmin: false,
        })

        if (user && user.image) {
            await deleteImage(user.image);
          }

          return user;
    } catch (error) {
        throw error;
    }
}
const updateSingleUserById = async (userId, req) => {
    try {
        const options = {password: 0};
        const user = await findSingleUserById(userId, options)
        const updateOptions = {new: true, runValidators: true, context: 'query'};
       
        let updates = {};

        for(let key in req.body){
            if(['name', 'phone','address','password'].includes(key)){
                updates[key] = req.body[key];
            }
        }

        const image = req.file?.path;
        if (image) {
            if(image.size > 1024 * 1024 * 2){
                throw new Error('file is too large, it must be less than 2 mb')
            }
            // updates.image = image.buffer.toString('base64')
            updates.image = image;
            user.image !== 'default.png' && deleteOldImage(user.image)
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, updateOptions).select('-password')

        if(!updatedUser) {
            throw createError(404, 'User does not exist with this Id')
        }
        return updatedUser;
    } catch (error) {
        if(error instanceof mongoose.Error.CastError){
            throw createError(400, 'Invalid ID')
        }
        throw error;
    }
}
const updateUserPasswordById = async (userId,email, oldPassword, newPassword, confirmPassword ) => {
    try {
        // check isUser exist
        const user = await User.findOne({email})

        if(newPassword !== confirmPassword){
            throw createError(400, 'your confirm password did not match')
        }

         //comapre the password
         const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
         if(!isPasswordMatch) {
             throw createError(400, 'Old password is not correct')
         }
         if(!user){
            throw createError(404, 'user does not found with this email')
        }


         // update the password
        
         const updates = {$set:{password: newPassword}}
         const updateOptions = {new: true}
         const updateUser = await User.findByIdAndUpdate(
            userId,
            updates, // or {password: newPassword}
            updateOptions, // or {new: true}
        ).select('-password')

        if(!updateUser){
            throw createError(400, 'user not updated successfully')
        }

        return updateUser;
 
    } catch (error) {
        if(error instanceof mongoose.Error.CastError){
            throw createError(400, 'Invalid ID')
        }
        throw error;
    }
}
const forgetPasswordByEmail = async (email ) => {
    try {
        const userData = await User.findOne({email: email})
        if(!userData) {
            throw createError(404, 'Email is incorrect')
        }

        // create token with jwt
        const token = createJSONWebToken({email}, jwtResetPasswordKey, '10m');
    
        // Prepare email
        const emailData = {
          email,
          subject: 'Reset password Email',
          html: `
            <h2>Hello ${userData.name}!</h2>
            <p>Please click here to 
            <a href="${clientUrl}/api/users/reset-password/${token}" target="_blank">Reset your password</a></p>
          `,
        };
    
        // Send email with nodemailer
        try {
          await emailWithNodeMailer(emailData);
        } catch (emailError) {
          next(createError(500, 'Failed to send reset password email'));
          return;
        }

        return token;
 
    } catch (error) {
        
        throw error;
    }
}
const resetPasswordByEmail = async (token, password ) => {
    try {
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
 
    } catch (error) {
        
        throw error;
    }
}




const handleUserAction =async (userId, action) =>{
    try {
        let updates;
        let successMessage;
        if(action == 'ban'){
            updates = {isBanned: true}
            successMessage = 'User was banned successfully'
        }
        else if(action == 'unban'){
            updates = {isBanned: false}
            successMessage = 'User was unbanned successfully'
        }
        else{
            throw createError(400, 'Invalid action, use "ban" or "unban"')
        }

        const updateOptions = {new: true, runValidators: true, context: 'query'};


        const updatedUser = await User.findByIdAndUpdate(userId,updates, updateOptions).select('-password')

        if(!updatedUser) {
            throw createError(404, 'User does not update successfully')
        }
        return successMessage;
    } catch (error) {
        throw (error)
    }
}

module.exports = {handleUserAction, findUsers, findSingleUserById, deleteSingleUserById, updateSingleUserById, updateUserPasswordById, forgetPasswordByEmail, resetPasswordByEmail};