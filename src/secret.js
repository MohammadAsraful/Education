require('dotenv').config()



const serverPort = process.env.SERVER_PORT || 3002;

const mongoDBURL = process.env.MONGODB_ATLAS_URL || "mongodb://localhost:27017/education";

const defaultImagePath = process.env.DEFAULT_USER_IMAGE_PATH || 'public/images/users/default.png'

const jwtActivationKey = process.env.JWT_ACTIVATION_KEY || jkfhgutyriecmvghfkihjdkdfj;
const jwtAccessKey = process.env.JWT_ACCESS_KEY || 'AKFDHFGDJDSHFJDJSDKSJHFF';
const jwtResetPasswordKey = process.env.JWT_RESET_PASSWORD_KEY || 'sdjhsdfgkjhdglkjsdfgjjlk^$$@$@*$&MVNB';

const smtpUsername = process.env.SMTP_USERNAME || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const clientUrl = process.env.CLIENT_URL || '';
const uploadDir = process.env.UPLOAD_FILE || 'public/images/users';




module.exports = {serverPort, mongoDBURL, defaultImagePath, jwtActivationKey, smtpPassword, smtpUsername, clientUrl, uploadDir,jwtAccessKey,jwtResetPasswordKey }