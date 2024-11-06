const createHttpError = require("http-errors");
const User = require("../models/userModel");

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
            throw createHttpError(404, 'User does not update successfully')
        }
        return successMessage;
    } catch (error) {
        throw (error)
    }
}

module.exports = {handleUserAction};