const Post = require("../models/Post");
const Comment = require("../models/Comment");

/**
 * Helper function to delete comments and likes
 * of a deleted user. Works asynchronsly so the
 * response of a request does not have to be delayed.
 * @param {String} userId the id of the deleted user.
 * @returns none
 */
module.exports.deleteAllUserData = async (userId) => {
  const commentsToDelete = await Comment.find({ owner: userId });
  commentsToDelete.forEach(async (c) => {
    await Post.updateMany({ $pull: { comments: c._id } });
  });
  await Post.updateMany({ $pull: { likes: userId } });
  await Post.deleteMany({ owner: userId });
  await Comment.deleteMany({ owner: userId });
  return;
};
