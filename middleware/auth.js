const jwt = require("jsonwebtoken");
require("dotenv/config");

/**
 * Middleware to verify if user is logedin with a valid auth2 token.
 * @param {*} req the request
 * @param {*} res the response
 * @param {*} next
 * @returns error message if no token or invalid.
 */
module.exports.authenticate = (req, res, next) => {
  const token = req.header("auth-token");

  if (!token) {
    return res.status(401).send({ message: "Access denied!" });
  }
  try {
    const authorized = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = authorized;
    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid token!" });
  }
};

/**
 * Middleware to sign an oauth2 token for a succefully loggedin user.
 * @param {Object} user the loggedin user
 * @returns the oauth2 token.
 */
module.exports.generateAuthToken = (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: "1h",
  });

  return token;
};

/**
 * Middleware to expire a token.
 * @param {JWT TOKEN} token the token to detroy
 * @return error or success message.
 */
module.exports.destroyToken = (token) => {
  const message = jwt.sign(token, "", { expiresIn: 1 }, (logout, err) => {
    if (logout) {
      return { message: "You have been successfully logged out!" };
    } else {
      return { error: "Error logging out!" };
    }
  });
  return message;
};
