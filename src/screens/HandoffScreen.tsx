import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Button } from '../components/Button'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import { playSound, speak, stopSpeaking } from '../game/speech'

interface HandoffScreenProps {
  adapter: DotPadAdapter
  title: string
  /** Shown and spoken. */
  message: string
  from: 'A' | 'B'
  to: 'A' | 'B'
  button: string
  onStart: () => void
}

/** Pass the device between players. Reveals nothing about the answer. F1 also continues. */
export function HandoffScreen({ adapter, title, message, from, to, button, onStart }: HandoffScreenProps) {
  useEffect(() => {
    playSound('complete')
    void speak(`${title} ${message} Press F1 on the Dot Pad when you are ready.`)
    return () => stopSpeaking()
  }, [title, message])

  useEffect(() => adapter.onKey?.((k) => (k === 'KeyFunction1' || k === 'KeyFunction4' ? onStart() : undefined)), [adapter, onStart])

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-5xl flex-col items-center justify-center gap-10 px-5 py-10 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="flex flex-col items-center gap-6">
        <div className="relative flex h-24 w-72 items-center justify-between" aria-hidden="true">
          <span className={`px-box grid size-20 place-items-center font-pixel text-xl ${from === 'A' ? 'bg-yellow' : 'bg-blue text-white'}`}>{from}</span>
          {Array.from({ length: 6 }, (_, i) => (
            <motion.span key={i} className="absolute left-24 size-3 bg-ink" animate={{ x: [0, 110], opacity: [0, 1, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: (t: number) => Math.floor(t * 6) / 6 }} />
          ))}
          <span className={`px-box grid size-20 place-items-center font-pixel text-xl ${to === 'A' ? 'bg-yellow' : 'bg-blue text-white'}`}>{to}</span>
        </div>
        <ScreenHeading className="text-3xl uppercase md:text-5xl">{title}</ScreenHeading>
        <p className="font-minion max-w-2xl text-2xl">{message}</p>
      </motion.div>
      <Button variant="blue" size="xl" onClick={onStart} autoFocus>
        <PixelIcon name="hand" size={28} /> {button}
      </Button>
      <p className="label text-muted">or press F1 on the Dot Pad</p>
    </main>
  )
}
