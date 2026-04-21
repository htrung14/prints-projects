import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "At-Tamassok - Essay - Thalia Bassim",
  description:
    "A written accompaniment to At-Tamassok, twenty-five photographs from a single 35mm roll.",
};

export default function EssayPage() {
  return (
    <article className="essay-root">
      {/* ─── Full-bleed masthead ───────────────────────────────── */}
      <header className="essay-mast">
        <div className="essay-mast-inner">
          <span
            className="label-caps essay-kicker"
            style={{ color: "var(--i5)", letterSpacing: "0.12em" }}
          >
            Essay · At-Tamassok
          </span>

          <h1 className="essay-title" style={{ margin: 0 }}>
            <span className="font-serif essay-title-ar" lang="ar" style={{ color: "var(--ink)" }}>
              التمسّك
            </span>
            <span className="font-serif italic essay-title-en" style={{ color: "var(--i8)" }}>
              At-Tamassok
            </span>
          </h1>

          <div style={{ marginTop: "clamp(28px, 5vw, 44px)" }}>
            <p className="font-serif" style={{ fontSize: 14, color: "var(--i5)" }}>
              Introduction by Thalia Bassim
            </p>
            <p className="font-serif" style={{ fontSize: 14, color: "var(--i5)" }}>
              Essay by Zacarias Gonzalez
            </p>
          </div>
        </div>
      </header>

      {/* ─── Body ─────────────────────────────────────────────── */}
      <div className="essay-body">
        <section className="essay-measure">
          <p className="drop-cap essay-lede">
            I began with a single roll of film and the feeling that the afternoon would not wait for
            me. It was the kind of light that announces its own going - low, amber, falling across
            the kitchen tile in the way light does only for an hour, maybe less. I loaded the camera
            on the countertop, forgot to check the frame counter, and went looking for whatever was
            already in the room.
          </p>

          <p>
            The roll came back from the lab with a sticker on the canister - a number that was
            theirs, not mine, the kind that outlives the negative and starts to feel, eventually,
            like a small gift of authorship you didn&rsquo;t ask for. Of the thirty-six exposures
            the roll allows, the series that follows is what remains. The rest were a door, a shadow
            I mistook for a hand, and a frame where my thumb had wandered into the lens. I
            don&rsquo;t miss them.
          </p>

          <p>
            What the Arabic word <span lang="ar">التمسّك</span> does, more than translate, is
            insist. It is the noun form of a verb that means, at once, to hold on and to refuse to
            let go - a holding that has already begun to suspect it will be asked to stop. English
            gives me
            <em> clinging</em>, which is too anxious, or <em>adherence</em>, which is too legal. The
            truth is somewhere between the two, and closer to the hand than either.
          </p>
        </section>

        {/* Ornamental section break */}
        <div className="essay-sep" aria-hidden="true">
          <span>❦</span>
        </div>

        <section className="essay-measure">
          <h2 className="essay-h2">
            <span className="essay-h2-num">i.</span>
            <em>On a finite roll</em>
          </h2>

          <p>
            A roll of 35mm film has a shape - not metaphorically, a literal shape. Thirty-six
            frames, usually a little more if the loader is generous, a little less if it
            isn&rsquo;t. You cannot add to it partway through. You cannot revise a frame after the
            shutter has closed. Whatever arrives on the negative arrived in the room, at the moment,
            in the order you found it.
          </p>

          <p>
            Digital teaches the opposite lesson. It teaches that an image is a draft, that the
            shutter is a suggestion, that what you saw can be corrected into what you wish you had
            seen. I have nothing against that practice; I use it often. But there is a different
            kind of attention that comes from knowing the count is finite - that this frame costs
            one thirty-sixth of an afternoon, and that if the light moves before I&rsquo;m ready I
            will not get it back.
          </p>

          <p>
            Twenty-five frames became this series. I did not set out to make twenty-five; I set out
            to make thirty-six, and the roll and the light disagreed with me about how many of those
            were worth keeping. The edit was quieter than I expected. A frame is either holding
            something or it isn&rsquo;t. You can usually tell on the contact sheet, before
            you&rsquo;ve had a chance to talk yourself into it.
          </p>
        </section>

        {/* Pull quote */}
        <aside className="essay-pull">
          <p>
            A frame is either holding something or it isn&rsquo;t. You can usually tell on the
            contact sheet, before you&rsquo;ve had a chance to talk yourself into it.
          </p>
        </aside>

        <section className="essay-measure">
          <h2 className="essay-h2">
            <span className="essay-h2-num">ii.</span>
            <em>The afternoon, a duration</em>
          </h2>

          <p>
            The pictures were made across what I&rsquo;d guess was ninety minutes, though I did not
            time them. I know this because the shadows travel across the kitchen floor in a legible
            way from the first frame to the last - a slow diagonal, then a sudden thinning, then the
            moment when the sun clears the building across the street and the room goes flat. You
            can watch the series in order and feel the hour passing. That was not a plan. It is
            simply what the afternoon did while I was in it.
          </p>

          <p>
            I find I don&rsquo;t want to say much about the subjects themselves. There is a window.
            There is a cloth on a table that has been washed enough times to go soft at the corners.
            There is a glass of water that held light for the duration of one exposure and then was
            drunk. These are small facts, and I am suspicious of the way language expands small
            facts into claims.
          </p>

          <p>
            What I will say is that the series is the hour, not the objects in it. The clinging -
            التمسّك - is the hour&rsquo;s, not mine. I was the one with the camera, but the hour was
            the one doing the refusing to end.
          </p>
        </section>

        {/* Ornamental section break */}
        <div className="essay-sep" aria-hidden="true">
          <span>· · ·</span>
        </div>

        <section className="essay-measure">
          <h2 className="essay-h2">
            <span className="essay-h2-num">iii.</span>
            <em>On not correcting the scan</em>
          </h2>

          <p>
            The lab scanned the roll on a Noritsu, as they do every roll that passes through their
            shop. The scans came back warm - a little pink in the highlights, a gentle green in the
            shadows of two or three frames where the light had started to go. I have not corrected
            any of that. What you are seeing on the prints is the lab&rsquo;s scan, cropped for the
            frame edge and otherwise left alone.
          </p>

          <p>
            This is not a purist position. It is a practical one. Colour correction is a decision,
            and the more of it you do, the more the picture becomes an argument about what the light
            should have been. I was in the room when the light was what it was. The scan remembers
            the room better than I do now, months later, looking at a monitor in a different
            apartment. I would rather defer to it.
          </p>

          <p>
            The grain is the grain. Portra 400, pushed nothing, metered off the tablecloth for most
            of the roll. There is a frame near the end where I bracketed without meaning to and the
            highlights bloom slightly; that one is in the series. I like that it admits a mistake. A
            print that will not admit a mistake is a print I do not trust to tell me anything.
          </p>
        </section>

        <section className="essay-measure">
          <h2 className="essay-h2">
            <span className="essay-h2-num">iv.</span>
            <em>What a print is for</em>
          </h2>

          <p>
            When I made the decision to release the series as prints rather than as a book or a
            screen-based edit, I was thinking about surface. A print on paper has weight; it refuses
            to scroll. You live with it in a room, at a specific wall, under whatever light that
            wall happens to get in the afternoon. The print enters a duration of its own - yours,
            now, not mine.
          </p>

          <p>
            Each image in this series is printed at a single size, on archival paper, in a small
            edition. I don&rsquo;t think of the edition number as scarcity. I think of it as a way
            of saying: this object was made with care, one of a small number, and after that number
            there will not be more. The roll was finite. The series is finite. It felt right that
            the object should be, too.
          </p>

          <p>
            If there is a thesis here - and I&rsquo;m reluctant to give the work one - it is that
            holding on is not the same as preserving. Preservation is a freezing. Holding on is a
            practice that happens in time. The prints are my way of extending the hour long enough
            to look at it, and then letting it go again when you take one home.
          </p>
        </section>

        {/* Signature block */}

        {/* Quiet CTA back to prints */}
        <div className="essay-cta">
          <Link href="/#prints" className="essay-cta-link font-serif">
            View the prints →
          </Link>
        </div>
      </div>
    </article>
  );
}
