
const fs = require('fs').promises;
const deleteOldImage = async(imagePath) =>{
    try {
        console.log('delete image');
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log('User image was deleted')
    } catch (error) {
        console.error('user image does not exist or could not be deleted')
        throw error;
    }
}


module.exports = {deleteOldImage};