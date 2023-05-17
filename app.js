require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//passport 
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//mongoose connection 

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}


//Schema 
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: [String]
});

//plugins configuration
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);


passport.use(User.createStrategy());

//Work with all forms of auth instead of just local

passport.serializeUser((user, done) => {
  User.findById(user._id)
    .then( (foundUser) => {
      if (!foundUser) {
        throw new Error('User not found');
      }
      done(null, foundUser._id);
    })
    .catch(function (err) {
      done(err);
    });
});


passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      if (!user) {
        throw new Error('User not found');
      }
      done(null, user);
    })
    .catch(function (err) {
      done(err);
    });
});



//Passport-Google-oauth20


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/secrets',
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
  (accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
      return cb(err, user);
    });
  }
));

//Passport-Facebook

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets",
  profileFields: ['id', 'displayName', 'photos', 'email']

},
  (accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, (err, user) => {
      return cb(err, user);
    });
  }
));

app.get('/', (req, res) => {
  res.render('home');
});

//GOOGLE

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

//FACEBOOK

app.get('/auth/facebook',
  passport.authenticate('facebook',
    { authType: 'reauthenticate', scope: ['public_profile', 'email'] }));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

//Web routes


app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

//Publishi0gn secrets.

app.get('/secrets', (req, res) => {
  User.find({ 'secret': { $ne: null } })
    .then(foundUsers => {
      res.render('secrets', { userWithSecrets: foundUsers });
    })
    .catch((err) => {
      console.error(err);
    })
});

app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit');
  } else {
    res.redirect('/login');
  }
});

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id)
    .then(foundUser => {
      foundUser.secret = submittedSecret;
      foundUser.save()
        .then(res.redirect('/secrets'))
        .catch(err => {
          console.log(err);
        })
        .catch(err => {
          console.log(err);
        })
    })
});



app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});



app.post('/register', (req, res) => {
  User.register({ username: req.body.username }, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secrets');
      });
    }
  });
});

app.post('/login', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  passport.authenticate('local')(req, res, () => {
    req.logIn(user, (err) => {
      if (err) {
        console.log(err);
      }
    })
    res.redirect('/secrets')
  })
});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});