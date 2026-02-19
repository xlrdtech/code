/**
 * Deepgram Duplex Voice — CLI entry point
 *
 * Runs simultaneous STT + TTS:
 *   - Mic captures audio → Deepgram Nova-3 transcribes in real-time
 *   - Final transcripts are echoed back via Deepgram Aura-2 TTS
 *
 * Replace the onFinalTranscript() hook below with your own agent/LLM call.
 *
 * Usage:
 *   node index.js
 *   DEEPGRAM_API_KEY=your_key node index.js
 */

import 'dotenv/config';
import mic from 'mic';
import { DeepgramVoice } from './src/deepgram-voice.js';

const API_KEY = process.env.DEEPGRAM_API_KEY;
if (!API_KEY) {
  console.error('Missing DEEPGRAM_API_KEY in environment / .env');
  process.exit(1);
}

const voice = new DeepgramVoice(API_KEY);

// ── Duplex state ─────────────────────────────────────────────────────────────
let isSpeaking = false;        // true while TTS audio is playing
let pendingUtterance = null;   // buffer for rapid utterances
let partialTranscript = '';

// ── Called once a final transcript arrives ───────────────────────────────────
async function onFinalTranscript(text) {
  if (!text.trim()) return;
  console.log(`\n[YOU] ${text}`);

  // *** Swap this block for your LLM/agent call ***
  const reply = `You said: ${text}`;
  // ************************************************

  console.log(`[AI]  ${reply}`);
  await speakReply(reply);
}

async function speakReply(text) {
  if (isSpeaking) {
    // Queue: replace any pending utterance with the latest
    pendingUtterance = text;
    return;
  }
  isSpeaking = true;
  try {
    await voice.speak(text);
  } catch (err) {
    console.error('[TTS] Error:', err.message);
  }
  isSpeaking = false;

  if (pendingUtterance) {
    const next = pendingUtterance;
    pendingUtterance = null;
    await speakReply(next);
  }
}

// ── Start STT ────────────────────────────────────────────────────────────────
async function main() {
  console.log('Deepgram Duplex Voice Interface');
  console.log('================================');
  console.log('STT: Nova-3 (16 kHz, linear16)');
  console.log('TTS: Aura-2-en-us (24 kHz, linear16)');
  console.log('');

  await voice.startSTT({
    onTranscript(text, isFinal) {
      if (isFinal) {
        partialTranscript = '';
        onFinalTranscript(text);
      } else {
        // Print interim transcript in-place
        partialTranscript = text;
        process.stdout.write(`\r[...] ${text.padEnd(80)}`);
      }
    },
    onUtteranceEnd() {
      if (partialTranscript) {
        onFinalTranscript(partialTranscript);
        partialTranscript = '';
      }
    },
  });

  // ── Open mic ─────────────────────────────────────────────────────────────
  const micInstance = mic({
    rate: '16000',
    channels: '1',
    encoding: 'signed-integer',
    bitwidth: '16',
    endian: 'little',
    exitOnSilence: 0,        // keep going indefinitely
  });

  const micStream = micInstance.getAudioStream();

  micStream.on('data', (chunk) => {
    // Suppress mic input while TTS is playing to avoid feedback loop
    if (!isSpeaking) {
      voice.sendAudio(chunk);
    }
  });

  micStream.on('error', (err) => {
    console.error('[MIC] Error:', err.message);
  });

  micInstance.start();
  console.log('Speak now — Ctrl+C to quit\n');

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    micInstance.stop();
    voice.stopSTT();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
