# Deepgram Duplex Voice Interface

Full-duplex voice interface using Deepgram:
- **STT**: Nova-3 — real-time streaming via WebSocket (16 kHz, linear16)
- **TTS**: Aura-2-en-us — streaming synthesis (24 kHz, linear16)
- Both channels run simultaneously (true duplex)

## Setup

```bash
cd voice
npm install
cp .env.example .env
# Add your DEEPGRAM_API_KEY to .env
```

## Usage

### CLI mode (mic + system speaker)
```bash
npm start
```
Speaks into your mic; Nova-3 transcribes in real-time.
Final transcripts are echoed back through Aura-2 TTS.
Swap the reply logic in `index.js → onFinalTranscript()` for your LLM/agent call.

### Browser mode (WebSocket server)
```bash
npm run server
# Open http://localhost:3000
```
Browser captures mic via AudioWorklet (16 kHz PCM), sends to server over WebSocket.
Server streams Deepgram STT transcripts back as JSON.
TTS audio is streamed as binary PCM frames and decoded client-side.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  CLI mode (index.js)                            │
│                                                  │
│  mic (16kHz PCM) ──► DeepgramVoice.sendAudio()  │
│                         │                        │
│                    Deepgram Nova-3 WS            │
│                         │                        │
│                   onTranscript()                 │
│                         │                        │
│                   onFinalTranscript()  ◄── LLM   │
│                         │                        │
│                   DeepgramVoice.speak()           │
│                         │                        │
│                  Deepgram Aura-2 HTTP            │
│                         │                        │
│                    system speaker                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Browser mode (src/server.js + public/)          │
│                                                  │
│  Browser mic ──WS binary──► server              │
│                              │                   │
│                        Deepgram Nova-3           │
│                              │                   │
│              WS JSON ◄── transcript              │
│                                                  │
│  TTS text ──WS JSON──► server                   │
│                         │                        │
│                   Deepgram Aura-2               │
│                         │                        │
│          WS binary ──► browser AudioContext      │
└─────────────────────────────────────────────────┘
```

## Duplex notes

- Mic audio is **suppressed while TTS is playing** to prevent feedback loops
- Interim transcripts update in-place; only final transcripts trigger TTS
- Utterance-end detection via Deepgram VAD (`utterance_end_ms: 1000`)
- TTS responses queue and play sequentially; rapid replies replace pending ones

## Files

```
voice/
├── index.js              # CLI duplex loop
├── src/
│   ├── deepgram-voice.js # Core DeepgramVoice class (STT + TTS)
│   └── server.js         # WebSocket bridge server
└── public/
    └── index.html        # Browser duplex UI
```
