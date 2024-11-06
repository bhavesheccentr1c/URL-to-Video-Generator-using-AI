import axios from "axios";
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function truncateToCompleteSentence(content, maxWords) {
    const words = content.split(' ');
    if (words.length <= maxWords) return content; // No need to truncate

    // Find the index of the last complete sentence
    let lastIndex = -1;
    for (let i = 0; i < maxWords; i++) {
        if (/[.!?]$/.test(words[i])) {
            lastIndex = i; // Update lastIndex to the end of the sentence
        }
    }

    // Return the truncated content up to the last complete sentence
    return lastIndex !== -1 ? words.slice(0, lastIndex + 1).join(' ') : content;
}

// Function to summarize URL and generate TTS and image
async function summarizeURL(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;

        // Extract text from HTML
        const $ = cheerio.load(html);
        const content = $('p').map((_, p) => $(p).text()).get().join(' ').replace(/\s+/g, ' ').trim();
        
        // Truncate content if necessary
        const maxWords = 135;
        const truncatedContent = truncateToCompleteSentence(content, maxWords);

        // Call the Hugging Face TTS API
        const audioBuffer = await generateTTS(truncatedContent);
        const audioFilePath = path.join(__dirname, 'output', 'summary.wav');
        fs.writeFileSync(audioFilePath, Buffer.from(audioBuffer));

        // Generate image based on summary
        const imageUrl = await generateImage(truncatedContent);
        console.log("Generated Image URL:", imageUrl);

        const srtFilePath = path.join(__dirname, 'output', 'summary.srt');
        
        const audioDuration = (audioBuffer.byteLength / 2) / 16000; // Calculate duration
        console.log('Audio Duration:', audioDuration);
        
        generateSRT(truncatedContent, audioDuration, srtFilePath);
        console.log("SRT file saved successfully at: ", srtFilePath);
        return { summary: truncatedContent, audioFilePath, srtFilePath, imageUrl };
    } catch (error) {
        console.error("Error summarizing:", error.message || error);
        throw new Error('Failed to summarize the URL');
    }
}

// Function to generate TTS
async function generateTTS(text) {
    try {
        // Replace '.' and '?' with ',' to add a pause after every period and question mark
        const modifiedText = text.replace(/\./g, ', ,').replace(/\?/g, ', ,');

        if (typeof modifiedText !== 'string' || modifiedText.length === 0) {
            throw new Error('Input text for TTS is invalid');
        }

        const response = await fetch("https://api-inference.huggingface.co/models/facebook/fastspeech2-en-ljspeech", {
            headers: {
                Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: modifiedText }),
        });

        if (!response.ok) {
            const errorText = await response.text(); // Log the error response from the server
            throw new Error(`TTS API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        return audioBuffer; // Return audio data (WAV format)
    } catch (error) {
        console.error("Error generating TTS:", error.message);
        throw new Error('Failed to generate TTS');
    }
}

// Function to generate SRT
function generateSRT(summary, totalDuration, outputFilePath) {
    const words = summary.split(/\s+/).filter(Boolean); // Split the summary into words
    const charactersPerSecond = 15; // Average reading speed in characters per second
    const maxCharactersPerSubtitle = 60; // Maximum characters per subtitle for visual comfort
    let srtContent = '';
    let currentTime = 0;
    let i = 0; // Index for words
    let subtitleCount = 0; // Counter for subtitles

    // Generate subtitles
    for (; i < words.length;) {
        let subtitleWords = [];
        let currentCharCount = 0; // Reset for each subtitle

        // Collect words until we reach max characters or end of words array
        while (i < words.length && (currentCharCount + words[i].length + 1) <= maxCharactersPerSubtitle) {
            subtitleWords.push(words[i]);
            currentCharCount += words[i].length + 1; // Add 1 for the space
            i++;
        }

        const subtitleText = subtitleWords.join(' '); // Create subtitle text
        const durationPerSubtitle = Math.min(currentCharCount / charactersPerSecond, totalDuration - currentTime); // Calculate duration based on character count
        const start = new Date(currentTime * 1000).toISOString().substr(11, 8);
        const end = new Date((currentTime + durationPerSubtitle) * 1000).toISOString().substr(11, 8);

        // Add subtitle entry to SRT content
        subtitleCount++; // Increment subtitle counter
        srtContent += `${subtitleCount}\n${start},000 --> ${end},000\n${subtitleText}\n\n`;

        // Update current time for the next subtitle
        currentTime += durationPerSubtitle;

        // Check if current time exceeds total duration
        if (currentTime >= totalDuration) {
            break; // Exit if we've reached the total duration
        }
    }

    // Ensure the last subtitle ends at the total audio duration
    if (currentTime < totalDuration) {
        const lastStart = new Date(currentTime * 1000).toISOString().substr(11, 8); // Start from currentTime
        const lastEnd = new Date(totalDuration * 1000).toISOString().substr(11, 8); // End at totalDuration

        // Collect words for the last subtitle until a complete sentence is formed or until the end of words
        let lastSubtitleWords = [];
        while (i < words.length) {
            lastSubtitleWords.push(words[i]);

            // Check for sentence-ending punctuation
            if (/[.!?]$/.test(words[i])) {
                i++; // Move to the next word after punctuation
                break; // Stop if we reach the end of a sentence
            }
            i++; // Move to the next word
        }

        // Add the last subtitle if it forms a complete sentence
        if (lastSubtitleWords.length > 0) {
            const lastSubtitleText = lastSubtitleWords.join(' '); // Create subtitle text
            srtContent += `${++subtitleCount}\n${lastStart},000 --> ${lastEnd},000\n${lastSubtitleText}\n\n`;
        }
    }

    // Write the SRT content to the output file
    fs.writeFileSync(outputFilePath, srtContent);
    return outputFilePath;
}


// Function to generate image
async function generateImage(prompt) {
    try {
        const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
            headers: {
                Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            throw new Error(`Image Generation API Error: ${response.status} ${response.statusText}`);
        }

        // Save image locally in the 'output' folder
        const imageBuffer = await response.arrayBuffer(); // Get image in binary format
        const imageFileName = 'generated_image.png';
        const outputDirectory = path.join(__dirname, 'output');
        const imagePath = path.join(outputDirectory, imageFileName);

        // Ensure output directory exists
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }

        // Write the image file to the local filesystem
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

        console.log('Image generated and saved successfully:', imagePath);
        return imagePath; // Return local file path
    } catch (error) {
        console.error("Error generating image:", error.message);
        throw new Error('Failed to generate image');
    }
}

export default summarizeURL;