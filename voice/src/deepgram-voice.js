/**
 * Deepgram Duplex Voice Interface
 *
 * Full-duplex: simultaneous STT (mic → text) + TTS (text → speaker)
 * STT: Deepgram Nova-3 via live WebSocket streaming
 * TTS: Deepgram Aura-2-en-us via streaming synthesis
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Readable } from 'stream';
import Speaker from 'speaker';

export class DeepgramVoice {
  constructor(apiKey) {
    this.client = createClient(apiKey);
    this.liveConnection = null;
    this.onTranscript = null;
    this.onUtteranceEnd = null;
    this.isListening = false;
  }

  /**
   * Open a live STT stream. Returns the live connection object.
   * Audio chunks (raw PCM, 16-bit 16kHz mono) can be sent via sendAudio().
   *
   * @param {object} opts
   * @param {function} opts.onTranscript   - Called with (text: string, isFinal: boolean)
   * @param {function} [opts.onUtteranceEnd] - Called when speaker stops mid-sentence
   */
  async startSTT({ onTranscript, onUtteranceEnd } = {}) {
    this.onTranscript = onTranscript;
    this.onUtteranceEnd = onUtteranceEnd;

    const conn = this.client.listen.live({
      model: 'nova-3',
      language: 'en-US',
      encoding: 'linear16',
      sample_rate: 16000,
      channels: 1,
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
    });

    conn.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data?.channel?.alternatives?.[0];
      if (!alt?.transcript) return;
      if (this.onTranscript) this.onTranscript(alt.transcript, data.is_final);
    });

    conn.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      if (this.onUtteranceEnd) this.onUtteranceEnd();
    });

    conn.on(LiveTranscriptionEvents.SpeechStarted, () => {
      process.stdout.write('\r[STT] Listening...                \r');
    });

    conn.on(LiveTranscriptionEvents.Error, (err) => {
      console.error('[STT] Error:', err.message ?? err);
    });

    conn.on(LiveTranscriptionEvents.Close, () => {
      this.isListening = false;
    });

    // Wait for open before returning
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('STT open timeout')), 10_000);
      conn.on(LiveTranscriptionEvents.Open, () => {
        clearTimeout(timer);
        this.isListening = true;
        console.log('[STT] Connected — Nova-3 live stream open');
        resolve();
      });
      conn.on(LiveTranscriptionEvents.Error, (e) => {
        clearTimeout(timer);
        reject(e);
      });
    });

    this.liveConnection = conn;
    return conn;
  }

  /**
   * Send a raw PCM audio buffer into the live STT stream.
   * @param {Buffer} chunk
   */
  sendAudio(chunk) {
    if (this.liveConnection && this.isListening) {
      this.liveConnection.send(chunk);
    }
  }

  /** Close the live STT stream. */
  stopSTT() {
    if (this.liveConnection) {
      this.liveConnection.requestClose();
      this.liveConnection = null;
      this.isListening = false;
    }
  }

  /**
   * Synthesize text → speech using Deepgram Aura-2.
   * Returns a Web ReadableStream of raw linear16 PCM audio (24 kHz, mono).
   *
   * @param {string} text
   * @param {string} [voice='aura-2-en-us']
   * @returns {Promise<ReadableStream>}
   */
  async synthTTS(text, voice = 'aura-2-en-us') {
    const response = await this.client.speak.request(
      { text },
      { model: voice, encoding: 'linear16', sample_rate: 24000 }
    );
    const stream = await response.getStream();
    if (!stream) throw new Error('[TTS] No audio stream from Deepgram');
    return stream;
  }

  /**
   * Speak text aloud through the system speaker.
   * Awaits completion so you can sequence multiple utterances.
   *
   * @param {string} text
   * @param {object} [speakerOpts] - Options passed to node-speaker
   */
  async speak(text, speakerOpts = {}) {
    const webStream = await this.synthTTS(text);

    return new Promise((resolve, reject) => {
      const speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 24000,
        ...speakerOpts,
      });

      speaker.on('flush', resolve);
      speaker.on('error', reject);

      Readable.fromWeb(webStream).pipe(speaker);
    });
  }
}
