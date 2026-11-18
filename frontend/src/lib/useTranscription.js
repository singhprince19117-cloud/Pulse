import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const speechSupported = !!SR;

const log = (...a) => console.log('[transcribe]', ...a); // remove once transcription works
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FATAL_HTTP = [401, 403, 404, 410]; // retrying cannot fix these
const MAX_TRIES = 6;
const MAX_QUEUE = 300;

// Transcribes the LOCAL user's microphone with the browser's free speech recognition and saves
// finished sentences to the backend. Returns an error string (empty when healthy).
//
// Reliability measures vs. the naive version:
//  - sentences go through an in-memory queue with retry + backoff, so a network blip or a
//    cold-starting API no longer silently drops them
//  - recognizer restarts use exponential backoff instead of a fixed 300 ms loop
//  - 'no-speech' / 'aborted' are treated as normal; only real failures count
//  - restarts when the tab becomes visible or the network comes back
//  - consecutive duplicate results (Android Chrome bug) are skipped
//  - start is deferred a tick so React StrictMode's mount/unmount/mount does not double-start
export function useTranscription(code, active) {
  const [error, setError] = useState('');
  const queue = useRef([]); // [{ text, tries }]
  const flushing = useRef(false);
  const codeRef = useRef(code);
  codeRef.current = code;

  const flush = async () => {
    if (flushing.current) return;
    flushing.current = true;
    let delay = 1000;
    try {
      while (queue.current.length) {
        const item = queue.current[0];
        try {
          await api.saveTranscript(codeRef.current, item.text);
          queue.current.shift();
          delay = 1000;
        } catch (e) {
          log('save failed', e.status, e.message);
          if (FATAL_HTTP.includes(e.status)) {
            queue.current.shift();
            setError(e.status === 401 ? 'Your session expired, so transcription can’t be saved. Log in again.' : 'Transcription was rejected by the server.');
            continue;
          }
          if (++item.tries >= MAX_TRIES) { queue.current.shift(); continue; }
          await sleep(delay);
          delay = Math.min(delay * 2, 15000);
        }
      }
    } finally {
      flushing.current = false;
    }
  };

  const enqueue = (text) => {
    if (queue.current.length >= MAX_QUEUE) queue.current.shift();
    queue.current.push({ text, tries: 0 });
    flush();
  };

  useEffect(() => {
    if (!active || !SR) return undefined;

    let stop = false;
    let running = false;
    let failures = 0;
    let timer = null;
    let rec = null;
    let lastText = '';
    let lastAt = 0;

    const schedule = (ms) => { clearTimeout(timer); timer = setTimeout(start, ms); };

    function start() {
      if (stop || running) return;
      rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.lang = navigator.language || 'en-US';

      rec.onstart = () => { running = true; log('started'); };

      rec.onresult = (e) => {
        failures = 0;
        setError((p) => (p ? '' : p));
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (!e.results[i].isFinal) continue;
          const text = e.results[i][0].transcript.trim();
          const now = Date.now();
          if (!text || (text === lastText && now - lastAt < 3000)) continue;
          lastText = text; lastAt = now;
          log('final:', text);
          enqueue(text);
        }
      };

      rec.onerror = (e) => {
        log('error', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          stop = true;
          setError('The browser blocked speech recognition. Allow microphone access, then mute and unmute to retry.');
        } else if (e.error === 'audio-capture') {
          failures++;
          setError('Speech recognition can’t access a microphone. Check that no other app is using it.');
        } else if (e.error === 'network') {
          failures++;
          setError('Speech recognition can’t reach its service (needs internet; Brave blocks it). Retrying…');
        }
        // 'no-speech' and 'aborted' are normal: onend restarts quietly.
      };

      rec.onend = () => {
        running = false;
        if (stop) return;
        const wait = Math.min(300 * 2 ** failures, 15000);
        log('ended; restarting in', wait, 'ms');
        schedule(wait);
      };

      try {
        rec.start();
      } catch (err) {
        log('start threw', err);
        running = false;
        schedule(1000);
      }
    }

    const wake = () => {
      if (document.visibilityState === 'hidden' || stop || running) return;
      failures = 0;
      schedule(0);
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);

    schedule(250);

    return () => {
      stop = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      if (rec) {
        rec.onend = null;
        rec.onerror = null;
        // stop() (not abort()) lets the last in-flight phrase finalize before the recognizer closes.
        try { rec.stop(); } catch { /* not running */ }
      }
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return error;
}