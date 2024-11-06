URL to Video Generator (News-Specific)
This project is a URL to video generator that converts news articles into short videos using AI. It takes a news URL, generates a summarized version of the article, creates an image, and uses AI-powered text-to-speech (TTS) to produce a video with subtitles.

Features: 
Summarization: Extracts key points from a news article and condenses them into a brief summary.
Text-to-Speech: Converts the summarized content to audio using AI TTS.
Image Generation: Creates a background image related to the content.
Video Generation: Compiles the audio, image, and subtitles into a video format.
Subtitle Support: Adds subtitles synchronized with the audio.

Tech Stack: 
Backend: Node.js, Express.js, and FFmpeg for video processing.
APIs: Hugging Face for Summarization, Text-to-Speech (TTS), and Image Generation models.
Frontend: React, TypeScript.

Prerequisites: 
Node.js (v14+)
FFmpeg (Required for video processing)
