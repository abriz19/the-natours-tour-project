const crypto = require("crypto");
const validator = require("validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "enter your name please"],
    minlength: [5, "A name has to be atleast 5 characters long"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "please enter your email"],
    lowercase: true,
    validate: [validator.isEmail, "please provide a valid email"],
  },
  role: {
    type: String,
    default: "user",
    enum: {
      values: ["user", "guide", "lead-guide", "admin"],
      message:
        "A user role should be either: user, guide-tour, lead-guide or admin",
    },
  },
  photo: String,
  password: {
    type: String,
    required: [true, "A password is required"],
    minlength: [8, "A password should have atleast eight characters long"],
    select: false,
  },
  passwordConfirmation: {
    type: String,
    required: [true, "please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password; //this only works when we create or save a new user
      },
      message: "passwords are not the same",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  resetTokenExpiresAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 10000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", async function (next) {
  //run this function if the password is modified
  if (!this.isModified("password")) return next();

  // hash the password with the salt of 12
  this.password = await bcrypt.hash(this.password, 10);

  this.passwordConfirmation = undefined;
  next();
});

userSchema.methods.comparePassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedPasswordAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // true means the password was changed after the token was issued
    return JWTTimeStamp < changedPasswordAt;
  }

  return false;
};

userSchema.methods.forgotPasswordResetToken = function () {
  // 1, generate the random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // 2, hash the token and save it to the database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // 3, save the token expiry date to the database
  this.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.set("toJSON", { virtuals: false });
const User = mongoose.model("User", userSchema);
module.exports = User;
