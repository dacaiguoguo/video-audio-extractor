'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    ffmpegRef.current = new FFmpeg();
    load();
  }, []);

  const load = async () => {
    if (!ffmpegRef.current) return;
    setIsLoading(true);
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setIsReady(true);
    setIsLoading(false);
  };

  const convertToAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setMessage('开始转换...');
      setIsLoading(true);
      
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) return;
      const inputFileName = 'input.' + file.name.split('.').pop();
      const outputFileName = 'output.mp3';
      
      // Write the file to memory
      await ffmpeg.writeFile(inputFileName, await fetchFile(file));
      
      // Run the FFmpeg command
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // Disable video
        '-acodec', 'libmp3lame', // Use MP3 codec
        '-q:a', '2', // Quality (0-9, 0=best)
        outputFileName
      ]);
      
      // Read the result
      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage('Conversion completed!');
    } catch (error) {
      console.error(error);
      setMessage('Conversion failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      await convertToAudio({ target: { files: [file] } } as any);
    } else {
      setMessage('Please drop a video file');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header with Logo */}
      <header className="w-full px-6 py-4 absolute top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 8.96533C9.5 8.48805 9.5 8.24941 9.59974 8.11618C9.68666 8.00007 9.81971 7.92744 9.96438 7.9171C10.1304 7.90524 10.3311 8.03429 10.7326 8.29239L15.4532 11.3271C15.8016 11.5524 15.9758 11.665 16.0359 11.8053C16.0885 11.9277 16.0885 12.0723 16.0359 12.1947C15.9758 12.335 15.8016 12.4476 15.4532 12.6729L10.7326 15.7076C10.3311 15.9657 10.1304 16.0948 9.96438 16.0829C9.81971 16.0726 9.68666 15.9999 9.59974 15.8838C9.5 15.7506 9.5 15.512 9.5 15.0347V8.96533Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xl font-bold text-gray-800">AudioExtract</span>
          </div>
        </div>
      </header>

      {/* Hero Section with Background */}
      <div className="relative w-full h-screen flex items-center justify-center bg-pink-50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl px-6 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">Video Audio Extractor</h1>
          <p className="text-xl text-gray-600 mb-12">Extract audio from videos quickly and securely</p>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-12">
            {!isReady && (
              <button
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                onClick={load}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Load FFmpeg'
                )}
              </button>
            )}

            {isReady && (
              <div className="flex flex-col items-center gap-6">
                <label 
                  className="w-full cursor-pointer group"
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className={`border-2 border-dashed ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300'} group-hover:border-pink-500 rounded-lg p-8 text-center transition-all duration-200`}>
                    <div className="mb-4">
                      <svg className={`w-12 h-12 mx-auto ${isDragging ? 'text-pink-500' : 'text-gray-400'} group-hover:text-pink-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                    <span className={`text-lg ${isDragging ? 'text-pink-500' : 'text-gray-600'} group-hover:text-pink-500`}>
                      {isDragging ? 'Drop your video here' : 'Select a video file'}
                    </span>
                    <p className={`mt-2 text-sm ${isDragging ? 'text-pink-400' : 'text-gray-500'}`}>
                      or drag and drop here
                    </p>
                    <input type='file' className="hidden" accept="video/*" onChange={convertToAudio} />
                  </div>
                </label>
                
                {message && (
                  <div className={`w-full text-center py-3 px-4 rounded-lg ${
                    message.includes('失败') || message.includes('Please drop') 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-pink-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-gray-600">100% local processing for complete privacy</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-pink-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-gray-600">Instant conversion with no upload waiting</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-pink-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-gray-600">High-quality MP3 output</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-pink-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-gray-600">Supports most video formats</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-sm text-gray-500 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <p> 2024 Video Audio Extractor. All rights reserved.</p>
        <div className="mt-2">
          <a href="https://github.com/dacaiguoguo/video-audio-extractor" 
             target="_blank" 
             rel="noopener noreferrer"
             className="text-pink-500 hover:text-pink-700">
            View on GitHub
          </a>
        </div>
      </footer>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </main>
  );
}
