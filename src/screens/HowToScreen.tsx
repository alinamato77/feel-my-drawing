import { Button } from '../components/Button'
import { Credit, Principles } from '../components/Credit'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import { MODES } from '../game/modes'
import { SCENE } from '../game/scene'

export function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 md:px-10">
      <ScreenHeading className="text-3xl uppercase md:text-5xl">How to play &amp; about</ScreenHeading>
      <p className="font-minion text-2xl">
        One prompt: <em>“{SCENE}”</em> Two directions for sharing it through lines.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="px-box flex flex-col gap-3 bg-green p-6">
          <h2 className="text-lg uppercase">{MODES['draw-feel'].title}</h2>
          <p className="font-pixel text-[10px] uppercase">{MODES['draw-feel'].direction}</p>
          <p className="leading-relaxed">
            The sighted artist draws the prompt for 30 seconds. The drawing goes to the Dot Pad; the blind guesser explores it and guesses once. If it’s wrong, the artist gets 10 more seconds on a blank board to draw the beats as a clue; the guesser can feel the clue and the first drawing, and tries one last time.
          </p>
        </section>
        <section className="px-box flex flex-col gap-3 bg-blue p-6 text-white">
          <h2 className="text-lg uppercase">{MODES['draw-guess'].title}</h2>
          <p className="font-pixel text-[10px] uppercase">{MODES['draw-guess'].direction}</p>
          <p className="leading-relaxed">
            The prompt is read aloud to the blind artist, who draws for 90 seconds (with support — see the prototype limitation in the game). The sighted guesser sees the finished drawing and answers once.
          </p>
        </section>
      </div>
      <Principles />
      <p className="px-box bg-card p-5 leading-relaxed">
        Stars: right first time ★★★, right after the beat clue ★★, not guessed ☆☆☆ (costs one of 10 shared hearts; one returns every 5 minutes). Correct rounds win puzzle pieces. After each round, switch roles and try the other direction.
      </p>
      <section aria-labelledby="about" className="flex flex-col gap-2">
        <h2 id="about" className="label">About</h2>
        <Credit />
      </section>
      <div>
        <Button variant="secondary" onClick={onBack}>
          <PixelIcon name="undo" size={16} /> Back
        </Button>
      </div>
    </main>
  )
}
