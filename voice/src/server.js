/**
 * Deepgram Duplex WebSocket Server
 *
 * Bridges browser microphone audio ↔ Deepgram STT
 * and streams Deepgram TTS audio back to the browser.
 *
 * Protocol:
 *   Browser → Server  (binary): raw PCM chunks from MediaRecorder / AudioWorklet
 *   Server  → Browser (binary): raw PCM TTS audio to play in AudioContext
 *   Server  → Browser (text):   JSON events  { type, payload }
 *     { type: 'transcript', text, isFinal }
 *     { type: 'tts_start' }
 *     { type: 'tts_end' }
 *     { type: 'error', message }
 *
 * Usage:
 *   node src/server.js
 *   PORT=3000 node src/server.js
 */

import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Readable } from 'stream';
import { DeepgramVoice } from './deepgram-voice.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public');

const API_KEY = process.env.DEEPGRAM_API_KEY;
if (!API_KEY) {
  console.error('Missing DEEPGRAM_API_KEY');
  process.exit(1);
}

const PORT = process.env.PORT ?? 3000;

const app = express();
app.use(express.static(PUBLIC));

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ── Per-connection handler ────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  const voice = new DeepgramVoice(API_KEY);
  let sttStarted = false;
  let isSpeaking = false;

  const send = (type, payload = {}) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }));
    }
  };

  // ── Start STT for this client ───────────────────────────────────────────
  async function ensureSTT() {
    if (sttStarted) return;
    sttStarted = true;

    try {
      await voice.startSTT({
        onTranscript(text, isFinal) {
          send('transcript', { text, isFinal });
        },
        onUtteranceEnd() {
          send('utterance_end');
        },
      });
    } catch (err) {
      console.error('[WS] STT start error:', err.message);
      send('error', { message: err.message });
    }
  }

  // ── TTS: text → stream → binary frames to browser ──────────────────────
  async function streamTTS(text) {
    isSpeaking = true;
    send('tts_start');

    try {
      const webStream = await voice.synthTTS(text);
      const nodeStream = Readable.fromWeb(webStream);

      nodeStream.on('data', (chunk) => {
        if (ws.readyState === ws.OPEN) ws.send(chunk);
      });

      await new Promise((resolve, reject) => {
        nodeStream.on('end', resolve);
        nodeStream.on('error', reject);
      });
    } catch (err) {
      console.error('[WS] TTS error:', err.message);
      send('error', { message: err.message });
    }

    isSpeaking = false;
    send('tts_end');
  }

  // ── Incoming messages ───────────────────────────────────────────────────
  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      // Raw PCM audio from browser mic — forward to Deepgram STT
      await ensureSTT();
      if (!isSpeaking) voice.sendAudio(data);
      return;
    }

    // JSON control messages from browser
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'start':
          await ensureSTT();
          break;

        case 'tts':
          // Browser requests TTS synthesis
          if (msg.text) await streamTTS(msg.text);
          break;

        case 'stop':
          voice.stopSTT();
          sttStarted = false;
          break;

        default:
          console.warn('[WS] Unknown message type:', msg.type);
      }
    } catch {
      // Not JSON — ignore
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    voice.stopSTT();
  });

  ws.on('error', (err) => {
    console.error('[WS] Socket error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Deepgram Duplex Server running at http://localhost:${PORT}`);
});
