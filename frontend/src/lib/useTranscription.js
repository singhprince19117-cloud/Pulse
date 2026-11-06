import { useEffect, useState } from 'react';
import { api } from './api.js';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const speechSupported = !!SR;

// Transcribes the LOCAL user's microphone with the browser's built-in (free) speech recognition
// and posts finished sentences to the backend. Works in Chrome/Edge; not in Firefox.
export function useTranscription(code, active) {
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active || !SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || 'en-US';
    let stopped = false;

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const text = e.results[i][0].transcript.trim();
        if (text) api.saveTranscript(code, text).catch(() => {});
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        stopped = true;
        setError('The browser blocked speech recognition. Allow microphone access and turn Transcribe on again.');
      } else if (e.error === 'network') {
        setError('Speech recognition can’t reach its service (needs internet). Retrying…');
      }
    };
    rec.onend = () => { if (!stopped) setTimeout(() => { if (!stopped) try { rec.start(); } catch { /* already running */ } }, 300); };

    try { rec.start(); setError(''); } catch { /* already started */ }
    return () => { stopped = true; rec.abort(); };
  }, [code, active]);

  return error;
}
