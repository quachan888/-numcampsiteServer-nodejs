const express = require('express');
const User = require('../models/user');

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
    // check username is taken
    User.findOne({ username: req.body.username })
        .then((user) => {
            if (user) {
                const err = new Error(`User ${req.body.username} already exists!`);
                err.status = 403;
                return next(err);
            } else {
                User.create({
                    username: req.body.username,
                    password: req.body.password
                })
                    .then((user) => {
                        res.status(200).json({ status: 'Registration Succesful!', user: user });
                    })
                    .catch((err) => console.log(err));
            }
        })
        .catch((err) => console.log(err));
});

router.post('/login', (req, res, next) => {
    if (!req.session.user) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            const err = new Error('You are not authenticated!');
            err.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }

        const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');

        User.findOne({ username: username })
            .then((user) => {
                if (!user) {
                    const err = new Error(`User ${username} does not exist!`);
                    err.status = 401;
                    return next(err);
                } else if (user.password !== password) {
                    const err = new Error(`Your password is incorrect!`);
                    err.status = 401;
                    return next(err);
                } else if (user.username === username && user.password === password) {
                    req.session.user = 'authenticated';
                    res.status(200).send('You are authenticated!');
                }
            })
            .catch((err) => console.log(err));
    } else {
        res.status(200).end('You are already authenticated');
    }
});

router.get('/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

module.exports = router;
