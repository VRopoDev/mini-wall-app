const bcrypt = require("bcryptjs");
const { generateAuthToken, destroyToken } = require("../middleware/auth");
const { deleteAllUserData } = require("../helpers/handleUserData");

const {
  userValidation,
  loginValidation,
  objectIdValidation,
} = require("../helpers/validate");

const User = require("../models/User");

/**
 *  Heleper function to encrypt a password.
 * @param {String} psw the password to encypt
 * @returns validation the hashed password.
 */
async function encrypt(psw) {
  const salt = await bcrypt.genSalt(5);
  const hashed = await bcrypt.hash(psw, salt);
  return hashed;
}

/**
 *  Heleper function to decrypt password and validate.
 * @param {String} psw the input password to test
 * @param {String} epsw stored hashed password
 * @returns true if valid password false otherwise.
 */
async function decrypt(psw, epsw) {
  const valid = await bcrypt.compare(psw, epsw);
  return valid;
}

/**
 * (CREATE OPERATION)
 * Middleware to register a new user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or saved user
 */
module.exports.userRegister = async (req, res) => {
  const { username, password } = req.body;
  const email = req.body.email?.toLowerCase();

  // Validate input date for user registration
  const { error } = userValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Validate if user already exists or username is taken.
  const userExists = await User.findOne({
    $or: [{ email: email, username: username }],
  });

  if (userExists) {
    if (userExists.username === username) {
      return res.status(400).send({ message: "Username already taken!" });
    }
    return res.status(400).send({ message: "User already exists!" });
  }

  // Encrypt the password for the database and save new user.
  const hashedPass = await encrypt(password);

  const user = new User(req.body);

  user.password = hashedPass;

  try {
    const newUser = await user.save();
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to login a user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or a signed oauth2 token.
 */
module.exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validate input data for user login.
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Validate if user exists in the database.
  const userExists = await User.findOne({ email: email });

  if (!userExists) {
    return res.status(400).send({ message: "User not found!" });
  }

  // Validate if decrypted password matches the input.
  const validPass = await decrypt(password, userExists.password);

  if (!validPass) {
    return res.status(400).send({ message: "Email or password is wrong!" });
  }

  // Sign a token and log the user in.
  token = generateAuthToken(userExists);

  res
    .header("auth-token", token)
    .send({ message: "You have been successfully logged in!" });
};

/**
 * (UPDATE OPERATION)
 * Middleware to refresh a user's token.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or a signed oauth2 token.
 */
module.exports.reAuthUser = async (req, res) => {
  // Validate if user exists in the database.
  const userExists = await User.findOne({ _id: req.params.userId });

  if (!userExists) {
    return res.status(400).send({ message: "User not found!" });
  }

  // Sign a token and log the user in.
  token = generateAuthToken(userExists);

  res.header("auth-token", token).send({ message: "New token generated!" });
};

/**
 * (UPDATE OPERATION)
 * Middleware to logout a user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or a success message.
 */
module.exports.userLogout = async (req, res) => {
  try {
    // Validate userId
    const validId = objectIdValidation(req.params.userId);
    if (!validId) {
      return res.status(400).send({ message: "Not valid userId!" });
    }

    // Validate if user found.
    const user = await User.findById(req.params.userId);
    if (!user || user._id.toString() !== req.header("user")) {
      return res.status(400).send({ message: "User not found!" });
    }

    // Logout the user
    const logoutMsg = destroyToken(req.header("auth-token"));
    if (logoutMsg.error) {
      return res.status(400).send({ error: logoutMsg.error });
    }
    res.send({ message: logoutMsg.message });
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (READ OPERATION)
 * Middleware to get all users (possible admin level).
 * @param {*} req the request
 * @param {*} res the response
 */
module.exports.getAll = async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (READ OPERATION)
 * Middleware to get a user by id.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the queried user.
 */
module.exports.getUser = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.params.userId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(400)
        .send({ message: "No user found with the queried id!" });
    }
    res.send(user);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (READ OPERATION)
 * Middleware to get a password reset link.
 * NB. The link is returned as no email server yet.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the reset link (normally will just return a message).
 */
module.exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // For security we return a 200 status to not inform that the email was incorect.
      // The front-end could say something like: if the email exists we will email you the link.
      return res.status(200).send({ message: "No email to send" });
    }
    const resetLink = `http://localhost:8080/api/user/${user._id}/reset-pass/${process.env.RESET_SECRET}`;
    res.send({ link: resetLink });
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to update a users data.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the updated user.
 */
module.exports.updateUser = async (req, res) => {
  // Validate if there are values to update
  if (!req.body) {
    return res.status(400).send({ message: "No values to update!" });
  }
  // Validate userId
  const validId = objectIdValidation(req.params.userId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }

  // Validate if user making the request is the one to delete.
  let user = await User.findById(req.params.userId)
    .select({
      _id: 1,
      firstname: 1,
      lastname: 1,
      username: 1,
      email: 1,
      password: 1,
    })
    .lean()
    .exec();

  if (!user || user._id.toString() !== req.header("user")) {
    return res.status(400).send({ message: "User not found!" });
  }

  // Validate user data
  let encryptFlag = req.body.password ? true : false;
  for (const [key, value] of Object.entries(req.body)) {
    user[key] = value;
  }
  delete user._id; // delete the _id for validation of data
  const { error } = userValidation(user);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Encrypt the new password before saving.
  if (encryptFlag) {
    user.password = await encrypt(user.password);
  }

  // Update the user in the database
  try {
    const updatedUser = await User.updateOne(
      { _id: req.params.userId },
      {
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        password: user.password,
      }
    );
    res.send(updatedUser);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (UPDATE OPERATION)
 * Middleware to update a users password without login.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the updated user.
 */
module.exports.updateUserPass = async (req, res) => {
  // Validate if there are values to update
  if (!req.body) {
    return res.status(400).send({ message: "No values to update!" });
  }
  // Validate userId
  const validId = objectIdValidation(req.params.userId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }

  // Validate if user making the request is the one to delete.
  let user = await User.findById(req.params.userId)
    .select({
      _id: 1,
      firstname: 1,
      lastname: 1,
      username: 1,
      email: 1,
      password: 1,
    })
    .lean()
    .exec();

  if (!user) {
    return res.status(400).send({ message: "User not found!" });
  }

  // Validate user data
  user.password = req.body.password;
  delete user._id; // delete the _id for validation of data
  const { error } = userValidation(user);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Encrypt the new password before saving.
  user.password = await encrypt(user.password);

  // Update the user's password in the database
  try {
    const updatedUser = await User.updateOne(
      { _id: req.params.userId },
      {
        password: user.password,
      }
    );
    res.send(updatedUser);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

/**
 * (DELETE OPERATION)
 * Middleware to delete a user.
 * @param {*} req the request
 * @param {*} res the response
 * @returns validation errors or the deleted user.
 */
module.exports.deleteUser = async (req, res) => {
  // Validate userId
  const validId = objectIdValidation(req.params.userId);
  if (!validId) {
    return res.status(400).send({ message: "Not valid userId!" });
  }

  // Validate if user making the call is the one to delete.
  const user = await User.findById(req.params.userId);
  if (!user || user._id.toString() !== req.header("user")) {
    return res.status(400).send({ message: "User not found!" });
  }

  // Delete the user from the database.
  try {
    const deletedUser = await User.deleteOne({ _id: req.params.userId });
    // Trigger an asynchronous operation to delete data related to user.
    deleteAllUserData(req.params.userId);

    res.send(deletedUser);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};
