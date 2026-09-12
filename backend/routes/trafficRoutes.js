const express = require("express");

const {
    getTraffic,
    addTraffic
} = require("../controllers/trafficController");

const router = express.Router();

router.get("/", getTraffic);
router.post("/", addTraffic);

module.exports = router;