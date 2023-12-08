const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

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

app.post('/rfid', async (req, res) => {
    try {
        const rfid = new RFID({uid: req.body.uid});
        await rfid.save();
        res.status(200).send("RFID saved");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving RFID");
    }
});

app.get('/rfid', async (req, res) => {
    try {
        const rfids = await RFID.find();
        res.status(200).send(rfids);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving RFIDs");
    }
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
