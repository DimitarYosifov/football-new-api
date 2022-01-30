const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const router = express.Router();
const app = express();
const bcrypt = require('bcryptjs');
const firebase = require("firebase/app");
require('firebase/auth');
require('firebase/database');
let port = process.env.PORT || 8000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const config_firebase = {
    apiKey: 'AIzaSyB6CoLU9BDQyk998IlqyIY7cVwSR-fvsSw',
    authDomain: 'football-d4256.firebaseapp.com',
    databaseURL: 'football-d4256.firebaseio.com',
    storageBucket: 'football-d4256.appspot.com'
};
app.listen(port, function () { console.log(`app started on port: ${port}`);});

firebase.initializeApp(config_firebase);

app.get('/test', function (req, res, next) {
    res.send('APIworks');
});

app.get('/getAllClubsData', async (req, res) => {
    firebase.database().ref("/clubs/").once('value').then(function (snapshot) {
        res.set('Content-Type', 'application/json');
        res.status(200);
        res.json({
            clubs: Object.values(snapshot.val())
        });
    });
});

