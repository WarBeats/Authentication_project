require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

console.log(process.env.API_KEY);


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


//Schema plugin
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password']});

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
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  }, { versionKey: false });

  const userData =
    async () => {
      await newUser.save();
      console.log('Successfully registered ');
    };

  userData();

  res.render('secrets');

});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username })
    .then((foundUser) => {

      if (foundUser) {

        if (foundUser.password === password) {
          res.render('secrets');
        } else {
          res.send('wrong password');
        }
      } else {
        res.send('user not found');
      }
    })
    .catch((error => {
      console.log(error);
    }))
})




const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});