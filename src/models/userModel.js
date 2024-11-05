const {Schema, model} = require('mongoose')
const bcrypt = require('bcryptjs');
const { defaultImagePath } = require('../secret');

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true,
        minLength: [3, 'Minimum length of the name should be 3'],
        maxLength: [31, 'Maximum length of the name should be 31'],
    },
    email: {
        type: String,
        required: [true, 'User email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
          validator: function(v) {
            return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
          },
          message: 'Please enter a valid email'
        }
      },
      password: {
        type: String,
        required: [true, 'User password is required'],
        minLength: [6, 'Minimum length of password should be 6'],
        set: (v) => bcrypt.hashSync(v, bcrypt.genSaltSync(10))
    },
    image: {
      // type: Buffer,
      // contentType: String,
      // required: [true, 'User image is required'],
      type: String,
      default: defaultImagePath,
    },

    address: {
      type: String,
      required: [true, 'User address is required'],
      minLength: [3, 'User address should be atleast 3 character'],
      trim: true,
  },
    phone: {
      type: String,
      required: [true, 'User phone is required'],
  },
    isAdmin: {
      type: Boolean,
      default: false
  },
    isBanned: {
      type: Boolean,
      default: false
  },

      
}, {timestamps: true});


const User = model('Users', userSchema);


module.exports = User;