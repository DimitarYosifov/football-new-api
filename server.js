
const { Server } = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcryptjs');
const firebase = require("firebase/app");
require('firebase/auth');
require('firebase/database');
const port = process.env.PORT || 9000;
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const config_firebase = {
    apiKey: 'AIzaSyB6CoLU9BDQyk998IlqyIY7cVwSR-fvsSw',
    authDomain: 'football-d4256.firebaseapp.com',
    databaseURL: 'football-d4256.firebaseio.com',
    storageBucket: 'football-d4256.appspot.com'
};
// app.listen(port, function () { console.log(`app started on port: ${port}`);});

firebase.initializeApp(config_firebase);

app.get('/test', function (req, res, next) {
    res.send('APIworks- connected to github');
});

app.post('/login', async (req, res) => {

    let user = req.body.user;
    let pass = req.body.pass;

    firebase.database().ref("/users/").orderByChild("name").equalTo(user).once('value').then(function (snapshot) {

        let db_pass;
        res.set('Content-Type', 'application/json');
        //        res.set( "Access-Control-Allow-Origin", "*",);
        try {
            db_pass = Object.values(snapshot.val())[0].password;
        } catch (e) { // no such user
            db_pass = null;
            res.status(200);
            res.json({
                authorized: false
            });
            //            res.send(`Not Allowed`);
            return;
        }

        bcrypt.compare(pass, db_pass, function (err, result) {
            if (err) {
                res.status(500);
                res.json({
                    authorized: false
                });
            } else if (!result) {
                res.status(200);
                res.json({
                    authorized: false
                });
            } else {
                res.status(200);
                res.json({
                    storageItem: db_pass,
                    authorized: true
                });
            }
        });
    });
});

app.post('/register', async (req, res) => {
    let user = req.body.user;
    let pass = req.body.pass;
    //    is name already taken
    firebase.database().ref("/users/").orderByChild("name").equalTo(user).once('value').then(function (snapshot) {
        let name;
        try {
            name = Object.values(snapshot.val())[0].name;
            res.status(200);
            res.json({
                authorized: false,
                nameInUse: true
            });
            return;
        } catch (e) {
            name = null;
            tryRegistration();
        }
    });
    let tryRegistration = async () => {
        try {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(pass, salt);
            res.set('Content-Type', 'application/json');
            firebase.database().ref('/users/' + user).set({
                name: user,
                password: hashedPassword
            }, function (error) {
                if (error) {
                    res.status(200);
                    res.json({
                        authorized: false
                    });
                } else {
                    res.status(200);
                    res.json({
                        storageItem: hashedPassword,
                        authorized: true
                    });
                }
            });
        } catch (e) {
            res.status(500).send("error_");
        }
    };
});

app.post('/fixtures', async (req, res) => {
    let seasonFixtures = req.body.seasonFixtures;
    let user = req.body.user;
    let playerClubData = req.body.playerClubData;
    let currentRound = req.body.currentRound;
    let teams = req.body.teams;
    let topScorers = req.body.topScorers;
    let mostYellowCards = req.body.mostYellowCards;
    let playerCash = req.body.playerCash;
    res.set('Content-Type', 'application/json');
    firebase.database().ref('/users/' + user + `/fixtures`).set({
        seasonFixtures: {
            seasonFixtures: seasonFixtures,
            currentRound: currentRound,
            playerClubData: playerClubData,
            teams: teams,
            topScorers: topScorers,
            mostYellowCards: mostYellowCards,
            playerCash: playerCash
        }
    }, function (error) {
        if (error) {
            res.status(200);
            res.json({
                ok: false
            });
        } else {
            res.status(200);
            res.json({
                ok: true
            });
        }
    });

});

app.post('/getFixtures', async (req, res) => {
    let user = req.body.user;
    firebase.database().ref("/users/" + user + "/fixtures").once('value').then(function (snapshot) {
        res.set('Content-Type', 'application/json');
        res.status(200);
        try {
            res.json({
                data: Object.values(snapshot.val())[0]
            });
        } catch {
            res.json({
                data: null
            });
        }
    });
});

app.post('/storageData', async (req, res) => {
    let data = req.body.data;
    firebase.database().ref("/users/").orderByChild("password").equalTo(data).once('value').then(function (snapshot) {
        res.set('Content-Type', 'application/json');
        res.status(200);
        res.json({
            authorized: Object.values(snapshot.val())[0].password !== undefined ? true : false
        });
    });
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

app.post('/addClub', async (req, res) => {
    let name = req.body.name;
    let clubData = req.body.clubData;
    let players = req.body.players;

    firebase.database().ref('/clubs/' + name).set({
        name: name,
        clubData: clubData,
        players: players
    }, function (error) {
        if (error) {
            res.set('Content-Type', 'application/json');
            res.status(500);
            res.json({
                success: false
            });
        } else {
            res.set('Content-Type', 'application/json');
            res.status(200);
            res.json({
                success: true,
            });
        }
    });
});

app.post('/getClubsPlayers', async (req, res) => {
    let name = req.body.name;
    firebase.database().ref("/clubs/").orderByChild("name").equalTo(name).once('value').then(function (snapshot) {
        res.status(200);
        res.json({
            clubData: Object.values(snapshot.val())[0]
        });
    })
});

app.post('/getClubData', async (req, res) => {
    let name = req.body.name;
    firebase.database().ref("/clubs/").orderByChild("name").equalTo(name).once('value').then(function (snapshot) {
        res.status(200);
        res.json({
            clubData: Object.values(snapshot.val())[0].clubData
        });
    });
});

app.post('/playersParams', async (req, res) => {
    let players = req.body.players;
    let user = req.body.user;
    firebase.database().ref('/users/' + user + '/lineUp/').set({
        players: players,
        user: user
    }, function (error) {
        if (error) {
            res.set('Content-Type', 'application/json');
            res.status(500);
            res.json({
                success: false
            });
        } else {
            res.set('Content-Type', 'application/json');
            res.status(200);
            res.json({
                success: true
            });
        }
    });
});

app.post('/getPlayerLineUp', async (req, res) => {
    let user = req.body.user;
    firebase.database().ref("/users/" + user + '/lineUp/').once('value').then(function (snapshot) {
        res.status(200);
        res.json({
            players: Object.values(snapshot.val())[0]
        });

    }), function (error) {
        console.log(error);
    }
});

app.post('/deleteProgress', async (req, res) => {
    let user = req.body.user;
    let a = firebase.database().ref('/users/' + user + `/fixtures`);
    a.remove()
});

signOutUser = function () {
    //    firebase.auth().signOut().then(function () {
    //        $scope.user = '';
    //        $scope.username = '';
    //        $scope.img = '';
    //        $state.go('home');
    //    }, function (error) {
    //        console.error('Sign Out Error', error);
    //    });
};
//authStateChange
user = function (callback) {
    firebase.auth().onAuthStateChanged(function (firebaseUser) {
        if (firebaseUser) {
            console.log(firebaseUser);
            let user = firebaseUser.uid;
            callback(user, firebaseUser.email)
        } else {
            callback(null, null)
        }
    });
};
const server = app.listen(port, function () {
    console.log('listening on port ', server.address().port);
});

/**
 * W E B   S O C K E T   P A R T
 */
const wss = new Server({ server });
let activeUsers = { users: {} };
let activeGames = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        /**
        * new user entered PvP room or
        * another user selected club
        */
        newUserOrClubSelectionChange = () => {
            let user = JSON.parse(message).user.user;
            let team = JSON.parse(message).user.team;
            let selectedSlot = JSON.parse(message).user.selectedSlot;
            let readyConfirmed = JSON.parse(message).user.readyConfirmed; // todo...
            let isHome = JSON.parse(message).user.isHome;

            if (!ws._sockname) {
                ws._sockname = user;
            }
            activeUsers.users[user] = {
                team: team,
                selectedSlot: selectedSlot,
                readyConfirmed: readyConfirmed,
                isHome: isHome,
                isPlaying: false
                // isInGameNow:false
            };
            wss.clients.forEach(client => {
                if (activeUsers.users[client._sockname].isPlaying === false) {
                    client.send(Buffer.from(JSON.stringify(activeUsers)));
                }
            });
            //check if two players confirmed to start game here...
            for (let index = 0; index < 8; index += 2) {
                let homeTeam = Object.keys(activeUsers.users).filter(u => activeUsers.users[u].selectedSlot === index)[0];
                let awayTeam = Object.keys(activeUsers.users).filter(u => activeUsers.users[u].selectedSlot === index + 1)[0];

                if (homeTeam && awayTeam) {
                    if (activeUsers.users[homeTeam].isPlaying || activeUsers.users[awayTeam].isPlaying) {
                        return;
                    }

                    let player1_WS = [...wss.clients].find(c => c._sockname === homeTeam);
                    let player2_WS = [...wss.clients].find(c => c._sockname === awayTeam);

                    const newGameID = `${homeTeam}/${awayTeam}`;
                    const club1 = activeUsers.users[homeTeam].team;
                    const club2 = activeUsers.users[awayTeam].team;

                    activeUsers.users[homeTeam].isPlaying = true;
                    activeUsers.users[awayTeam].isPlaying = true;

                    activeGames[newGameID] = true;

                    player1_WS.send(
                        Buffer.from(JSON.stringify({
                            newGame: {
                                id: newGameID,
                                isHome: true,
                                opponent: club2
                            }
                        })));
                    player2_WS.send(
                        Buffer.from(JSON.stringify({
                            newGame: {
                                id: newGameID,
                                isHome: false,
                                opponent: club1
                            }
                        })));
                }
            }
        }

        /**
         * host player created game grid and sends it to their opponent
         */
        hostPlayerCreatedGrid = () => {
            let grid = JSON.parse(message).grid;
            let opponentID = JSON.parse(message).opponentID;

            if (activeUsers.users[opponentID]) {
                let opponent = [...wss.clients].find(c => c._sockname === opponentID);
                opponent.send(
                    Buffer.from(JSON.stringify({
                        grid: grid
                    })));
            }
        }

        /**
         * whenever after a game is started one of the players lose focus on game
         * the other is notified in orfer to stop app.ticker
         */
        focusChange = () => {
            let focus = JSON.parse(message).appFocusedChanged.appFocused;
            let opponentID = JSON.parse(message).appFocusedChanged.opponentID;

            if (activeUsers.users[opponentID]) {
                let opponent = [...wss.clients].find(c => c._sockname === opponentID);
                opponent.send(
                    Buffer.from(JSON.stringify({
                        opponentFocusChanged: {
                            focus: focus
                        }
                    })));
            }
        }

        /**
         * when one player performs succesful blocks swap,
         * we send positions of the move to the other player
         */
        successfulMatch = () => {
            let moveData = JSON.parse(message).moveData;
            let opponentID = JSON.parse(message).opponentID;
            console.log(`matches =>> ${moveData}`);

            if (activeUsers.users[opponentID]) {
                let opponent = [...wss.clients].find(c => c._sockname === opponentID);
                opponent.send(
                    Buffer.from(JSON.stringify(
                        {
                            moveData: moveData
                        }
                    )));
            }
        }

        /**
         * after matching block one player creates new blocks,
         * here we send them to the other player
         */
        newBlocksCreated = () => {
            let newBlocks = JSON.parse(message).newBlocks;
            let opponentID = JSON.parse(message).opponentID;
            console.log(`newBlocks =>> ${newBlocks}`);

            if (activeUsers.users[opponentID]) {
                console.log("newblocks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                let opponent = [...wss.clients].find(c => c._sockname === opponentID);
                opponent.send(
                    Buffer.from(JSON.stringify(
                        {
                            newBlocks: newBlocks
                        }
                    )));
            }
        }

        if (JSON.parse(message).user) {
            newUserOrClubSelectionChange();
        }
        else if (JSON.parse(message).grid) {
            hostPlayerCreatedGrid();
        }
        else if (JSON.parse(message).appFocusedChanged) {
            focusChange();
        }
        else if (JSON.parse(message).moveData) {
            successfulMatch();
        }
        else if (JSON.parse(message).newBlocks) {
            newBlocksCreated();
        }
    });

    ws.on('error', (error) => {
        console.log('received: %s', error);
    });

    ws.on('close', () => {
        // IMPORTANT...
        // TODO - clear incomplete games, as well for client after game is finished!!!!!
        //todo - reset isPlaying property
        //todo - if is in active game - remove gameId from activeGames and send message "opponent left the game" to the other player
        delete activeUsers.users[ws._sockname];
        wss.clients.forEach(client => {
            client.send(Buffer.from(JSON.stringify(activeUsers)));
        });
        console.log(`Users online => ${JSON.stringify(activeUsers)}`);
        console.log(`${ws._sockname} LEFT!`);
    });
});

generateRandomColorBlock = () => {
    let x = Math.floor(Math.random() * 100) + 1;
    let a;
    switch (true) {
        //blocks - 18%       yellow card - 6%     red card- 2%      injury - 2%
        case x <= 18:
            a = "ball_blue";
            break;
        case (x > 18 && x <= 36):
            a = "ball_green";
            break;
        case x > 36 && x <= 54:
            a = "ball_purple";
            break;
        case x > 54 && x <= 72:
            a = "ball_red";
            break;
        case x > 72 && x <= 90:
            a = "ball_yellow";
            break;
        case x > 90 && x <= 96:
            a = "yellow_card";
            break;
        case x > 96 && x <= 98:
            a = "red_card";
            break;
        case x > 98 && x <= 100:
            a = "red_cross";
            break;
        default:
            a = "error";
            break;
    }
    return a;
}
