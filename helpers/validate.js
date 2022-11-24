const mongoose = require("mongoose");
const validator = require("joi");
validator.objectId = require("joi-objectid")(validator);

const Post = require("../models/Post");

/**
 * Helper function to validate users registration data.
 * @param {Object} data all user details
 * @returns true if valid data false otherwise with error message.
 */
const userValidation = (data) => {
  const schemaValidation = validator.object({
    username: validator.string().required().min(3).max(256),
    firstname: validator.string().required().min(3).max(256),
    lastname: validator.string().required().min(3).max(256),
    username: validator.string().required().min(3).max(256),
    email: validator.string().required().min(6).max(256).email(),
    password: validator.string().required().min(6).max(1024),
  });

  return schemaValidation.validate(data);
};

/**
 * Helper function to validate users login data.
 * @param {Object} data login data, email and password.
 * @returns true if valid data false otherwise with error message.
 */
const loginValidation = (data) => {
  const schemaValidation = validator.object({
    email: validator.string().required().min(6).max(256).email(),
    password: validator.string().required().min(6).max(1024),
  });

  return schemaValidation.validate(data);
};

/**
 * Helper function to validate a post's data.
 * @param {Object} data post data.
 * @returns true if valid data false otherwise with error message.
 */
const postValidation = (data) => {
  const schemaValidation = validator.object({
    owner: validator.objectId().required(),
    title: validator.string().required(),
    description: validator.string().required(),
    location: validator.string().required(),
    likes: validator.valid(),
    comments: validator.valid(),
  });

  return schemaValidation.validate(data);
};

/**
 * Helper function to validate a comment's data.
 * @param {Object} data comment data.
 * @returns true if valid data false otherwise with error message.
 */
const commentValidation = (data) => {
  const schemaValidation = validator.object({
    description: validator.string().required(),
    owner: validator.objectId().required(),
  });

  return schemaValidation.validate(data);
};

/**
 * Helper function to validate if a string is a valid
 * objectId for mongoose.
 * @param {String} id
 * @returns true if valid false otherwise.
 */
const objectIdValidation = (id) => {
  return mongoose.isValidObjectId(id);
};

/**
 * Helper function to validate if user is the owner of
 * the post or has already liked a post (mode = like).
 * @param {String} postId the id of the post
 * @param {String} user the id of the user
 * @param {String} mode default or like mode
 * @returns true if the user is allowed to like or comment a post
 *          false if the user is the owner of the post or already
 *          liked the post, hense not allowed.
 */
const userInteractionValidation = async (postId, user, mode) => {
  let allow = false;
  let allowMessage;
  const post = await Post.findById(postId);
  allow = post.owner.toString() !== user;
  if (mode === "like" && allow) {
    allow = !post.likes.includes(mongoose.Types.ObjectId(user));
    allowMessage = "You already liked this post";
  }
  return { allow: allow, allowMessage: allowMessage };
};

module.exports.userValidation = userValidation;
module.exports.loginValidation = loginValidation;
module.exports.postValidation = postValidation;
module.exports.commentValidation = commentValidation;
module.exports.objectIdValidation = objectIdValidation;
module.exports.userInteractionValidation = userInteractionValidation;
