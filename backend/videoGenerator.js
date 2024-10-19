import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

// Set the path to FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

export const createVideo = (audioFilePath, imageFilePath, srtFilePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        // Check if input files exist
        if (!fs.existsSync(audioFilePath)) {
            return reject(new Error(`Audio file not found at path: ${audioFilePath}`));
        }
        if (!fs.existsSync(imageFilePath)) {
            return reject(new Error(`Image file not found at path: ${imageFilePath}`));
        }
        if (!fs.existsSync(srtFilePath)) {
            return reject(new Error(`SRT file not found at path: ${srtFilePath}`));
        }

        // Normalize and format paths for Windows
        const escapedOutputPath = path.resolve(outputFilePath).replace(/\\/g, '/');
        const escapedImagePath = path.resolve(imageFilePath).replace(/\\/g, '/');
        const escapedAudioPath = path.resolve(audioFilePath).replace(/\\/g, '/');

        // Escape the SRT path according to Windows requirements
        const escapedSrtPath = path.normalize(srtFilePath)
            .replace(/\\/g, '\\\\\\\\')  // Replace each backslash with four backslashes
            .replace(/:/g, '\\\\:');      // Replace colon with escaped colon

        console.log("final srt path: ", escapedSrtPath);

        // Start creating the video
        const ffmpegCommand = ffmpeg()
            .input(escapedImagePath)
            .loop() // Loop the image indefinitely until the audio ends
            .input(escapedAudioPath)
            .audioCodec('aac') // Set audio codec
            .videoCodec('libx264') // Set video codec
            .outputOptions('-tune', 'stillimage') // Tune for still images (optimization)
            .outputOptions('-vf', `subtitles=${escapedSrtPath}`) // Apply subtitles filter without quotes
            .outputOptions('-shortest') // Limit video duration to the shortest input (audio)
            .on('end', () => {
                console.log('Video created successfully:', escapedOutputPath);
                resolve(escapedOutputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error creating video:', err.message || err);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                reject(new Error(`FFmpeg error: ${stderr || stdout}`));
            });

        // Log the FFmpeg command for debugging
        console.log('FFmpeg command:', ffmpegCommand._getArguments().join(' '));

        // Save the video to the specified output path
        ffmpegCommand.save(escapedOutputPath);
    });
};
