/**
 * Audio I/O for a blind player: text-to-speech, speech recognition and short
 * earcons. Uses only built-in browser APIs (Web Speech API, Web Audio).
 *
 * Note: in Chrome, speech recognition audio is processed by Google’s servers.
 */

// Minimal typings — the Web Speech recognition API isn't in TypeScript's DOM lib.
interface RecognitionAlternative {
  transcript: string
}
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<RecognitionAlternative> & { isFinal: boolean }>
}
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: RecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

const RecognitionImpl: RecognitionCtor | undefined =
  typeof window === 'undefined'
    ? undefined
    : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition)

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
export const canListen = !!RecognitionImpl

let speakRun = 0

/** Speak text aloud; resolves when finished (or interrupted by a newer call). */
export function speak(text: string): Promise<void> {
  if (!canSpeak) return Promise.resolve()
  const run = ++speakRun
  window.speechSynthesis.cancel()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    u.voice = voices.find((v) => v.lang === 'en-US' && /Samantha|Google US English|Natural/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith('en')) ?? null
    u.rate = 0.95
    // Some browsers occasionally skip `onend`; never wait longer than the text could take.
    const fallback = window.setTimeout(resolve, 1500 + text.length * 90)
    const done = () => {
      window.clearTimeout(fallback)
      resolve()
    }
    u.onend = done
    u.onerror = done
    if (run === speakRun) window.speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  speakRun++
  if (canSpeak) window.speechSynthesis.cancel()
}

let audio: AudioContext | null = null

export type Sound = 'record-start' | 'record-stop' | 'send' | 'submit' | 'correct' | 'incorrect' | 'press' | 'error' | 'prize' | 'complete' | 'stage' | 'tick' | 'heartbeat' | 'heart-lost' | 'heart-restored' | 'game-over' | 'whoosh'

/** [frequency Hz, start s, duration s] notes for each interaction sound. */
const SOUNDS: Record<Sound, { notes: [number, number, number][]; type: OscillatorType; sweep?: number }> = {
  press: { notes: [[880, 0, 0.05]], type: 'square' },
  'record-start': { notes: [[440, 0, 0.09], [660, 0.1, 0.09], [880, 0.2, 0.14]], type: 'sine' },
  'record-stop': { notes: [[880, 0, 0.09], [660, 0.1, 0.09], [440, 0.2, 0.14]], type: 'sine' },
  send: { notes: [[300, 0, 0.35]], type: 'triangle', sweep: 1400 },
  submit: { notes: [[784, 0, 0.12], [1175, 0.13, 0.22]], type: 'triangle' },
  correct: { notes: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.35]], type: 'triangle' },
  incorrect: { notes: [[392, 0, 0.2], [311, 0.22, 0.4]], type: 'sawtooth' },
  error: { notes: [[220, 0, 0.15], [220, 0.2, 0.15]], type: 'square' },
  // Sparkle: a quick run of high notes, like a piece clicking into place.
  prize: { notes: [[1319, 0, 0.08], [1568, 0.07, 0.08], [1760, 0.14, 0.08], [2093, 0.21, 0.25]], type: 'sine' },
  stage: { notes: [[392, 0, 0.08], [523, 0.09, 0.08], [784, 0.18, 0.16]], type: 'square' },
  tick: { notes: [[1200, 0, 0.04]], type: 'square' },
  heartbeat: { notes: [[70, 0, 0.12], [60, 0.16, 0.14]], type: 'sine' },
  'heart-lost': { notes: [[660, 0, 0.1], [440, 0.12, 0.1], [262, 0.24, 0.35]], type: 'square' },
  'heart-restored': { notes: [[523, 0, 0.1], [784, 0.11, 0.1], [1047, 0.22, 0.25]], type: 'sine' },
  'game-over': { notes: [[392, 0, 0.25], [370, 0.27, 0.25], [349, 0.54, 0.25], [330, 0.81, 0.7]], type: 'square' },
  whoosh: { notes: [[1600, 0, 0.3]], type: 'sine', sweep: 200 },
  // Puzzle complete: a longer rising fanfare.
  complete: {
    notes: [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.3], [784, 0.8, 0.12], [1047, 0.95, 0.6]],
    type: 'triangle',
  },
}

/** Play a short interaction sound (Web Audio, no files needed). */
export function playSound(kind: Sound) {
  try {
    audio ??= new AudioContext()
    const ctx = audio
    if (ctx.state === 'suspended') void ctx.resume()
    const { notes, type, sweep } = SOUNDS[kind]
    for (const [freq, at, dur] of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = ctx.currentTime + at
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, t + dur)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(type === 'sawtooth' || type === 'square' ? 0.12 : 0.28, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    }
  } catch {
    // Audio unavailable; speech still carries the information.
  }
}

let active: Recognition | null = null

/**
 * Listen for one short utterance. Resolves with the recognizer's alternatives
 * (best first), or an empty list if nothing was understood.
 */
export function listen(timeoutMs = 7000): Promise<string[]> {
  if (!RecognitionImpl) return Promise.reject(new Error('Speech recognition is not supported in this browser.'))
  stopListening()
  return new Promise((resolve, reject) => {
    const rec = new RecognitionImpl()
    active = rec
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 5
    rec.continuous = false
    let alternatives: string[] = []
    let failed: string | null = null
    const timer = window.setTimeout(() => rec.stop(), timeoutMs)
    rec.onresult = (e) => {
      const first = e.results[0]
      alternatives = Array.from({ length: first.length }, (_, i) => first[i].transcript.trim()).filter(Boolean)
    }
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') failed = e.error
    }
    rec.onend = () => {
      window.clearTimeout(timer)
      if (active === rec) active = null
      if (failed === 'not-allowed' || failed === 'service-not-allowed') reject(new Error('Microphone access was blocked.'))
      else resolve(alternatives)
    }
    rec.start()
  })
}

export function stopListening() {
  active?.abort()
  active = null
}

/** Ask for microphone permission up front (done by the sighted player before handing over). */
export async function requestMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}

/**
 * Live microphone loudness (0–1) for a moving sound-wave visual, so people
 * watching can see that Player B is being heard. Returns a stop function.
 */
export async function startLevelMeter(onLevel: (level: number) => void): Promise<() => void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audio ??= new AudioContext()
    const ctx = audio
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.fftSize)
    let raf = 0
    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const v of data) sum += ((v - 128) / 128) ** 2
      onLevel(Math.min(1, Math.sqrt(sum / data.length) * 6))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())
    }
  } catch {
    return () => {}
  }
}

/**
 * A short, original guitar clip synthesised in the browser (Karplus–Strong
 * plucked strings — no audio file or licence needed): a few strummed chords in
 * a lilting rhythm. Resolves when it has finished playing.
 */
export function playGuitarClip(): Promise<void> {
  try {
    audio ??= new AudioContext()
    const ctx = audio
    if (ctx.state === 'suspended') void ctx.resume()
    const pluck = (freq: number, at: number, gain: number) => {
      const len = Math.floor(ctx.sampleRate * 1.6)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      const period = Math.round(ctx.sampleRate / freq)
      const ring = Float32Array.from({ length: period }, () => Math.random() * 2 - 1)
      for (let i = 0; i < len; i++) {
        const j = i % period
        const next = (j + 1) % period
        data[i] = ring[j]
        ring[j] = 0.996 * 0.5 * (ring[j] + ring[next])
      }
      const src = ctx.createBufferSource()
      const g = ctx.createGain()
      g.gain.value = gain
      src.buffer = buf
      src.connect(g).connect(ctx.destination)
      src.start(ctx.currentTime + at)
    }
    // E minor → G → D → E minor, strummed down (one string after another).
    const chords = [
      [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
      [98.0, 123.47, 146.83, 196.0, 246.94, 392.0],
      [146.83, 220.0, 293.66, 369.99],
      [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
    ]
    const beats = [0, 0.75, 1.1, 1.85, 2.2, 2.95]
    beats.forEach((t, k) => chords[Math.floor((k / beats.length) * chords.length)].forEach((f, i) => pluck(f, t + i * 0.018, 0.16)))
    return new Promise((r) => setTimeout(r, 4400))
  } catch {
    return Promise.resolve()
  }
}
