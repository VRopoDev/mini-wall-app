const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const {
  getWall,
  getPostById,
  getUserPosts,
  newPost,
  editPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  editComment,
  deleteComment,
} = require("../controllers/posts");

// GET API for fetching all posts sorted by most likes and chronologicaly.
router.get("/", authenticate, getWall);

// GET API for fetching a post by id.
router.get("/:postId", authenticate, getPostById);

// GET API for fetching posts by user id.
router.get("/user-posts/:userId", authenticate, getUserPosts);

// POST API for creating new post.
router.post("/new-post", authenticate, newPost);

// POST API for adding a like reaction to a post.
router.post("/like-post/:postId", authenticate, likePost);

// POST API for removing a like reaction from a post.
router.post("/unlike-post/:postId", authenticate, unlikePost);

// POST API for creating comment to a post.
router.post("/add-comment/:postId", authenticate, addComment);

// PATCH API for updating a post.
router.patch("/:postId", authenticate, editPost);

// PATCH API for updating a comment.
router.patch("/edit-comment/:postId/:commentId", authenticate, editComment);

// DELETE API for deleting a post.
router.delete("/:postId", authenticate, deletePost);

// DELETE API for deleting a comment.
router.delete(
  "/delete-comment/:postId/:commentId",
  authenticate,
  deleteComment
);

module.exports = router;
