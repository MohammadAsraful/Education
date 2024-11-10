const express = require('express');
const { getUsers, getUser, deleteUser, processRegister, activateUserAccount, updateUserById, handleManageUserStatusById, handleUpdatePassword, handleForgetPassword, handleResetPassword } = require('../controllers/userController');
const uploadUserImage = require('../middlewares/uploadFile');
const { runValidation } = require('../validator');
const { validateUserRegistration, validateUserPasswordUpdate, validateUserForgetPassword, validateUserResetPassword } = require('../validator/auth');
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
userRouter.put('/reset-password',validateUserResetPassword,runValidation, handleResetPassword)
userRouter.put('/:id',isLoggedIn, uploadUserImage.single('image'), updateUserById)
userRouter.put('/manage-user/:id',isLoggedIn, isAdmin, handleManageUserStatusById)
userRouter.put('/update-password/:id',validateUserPasswordUpdate,runValidation, isLoggedIn, handleUpdatePassword)
userRouter.post('/forget-password',validateUserForgetPassword,runValidation, handleForgetPassword)











 module.exports = userRouter;