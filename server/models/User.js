const mongoose = require('mongoose');
const validator = require('validator');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [
    {
      access: {
        type: String,
        require: true
      },
      token: {
        type: String,
        require: true
      }
    }
  ],
  user_id: {
    type: String,
    required: true
  },
  username: {
    type: String
  }
});

UserSchema.methods.generateAuthToken = function() {
  const user = this;
  const access = 'auth';
  const token = jwt
    .sign({ _id: user._id.toHexString(), access }, 'abc123')
    .toString();

  user.tokens = user.tokens.concat([
    {
      access,
      token
    }
  ]);

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = function(token) {
  const user = this;

  return user.update({
    $pull: {
      tokens: {
        token: token
      }
    }
  });
};

// Overwrite toJSON method
UserSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  const { _id, email } = userObject;

  return {
    _id,
    email
  };
};

UserSchema.statics.findByToken = function(token) {
  const User = this;
  let decoded;

  try {
    // Will throw an error
    decoded = jwt.verify(token, 'abc123');
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = function(email, password) {
  const User = this;

  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

UserSchema.pre('save', function(next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

mongoose.model('User', UserSchema);
