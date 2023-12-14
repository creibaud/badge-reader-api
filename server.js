const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error('MongoDB connection error:', err));

const rfidSchema = mongoose.Schema({uid: String});
const RFID = mongoose.model('RFID', rfidSchema);

const generateAccessToken = (username) => {
    return jwt.sign(username, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1800s' });
};

app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === process.env.USERNAME && password === process.env.PASSWORD) {
        const accessToken = generateAccessToken({ username: username });
        res.status(200).send({ accessToken: accessToken });
    } else {
        res.status(401).send("Invalid credentials");
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        res.status(401).send("Unauthorized");
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            res.status(403).send("Forbidden");
        }
        req.user = user;
        next();
    });
};

app.get('/', async (req, res) => {
    res.status(200).send("This is an API");
    console.log(process.env.USERNAME);
    console.log(process.env.PASSWORD);
});

app.post('/addRFID', authenticateToken, async (req, res) => {
    try {
        const rfid = new RFID({uid: req.body.uid});
        await rfid.save();
        res.status(200).send("RFID saved");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving RFID");
    }
});

app.get('/getRFID', authenticateToken, async (req, res) => {
    try {
        const rfids = await RFID.find();
        res.status(200).send(rfids);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving RFIDs");
    }
});

app.delete('/deleteRFID', authenticateToken, async (req, res) => {
    try {
        const uidToDelete = req.body.uid;
        const deletedRFID = await RFID.findOneAndDelete({ uid: uidToDelete });

        if (deletedRFID) {
            res.status(200).send("RFID deleted");
        } else {
            res.status(404).send("RFID not found");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting RFID");
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
