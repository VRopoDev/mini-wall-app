const mongoose = require("mongoose");

const {
  postValidation,
  commentValidation,
  objectIdValidation,
  userInteractionValidation,
} = require("../helpers/validate");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

/**
 * (READ OPERATION)
 * Middleware to return all posts
 * sorted by likes and timestaps.
 * @param {*} req the request
 * @param {*} res the response
 */
module.exports.getWall = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort([
        ["likes", -1],
        ["createdAt", 1],
      ])
      .populate("likes", "username")
      .populate({
        path: "comments",
        model: "Comment",
        select: { _id: 1, owner: 1, description: 1 },
        populate: {
          path: "owner",
          model: "User",
          select: { _id: 1, username: 1 },
        },
      });
    res.send(posts);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (READ OPERATION)
 * Middleware to return one post by Id.
 * @param {*} req the request
 * @param {*} res the response
 */
module.exports.getPostById = async (req, res) => {
  // Validate postId
  const validId = objectIdValidation(req.params.postId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  try {
    const post = await Post.findById(req.params.postId)
      .populate("likes", "username")
      .populate({
        path: "comments",
        model: "Comment",
        select: { _id: 1, owner: 1, description: 1 },
        populate: {
          path: "owner",
          model: "User",
          select: { _id: 1, username: 1 },
        },
      });
    res.send(post);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (READ OPERATION)
 * Middleware to return posts of a user sorted by likes and timestaps.
 * @param {*} req the request
 * @param {*} res the response
 */
module.exports.getUserPosts = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.params.userId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  try {
    const posts = await Post.find({ owner: req.params.userId })
      .sort([
        ["likes", -1],
        ["createdAt", 1],
      ])
      .populate("likes", "username")
      .populate({
        path: "comments",
        model: "Comment",
        select: { _id: 1, owner: 1, description: 1 },
        populate: {
          path: "owner",
          model: "User",
          select: { _id: 1, username: 1 },
        },
      });
    res.send(posts);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (CREATE OPERATION)
 * Middleware to create a new post.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the new post.
 */
module.exports.newPost = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Validate post data
  let data = req.body;
  data.owner = req.header("user");
  const { error } = postValidation(data);

  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Create the new post in the database
  try {
    const post = new Post({
      owner: mongoose.Types.ObjectId(req.header("user")),
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      likes: [],
      comments: [],
    });
    const newPost = await post.save();
    res.send(newPost);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to edit a post owned by the user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the edited post.
 */
module.exports.editPost = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }

  // Validate post data
  const { error } = postValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Validate that post exists in the database
  const postExists = await Post.findById(req.params.postId);
  if (!postExists) {
    return res.status(400).send({ message: "Post not found!" });
  }

  // Validate if user is the owner of the post
  if (req.header("user") !== postExists.owner.toString()) {
    return res
      .status(401)
      .send({ message: "You are not the owner of the post!" });
  }

  // Update the post
  try {
    const updatedPost = await Post.updateOne(
      { _id: req.params.postId },
      {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
      }
    );
    res.send(updatedPost);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (DELETE OPERATION)
 * Middleware to delete a post owned by the user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the deleted post.
 */
module.exports.deletePost = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }

  // Validate that post exists in the database
  const postExists = await Post.findById(req.params.postId);
  if (!postExists) {
    return res.status(400).send({ message: "Post not found!" });
  }

  // Validate if user is the owner of the post
  if (req.header("user") !== postExists.owner.toString()) {
    return res
      .status(401)
      .send({ message: "You are not the owner of the post!" });
  }

  // Delete the post in the database
  try {
    const deletedPost = await Post.deleteOne({ _id: req.params.postId });
    res.send(deletedPost);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to update a post and include a user's "like" reaction.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the updated post.
 */
module.exports.likePost = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Validate if user can interact with the post
  let { allow, allowMessage } = await userInteractionValidation(
    req.params.postId,
    req.header("user"),
    "like"
  );
  if (!allow) {
    return res.status(400).send({
      message: allowMessage ? allowMessage : "You cant like your own posts!",
    });
  }

  // Update post to include the like
  try {
    const post = await Post.updateOne(
      { _id: req.params.postId },
      {
        $push: { likes: [mongoose.Types.ObjectId(req.header("user"))] },
      }
    );
    res.send(post);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to update a post and remove a user's "like" reaction.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the update post.
 */
module.exports.unlikePost = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Find the like in the post likes array and remove it
  const post = await Post.findById(req.params.postId).lean().exec();
  let newLikes = post.likes.filter((l) => {
    l.toString() !== req.header("user");
  });

  // No need to make a database call if no like found.
  if (post.likes.length === newLikes.length) {
    return res
      .status(400)
      .send({ message: "Post not liked from the user yet" });
  }

  // update the post with the new likes array
  try {
    const updatedPost = await Post.updateOne(
      { _id: req.params.postId },
      {
        likes: newLikes,
      }
    );
    res.send(updatedPost);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (CREATE & UPDATE OPERATION)
 * Middleware to create a user's comment and update a post
 * with the link to the comment.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the created comment and update post.
 */
module.exports.addComment = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Validate if user can interact with the post
  let { allow } = await userInteractionValidation(
    req.params.postId,
    req.header("user")
  );
  if (!allow) {
    return res
      .status(400)
      .send({ message: "You can't comment your own posts!" });
  }

  // Validate comment data
  let data = req.body;
  data.owner = req.header("user");
  const { error } = commentValidation(data);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Save new comment and link to post
  try {
    const comment = new Comment(data);
    const savedComment = await comment.save();
    const updatedPost = await Post.updateOne(
      { _id: req.params.postId },
      {
        $push: { comments: [mongoose.Types.ObjectId(savedComment._id)] },
      }
    );
    res.send({ post: updatedPost, comment: savedComment });
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to update a comment owned by the user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the update comment.
 */
module.exports.editComment = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Validate if user is the owner of the comment
  const comment = await Comment.findById(req.params.commentId);
  if (!comment || comment.owner.toString() !== req.header("user")) {
    return res
      .status(400)
      .send({ message: "You are not the owner of the comment" });
  }

  // Validate comment data
  let data = req.body;
  data.owner = req.header("user");
  const { error } = commentValidation(data);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Update comment
  try {
    const updatedComment = await Comment.updateOne(
      { _id: req.params.commentId },
      { description: data.description }
    );
    res.send(updatedComment);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (DELETE & UPDATE OPERATION)
 * Middleware to delete a user's comment and update the linked post.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the deleted comment and updated post.
 */
module.exports.deleteComment = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.header("user"));
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId" });
  }

  // Validate if user is the owner of the comment
  const comment = await Comment.findById(req.params.commentId);
  if (!comment || comment.owner.toString() !== req.header("user")) {
    return res
      .status(400)
      .send({ message: "You are not the owner of the comment" });
  }

  // Find the like in the post likes array and remove it
  const post = await Post.findById(req.params.postId).lean().exec();
  let newComments = post.comments.filter((c) => {
    c.toString() !== req.params.commentId;
  });

  // No need to make a database call if no like found.
  if (post.comments.length === newComments.length) {
    return res
      .status(400)
      .send({ message: "Post not commented from the user yet" });
  }

  // Delete comment and remove link from posts
  try {
    const deleteComment = await Comment.deleteOne({
      _id: req.params.commentId,
    });
    const updatedPost = await Post.updateOne(
      { _id: req.params.postId },
      {
        comments: newComments,
      }
    );
    res.send({ deleted: deleteComment, updatedPost: updatedPost });
  } catch (err) {
    res.stauts(400).send({ error: err.toString() });
  }
};
