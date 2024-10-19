import { useState, FormEvent } from 'react';
import axios from 'axios';

function App() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:3000/summarize', { url });
            const videoUrl = response.data.videoUrl;

            // Check if the URLs are valid before opening
            if (videoUrl) {
                console.log('Opening video URL:', videoUrl);
                openVideoInNewTab(videoUrl);
            } else {
                setError('No video URL received.');
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const message = err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : (err.response?.data?.error || 'Failed to generate the video.');
                setError(message);
            } else {
                setError('An unexpected error occurred.');
            }
            console.error('Error generating video:', err);
        } finally {
            setLoading(false);
        }
    };

    const openVideoInNewTab = (videoUrl: string) => {
        const newTab = window.open();
        if (newTab) {
            newTab.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Video Player</title>
                    <link href="https://vjs.zencdn.net/7.21.8/video-js.css" rel="stylesheet" />
                    <style>
                        body {
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background-color: black;
                        }
                        .video-js {
                            width: 100%;
                            max-width: 800px;
                        }
                    </style>
                </head>
                <body>
                    <video
                        id="my-video"
                        class="video-js"
                        controls
                        preload="auto"
                    >
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <script src="https://vjs.zencdn.net/7.21.8/video.min.js"></script>
                </body>
                </html>
            `);
            newTab.document.close();
        }
    };

    return (
        <>
            <div className={`relative ${loading ? 'blur-md' : ''}`}>
                <main className="max-w-full sm:max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 px-4">
                    <div className="py-8 flex flex-col justify-center w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold uppercase mb-6 text-center sm:text-left">
                            <span className="text-4xl sm:text-5xl">URL to Video</span>
                            <br />
                            <span className="bg-gradient-to-br from-green-300 from-30% to-yellow-500 bg-clip-text text-transparent">
                                with power of Gen AI
                            </span>
                        </h1>
                        <form className="grid gap-2 w-full" onSubmit={handleSubmit}>
                            <input
                                className="border-2 rounded-full bg-transparent text-white px-4 py-2 w-full"
                                type="url"
                                placeholder="https://"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                            <button
                                className={`bg-green-500 text-white px-4 py-2 rounded-full uppercase ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Video'}
                            </button>
                        </form>
                    </div>
                    <div className="py-4 w-full">
                        {error && (
                            <div className="bg-red-200 text-red-600 p-2 rounded-md mb-4">
                                <p>{error}</p>
                            </div>
                        )}
                        <div className="bg-gray-200 w-full sm:w-[240px] h-[380px] text-gray-500 rounded-2xl relative overflow-hidden">
                            {loading && <p className="text-center">Loading...</p>}
                            <video
                                className="rounded-2xl absolute top-0 left-0 w-full h-full"
                                autoPlay
                                muted
                                loop
                                style={{ objectFit: 'cover' }}
                            >
                                <source
                                    src="/invideo-ai-1080 SpaceX Sues California Over Launch Block 2024-10-17 (online-video-cutter.com).mp4"
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </main>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <p className="text-white text-lg sm:text-2xl">Loading...</p>
                </div>
            )}
        </>
    );
}

export default App;
