require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//mongoose connection 

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
}

//Schema 
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


const User = new mongoose.model('User', userSchema);


app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
    }, { versionKey: false });
    const userData =
      async () => {
        await newUser.save();
        console.log('Successfully registered ');
      };

    userData();
    res.render('secrets');
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username })
    .then((foundUser) => {
      bcrypt.compare(password, foundUser.password, function (err, result) {
        if (result === true) {
          console.log('User found successfully');
          res.render('secrets');
        }
      });
    })
    .catch((error => {
      console.log(error);
    }))

});


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});