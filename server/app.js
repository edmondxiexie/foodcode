const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieSession = require('cookie-session');

const keys = require('./config/keys');

// Models
require('./models/User');
require('./models/Todo');
require('./models/Recipe');

// Routes
const recipeRoutes = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

mongoose.connect(keys.mongoURI).then(
  () => {
    console.log('Connected to MongoBD server.');
  },
  err => {
    console.log('Unable to connect to MongoDB server.');
    console.log('Error: ', err);
  }
);

app.use(bodyParser.json());

// app.use(
//   cookieSession({
//     maxAge: 30 * 24 * 60 * 60 * 1000,
//     keys: [keys.cookieKey]
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// API Routers
app.use('/api/recipe', recipeRoutes);
app.use('/api/auth', authRoutes);

if (process.env.NODE_ENV === 'production') {
  console.log(`****** NODE_ENV: ${process.env.NODE_ENV} ******`);
  // production assets
  // like main.js or main.css file
  app.use(express.static('../client/dist'));

  // index.html file if it doesn't recognize the route
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Listening on port ' + PORT));
