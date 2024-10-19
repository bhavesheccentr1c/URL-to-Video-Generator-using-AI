import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import the cors middleware
import path from 'path';
import summarizeURL from './summarization.js';
import { createVideo } from './videoGenerator.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('output'));
const outputDirectory = path.join(__dirname, 'output');
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
}

const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
// Endpoint to summarize the URL and create a video
app.post('/summarize', async (req, res) => {
    const { url } = req.body;
    console.log("Processing URL: ", url)
    if (!url) {
        return res.status(400).json({ error: 'A valid URL is required' });
    }

    try {
        const { summary, audioFilePath, srtFilePath, imageUrl } = await summarizeURL(url);
        const outputFilePath = path.join(outputDirectory, 'output_video.mp4');
        await createVideo(audioFilePath, imageUrl, srtFilePath, outputFilePath);
        console.log("Video created .");
       res.json({ videoUrl: `${baseUrl}/output/output_video.mp4` });
    } catch (error) {
        console.error('Error processing request:', error.message || error);
        res.status(500).json({ error: 'Failed to generate the video.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
