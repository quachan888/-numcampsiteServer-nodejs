const express = require('express');
const Favorite = require('../models/favorites');
const Campsite = require('../models/campsite');
const User = require('../models/user');

const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter
    .route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then((favorite) => res.status(200).json(favorite))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        // Check bằng findONe
        // Then, check xem trong body có campsiteID nào có rồi ko?
        // Nếu có rồi thì chỉ add mấy cái chưa có
        // Nếu không có cái nào hết? thì tạo favorite mới

        Favorite.findOne({ user: req.user._id }).then((user) => {
            if (user) {
                console.log('USer HERE====', user);

                res.status(200).json({ User: user });
            } else {
                console.log('USer POST LUON====', user);
                req.body.user = req.user._id;

                Favorite.create({
                    user: req.user._id,
                    campsites: req.body
                }).then((favorite) => {
                    res.status(200).json(favorite);
                });
            }

            // if (campsite) {
            //     req.body.author = req.user._id;
            //     campsite.comments.push(req.body);
            //     campsite
            //         .save()
            //         .then((campsite) => res.status(200).json(campsite))
            //         .catch((err) => next(err));
            // } else {
            //     const err = new Error(`Campsite ${req.params.campsiteId} not found`);
            //     err.status = 400;
            //     return next(err);
            // }
        });
        // Favorite.create(req.body)
        //     .then((favorite) => res.status(200).json(favorite))
        //     .catch((err) => next(err))
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
        res.status(403).end(`PUT operation not supported on /favorites`)
    )
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
        Favorite.deleteMany()
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

favoriteRouter
    .route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => res.status(403).end(`GET operation not supported on /favorites`))
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
        res.status(403).end(`PUT operation not supported on /favorites`)
    )
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
        res.status(403).end(`PUT operation not supported on /favorites`)
    )
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
        Favorite.findByIdAndDelete(req.params.campsiteId)
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err))
    );

module.exports = favoriteRouter;
