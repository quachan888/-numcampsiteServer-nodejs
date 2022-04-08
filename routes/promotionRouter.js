const express = require('express');
const Promotion = require('../models/promotion');

const promotionRouter = express.Router();

promotionRouter
    .route('/')
    .get((req, res, next) => {
        Promotion.find()
            .then((promotions) => res.status(200).json(promotions))
            .catch((err) => next(err));
    })
    .post((req, res, next) => {
        Promotion.create(req.body)
            .then((promotion) => res.status(200).json(promotion))
            .catch((err) => next(err));
    })
    .put((req, res) => res.status(403).end(`PUT operation not supported on /promotions`))
    .delete((req, res, next) => {
        Promotion.deleteMany()
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err));
    });

promotionRouter
    .route('/:promotionId')
    .get((req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .then((promotion) => res.status(200).json(promotion))
            .catch((err) => next(err));
    })
    .post((req, res) => res.status(403).end(`POST operation not supported on /promotions/${req.params.promotionId}`))
    .put((req, res, next) => {
        Promotion.findByIdAndUpdate(req.params.promotionId, { $set: req.body }, { new: true })
            .then((promotion) => res.status(200).json(promotion))
            .catch((err) => next(err));
    })
    .delete((req, res, next) => {
        Promotion.findByIdAndDelete(req.params.promotionId)
            .then((response) => res.status(200).json(response))
            .catch((err) => next(err));
    });

module.exports = promotionRouter;
