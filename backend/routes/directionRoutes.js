const express = require("express");

const {
    getDirection
} = require("../controllers/directionController");

const router = express.Router();

router.get("/", getDirection);

module.exports = router;