const {body} = require('express-validator')

// registration validation
const validateUserRegistration = [
    body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({min:3, max: 31})
    .withMessage('Name should be atleast 3-31 character long'),

    body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),

    body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({min:6})
    .withMessage('Password should be atleast 6 character long')
    .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .withMessage(
        'Password should be atleast one uppercase letter, one lowercase, one number, and one special character'),

    body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({min:3})
    .withMessage('Address should be atleast 3 character long'),

    body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
   
    body('image').optional().isString().withMessage('image is optional')

    // body('image')
    // .custom((value, {req})=>{
    //     if(!req.file || !req.file.buffer) {
    //         throw new Error('User image is required')
    //     }
    //     return true;
    // })
    // .withMessage('User image is required')
    
];

// signIn validation


module.exports = { validateUserRegistration}
