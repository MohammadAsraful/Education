const createError = require('http-errors')
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { successResponse } = require('./responseController');
const { findUserById } = require('../services/findUserById');
const { deleteImage } = require('../helper/deleteImage');
const { createJSONWebToken } = require('../helper/jsonwebtoken');
const { jwtActivationKey, clientUrl, defaultImagePath } = require('../secret');
const { emailWithNodeMailer } = require('../helper/email');
const {deleteOldImage } = require ('../helper/deleteImageHelper');
const { handleUserAction } = require('../services/userService');


// get all users
const getUsers = async (req, res, next)=>{
    try {
        // req.user.isAdmin;
        const search = req.query.search || "" ;
        const page = Number(req.query.page )|| 1 ;
        const limit = Number(req.query.limit) || 5 ;

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

        if(!users) {throw createError(404, 'no users found')}

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
        return successResponse(res,{
            statusCode: 200,
            message: 'Users were returned successfully',
            payload: {
                users,
            pagination: {
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                previousPage: page-1 > 0 ? page-1 : null,
                nextPage: page + 1 <= Math.ceil(count/limit) ? page + 1 : null,
                }
            }
        })

    } catch (error) {
        next(error)
    }
}

// get single user by id
const getUser = async (req, res, next)=>{
    try {
        console.log(req.user)
        const id = req.params.id;
        const options = {password: 0};
        const user = await findUserById(User, id, options)
      
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
const deleteUser = async (req, res, next)=>{
    try {
        const id = req.params.id;
        const options = {password: 0};
        const user = await findUserById(User, id, options)
// find solution tutorial 42 for remove userImagePath
        if (user && user.image) {
            const userImagePath = user.image;
           deleteImage(userImagePath)
          }

        await User.findByIdAndDelete({_id: id, 
            isAdmin: false,
        })
      
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

const updateUserById = async (req, res, next)=>{
    try {
        const userId = req.params.id;
        const options = {password: 0};
        const user = await findUserById(User, userId, options)
        const updateOptions = {new: true, runValidators: true, context: 'query'};
       
        let updates = {};

        for(let key in req.body){
            if(['name', 'phone','address','password'].includes(key)){
                updates[key] = req.body[key];
            }
        }

        const image = req.file.path;
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


module.exports = {
    getUsers,
     getUser,
      deleteUser,
       processRegister,
        activateUserAccount,
         updateUserById,
          handleManageUserStatusById
        }   