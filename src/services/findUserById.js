const createError = require('http-errors');
const mongoose = require('mongoose');

const findUserById = async (Model, id, options = {}) => {
  try {
    const item = await Model.findById(id, options);
    if (!item) {
      throw createError(404, `${Model.modelName} does not exist with this ID`);
    }
    return item;
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      throw createError(400, 'Invalid item ID');
    }
    throw error;
  }
};

module.exports = { findUserById };
