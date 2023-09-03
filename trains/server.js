const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const getAccessToken = async () => {
    try {
        const authData = {
            companyName: 'Midhun railway',
            clientID: '33a2b0c0-9c7d-46d8-8470-5516f2759e4c',
            ownerName: 'Midhun k Mohandas',
            ownerEmail: '124018035@sastra.ac.in',
            rollNo: '124018035',
            clientSecret: 'bQVdUBrRDNSuQIpF',
        };

        const response = await axios.post('http://20.244.56.144/train/auth', authData);
        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining access token:', error);
        throw error;
    }
};

app.get('/trains', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const now=new Date();

        const trainApiResponse = await axios.get('http://20.244.56.144/train/trains', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const trainData = trainApiResponse.data;
        console.log(accessToken);

        const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours in milliseconds

        const filteredTrains = trainData
            .filter((train) => {
                const departureTimeWithDelay = new Date(
                    now.getTime() +
                    train.delayedBy * 60 * 1000 + // Convert delay to milliseconds
                    train.departureTime.Hours * 60 * 60 * 1000 +
                    train.departureTime.Minutes * 60 * 1000 +
                    train.departureTime.Seconds * 1000
                );
                return departureTimeWithDelay <= twelveHoursLater;
            })
            .sort((a, b) => {
                if (a.price.sleeper === b.price.sleeper) {
                    if (a.price.AC === b.price.AC) {
                        if (a.seatsAvailable.sleeper === b.seatsAvailable.sleeper) {
                            const aDepartureTime = new Date(
                                now.getTime() +
                                a.delayedBy * 60 * 1000 +
                                a.departureTime.Hours * 60 * 60 * 1000 +
                                a.departureTime.Minutes * 60 * 1000 +
                                a.departureTime.Seconds * 1000
                            );
                            const bDepartureTime = new Date(
                                now.getTime() +
                                b.delayedBy * 60 * 1000 +
                                b.departureTime.Hours * 60 * 60 * 1000 +
                                b.departureTime.Minutes * 60 * 1000 +
                                b.departureTime.Seconds * 1000
                            );
                            return bDepartureTime - aDepartureTime;
                        } else {
                            return b.seatsAvailable.sleeper - a.seatsAvailable.sleeper;
                        }
                    } else {
                        return a.price.AC - b.price.AC;
                    }
                } else {
                    // Sort by sleeper price (ascending)
                    return a.price.sleeper - b.price.sleeper;
                }
            });

        res.json(filteredTrains);
    } catch (error) {
        console.error('Error fetching train data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/trains/:trainNumber', async (req, res) => {
    try {
        // Obtain the Bearer access token
        const accessToken = await getAccessToken();

        const { trainNumber } = req.params;

        const trainDetailResponse = await axios.get(`http://20.244.56.144/train/trains/${trainNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const trainDetail = trainDetailResponse.data;

        res.json(trainDetail);
    } catch (error) {
        console.error('Error fetching train detail:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
