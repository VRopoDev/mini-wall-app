const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 256,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 256,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 256,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      min: 6,
      max: 256,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      min: 6,
      max: 1024,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
