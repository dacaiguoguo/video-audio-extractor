'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      
      setMessage('转换完成！');
    } catch (error) {
      console.error(error);
      setMessage('转换失败：' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-50 to-white">
      <div className="z-10 w-full max-w-3xl px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">Video Audio Extractor</h1>
        
        <p className="text-xl text-center mb-12 text-gray-600">Extract audio from videos quickly and securely</p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          {!isReady && (
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
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
              <label className="w-full cursor-pointer group">
                <div className="border-2 border-dashed border-gray-300 group-hover:border-blue-500 rounded-lg p-8 text-center transition-colors duration-200">
                  <div className="mb-4">
                    <svg className="w-12 h-12 mx-auto text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <span className="text-lg text-gray-600 group-hover:text-blue-500">Select a video file</span>
                  <p className="mt-2 text-sm text-gray-500">or drag and drop here</p>
                  <input type='file' className="hidden" accept="video/*" onChange={convertToAudio} />
                </div>
              </label>
              
              {message && (
                <div className="w-full text-center py-3 px-4 rounded-lg bg-gray-50 text-gray-700">
                  {message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-gray-600">100% local processing for complete privacy</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-gray-600">Instant conversion with no upload waiting</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-gray-600">High-quality MP3 output</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p className="text-gray-600">Supports most video formats</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full text-center py-6 text-sm text-gray-500 border-t border-gray-200">
        <p> 2024 Video Audio Extractor. All rights reserved.</p>
        <div className="mt-2">
          <a href="https://github.com/yanguosun/video-audio-extractor" 
             target="_blank" 
             rel="noopener noreferrer"
             className="text-blue-500 hover:text-blue-700">
            View on GitHub
          </a>
        </div>
      </footer>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </main>
  );
}
