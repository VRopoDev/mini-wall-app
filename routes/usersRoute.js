const express = require("express");

const router = express.Router();

const {
  userRegister,
  userLogin,
  getAll,
  getUser,
  updateUser,
  deleteUser,
  userLogout,
  updateUserPass,
  forgotPassword,
  reAuthUser,
} = require("../controllers/users");
const { authenticate } = require("../middleware/auth");

// GET API to get all users (RBAC admin?)
router.get("/", authenticate, getAll);

// GET API to get a user by id.
router.get("/:userId", authenticate, getUser);

// POST API to register a new user.
router.post("/register", userRegister);

// POST API to login a user.
router.post("/login", userLogin);

// POST API to login a user.
router.post("/:userId/re-auth", reAuthUser);

// POST API to logout a user.
router.post("/:userId/logout", userLogout);

// GET API to get a user password reset link.
router.post("/forgot-password", forgotPassword);

// PATCH API to update a registered/loggedin user.
router.patch("/:userId", authenticate, updateUser);

// PATCH API to update a users password
router.patch(`/:userId/reset-pass/${process.env.RESET_SECRET}`, updateUserPass);

// DELETE API to delete a registered user and all posts, comments and likes.
router.delete("/:userId", authenticate, deleteUser);

module.exports = router;
