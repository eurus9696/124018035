const express = require('express');
const sqlite3 = require('sqlite3');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('train_schedule.db');

app.use(express.json());

// Route to fetch train schedules, seat availability, and pricing
app.get('/trains', async (req, res) => {
    try {
        // Fetch train data from your database
        const currentTime = new Date();
        const twelveHoursFromNow = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);

        const query = `
            SELECT *
            FROM trains
            WHERE departure_time >= ? AND departure_time <= ?
            ORDER BY ac_price ASC, sleeper_seats DESC, departure_time DESC;
        `;

        db.all(query, [currentTime, twelveHoursFromNow], (err, rows) => {
            if (err) {
                throw err;
            }

            // Send the filtered and sorted train data as the API response
            res.json(rows);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
