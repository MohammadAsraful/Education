const express = require('express');
const { getUsers, getUser, deleteUser, processRegister, activateUserAccount, updateUserById } = require('../controllers/userController');
const uploadUserImage = require('../middlewares/uploadFile');
const { runValidation } = require('../validator');
const { validateUserRegistration } = require('../validator/auth');
const { isLoggedIn, isLoggedOut, isAdmin } = require('../middlewares/auth');
const userRouter = express.Router()




// GET: api/ users
userRouter.get('/',isLoggedIn, isAdmin,  getUsers)
userRouter.post('/process-register',
               uploadUserImage.single('image'), 
               isLoggedOut,
               validateUserRegistration,
               runValidation, 
               processRegister)

     
userRouter.post('/activate',isLoggedOut, activateUserAccount)
userRouter.get('/:id',isLoggedIn,isAdmin, getUser)
userRouter.delete('/:id',isLoggedIn, deleteUser)
userRouter.put('/:id',uploadUserImage.single('image'),isLoggedIn, updateUserById)









 module.exports = userRouter;