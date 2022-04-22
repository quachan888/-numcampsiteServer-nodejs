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
        Favorite.findOne({ user: req.user._id }).then((user) => {
            if (user) {
                req.body.forEach((campsiteId, index) => {
                    if (!user.campsites.includes(campsiteId._id)) {
                        user.campsites.push(campsiteId);
                    }
                });
                user.save()
                    .then((favorite) => res.status(200).json(favorite))
                    .catch((err) => next(err));
            } else {
                Favorite.create({
                    user: req.user._id,
                    campsites: req.body
                })
                    .then((favorite) => {
                        res.status(200).json(favorite);
                    })
                    .catch((err) => next(err));
            }
        });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
        Favorite.findOneAndDelete({ user: req.user._id })
            .then((response) => {
                if (response) {
                    res.status(200).json(response);
                } else {
                    res.end('You do not have any favorites to delete.');
                }
            })
            .catch((err) => next(err))
    )
    .put(cors.corsWithOptions, (req, res) => res.status(403).end(`PUT operation not supported on /favorites`));

favoriteRouter
    .route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id }).then((user) => {
            if (user) {
                if (!user.campsites.includes(req.params.campsiteId)) {
                    user.campsites.push(req.params.campsiteId);
                    user.save()
                        .then((favorite) => res.status(200).json(favorite))
                        .catch((err) => next(err));
                } else {
                    res.end('That campsite is already in the list of favorites!');
                }
            } else {
                Favorite.create({
                    user: req.user._id,
                    campsites: [req.params.campsiteId]
                })
                    .then((favorite) => {
                        res.status(200).json(favorite);
                    })
                    .catch((err) => next(err));
            }
        });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>
        Favorite.findOne({ user: req.user._id }).then((user) => {
            if (user) {
                if (user.campsites.includes(req.params.campsiteId)) {
                    user.campsites.splice(user.campsites.indexOf(req.params.campsiteId), 1);
                    user.save()
                        .then((favorite) => res.status(200).json(favorite))
                        .catch((err) => next(err));
                } else {
                    res.end(`There are no favorite for campsiteID: ${req.params.campsiteId} to delete`);
                }
            }
        })
    )
    .get(cors.cors, (req, res, next) => res.status(403).end(`GET operation not supported on /favorites`))
    .put(cors.cors, (req, res, next) => res.status(403).end(`PUT operation not supported on /favorites`));

module.exports = favoriteRouter;
