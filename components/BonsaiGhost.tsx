/**
 * Ambient ASCII bonsai, washed into the background behind the page.
 *
 * This is real `cbonsai` output, not hand-drawn ASCII. The tree was grown by
 * building cbonsai from source (gitlab.com/jallbrit/cbonsai) and running it
 * inside a sized pseudo-terminal, then capturing its `--print` dump:
 *
 *   cc -o cbonsai cbonsai.c -lncurses -lpanel   # macOS lib names
 *   ./cbonsai --print --life 52 --multiplier 5 --seed 26  # in a 29x96 pty
 *
 * The pty geometry is part of the recipe, not incidental: cbonsai sizes growth
 * to the terminal, so this same seed at a different row count yields a
 * different tree. A deliberately short pty is what makes this one wide and low
 * -- the growth runs out of headroom and travels sideways instead, which is
 * also what gives the branches their length.
 *
 * Seed chosen by measuring, not by eye alone. Each metric was earned from an
 * earlier attempt that failed in a specific way:
 *
 *   cohesion   share of tree ink in one connected shape. An earlier tree scored
 *     0.89 and read as debris -- a tenth of its ink floated detached.
 *   solidity   share of foliage in horizontal runs of 3+. That tree scored
 *     0.59: lone '&' glyphs with gaps, which the eye reads as speckle.
 *   masses     foliage clumps of 12+ glyphs -- branches ending in real leaves.
 *   exposure   share of wood with neither horizontal neighbour a leaf. A dense
 *     tree scored well on all the above yet hid its trunk inside the canopy.
 *   reach      columns from the trunk axis to each mass -- branch length. Six
 *     masses hugging the trunk still read as one blob.
 *   ratio      largest mass / smallest. The brief asked for branches varying in
 *     size; a previous run minimised size spread instead and scored worse, so
 *     this is now maximised rather than evened out.
 *
 * This tree: 6 masses sized 71/66/30/20/16/15 (ratio 4.7) with branches
 * reaching a mean 19 and a maximum 34 columns off the trunk axis -- the longest
 * of any candidate -- at 0.849 exposure, 0.994 cohesion, 0.30 fill, 29 rows.
 * A seed with better reach still was rejected at 0.47 fill: past roughly 0.35
 * the branches stop reading as branches and the tree becomes a thicket, which
 * matters more now that wood is painted at full strength. Recorded so it stays
 * reproducible.
 *
 * ASCII rather than an SVG on purpose: the site is already a monospace
 * terminal world, so genuine terminal output belongs to it instead of being
 * pasted onto it. Every glyph here is cbonsai's own vocabulary -- `/|\\` and
 * `\\|` trunk strokes, `\\_` / `_/` shoots, `&` leaves, and its base-type-1
 * planter with the `./~~~\\.` lip and `(_)` feet.
 *
 * COLOUR carries cbonsai's own four-material scheme. Its default palette is
 * `--color 2,3,10,11` = dark leaves, dark wood, light leaves, light wood, plus
 * colour 8 for the planter rim; each cell's role was recovered by parsing the
 * colour escapes in the same captured dump, so the paint below is cbonsai's
 * decision, not an invention. Wood then carries a bark-brown to amber ramp at
 * full strength while foliage stays a quiet green wash -- the branches are the
 * thing meant to be seen. See the `--bn-*` tokens in globals.css.
 *
 * Purely decorative: aria-hidden, not selectable, not hit-testable, and it
 * carries no information a visitor needs. Rendered from layout so it persists
 * across routes as scenery rather than re-entering on every navigation.
 */

import { Fragment, type ReactNode } from 'react'

const ART = String.raw`
                           &&&&&&&&|&|&&&&&&&\&&&  &&
                            && &&&&&&& \&& /_/  &&&&&
                         &&&&&&&&&&&&&&\/~\_&&&&&/& &&&
                        & &&&&&&&/|\~&//|/~&/  & &&&
                           &&&&&&&~~&&/\__/|\/  &&&&&
                          && & &&\|&&|\/|\/~/&&&&/&&
                                  /~~|\|/  \| & &&
                                   /~|\_|  /|& &&&&
                            && &\_|\|//\| \/&&&&&&&_/
                           &&&& \ /\|_/ \_&//~\&/&&&&&
             &&          &  &&_&\&&_/___/__///&&|  & &
             & &&&&    & &&&&    \_\/~/  /\/~& /&&&&&&  &
             &&&&&        &/|\__  /|/~\    |//_&&&  &
            && &&&       \\_     \ //~|\  \|                   &
            & &&\_\|     \_         |\|    \|          &&&&& &&&&
        &     \_| \\/\__           \| /|\   |/  \|__/     && /_&&&&& &&&
   &&  &    \ &\&\_\_\/|            /~/~~||/~_//___/_// _/_\_&&&&&&&&&&&
&  &&&&&\_|&&&&       \|     \|      /|\ /|\ /_//    /   / _//  &/&&& &
   &&&&& &__ &         \_\___\_|  \_\_/ \|/             _/|        &
      &                         \_\ \|  /~|/           \/_/
                                     \| \/~  ____/_/  _////
                                      /~\/~  \|     /_/
                                        /|/~/__/
                                        /~|
                                        ///~
                        :___________./~~~\.___________:
                         \                           /
                          \_________________________/
                          (_)                     (_)`

/**
 * Per-glyph paint, aligned 1:1 with ART. Lowercase is the dark tier of a
 * material, uppercase the bright one:
 *   l / L  leaf dark / leaf bright
 *   w / W  wood dark / wood bright
 *   t      planter rim text
 *   .      unpainted (spaces)
 *
 * '.' rather than a space for "unpainted" so no editor or formatter can strip
 * trailing whitespace and silently shift the mask out of step with the art.
 */
const PAINT = String.raw`
...........................LlLLLLlLwLWLlllLLLwLll..wl
............................lL.llLLLll.Wll.WWW..LlLLW
.........................WLLLWLlWwlLLLLwWWWwLLLllwL.WLl
........................W.lllLllLwwwWlWwwWWlW..l.lll
...........................llllLLlWWLLWWWwwwwW..LlwWw
..........................LL.l.llWWllwwWWWwwwLlLlwll
..................................wwwwwWW..WW.l.lL
...................................wwwwwW..WWL.Llll
............................lL.LWWWwWWWww.wwlllLLLlWW
...........................lLll.w.Wwwww.WWLwWWWlWLLlWl
.............ll..........l..LlwLWLlwwWwWWwWWWwllw..l.w
.............l.llLl....w.Wwlw....wwwwwW..wwwwl.WWlWlLL..L
.............LLWwl........lWWwwW..wwwww....wwWwlll..l
............lw.Wll.......wWW.....w.WWWww..WW...................l
............l.LlWWww.....WW.........WWW....WW..........LlLlL.LlLl
........l.....www.wwwwwW...........WW.WWW...ww..WWwww.....ll.WWlWlll.Lww
...LL..L....W.lWLwwWWwww............WWwwwWwwwwwWwwwwWWw.wwwwwllLwLLlLlWl
L..LlWllWWwLLLL.......ww.....ww......WWW.WWW.Wwww....w...w.WWW..lWWlw.l
...wwLwl.lwW.l.........wwwwwWWWW..WWWWw.wWW.............WWw........L
......l.........................www.WW..wwWW...........wWww
.....................................WW.wWW..wwWwwww..wwWWw
......................................WWwww..ww.....wWW
........................................wwwwwwWW
........................................www
........................................wwww
........................tLLLLLLLLLLLWWWWWWWLLLLLLLLLLLt
.........................t...........................t
..........................ttttttttttttttttttttttttttt
..........................ttt.....................ttt`

const ROLE_CLASS: Record<string, string> = {
  l: 'bn-ld',
  L: 'bn-lb',
  w: 'bn-wd',
  W: 'bn-wb',
  t: 'bn-tx',
}

/**
 * Zip the art against its paint mask, coalescing each run of same-role glyphs
 * into a single span. Runs rather than per-character spans keep the markup
 * proportional to colour changes, not to glyph count.
 *
 * Runs at build time: every page rendering this is statically prerendered.
 */
function paint(art: string, mask: string): ReactNode[] {
  const artRows = art.split('\n')
  const maskRows = mask.split('\n')

  return artRows.map((row, y) => {
    const m = maskRows[y] ?? ''
    const spans: ReactNode[] = []
    let i = 0

    while (i < row.length) {
      const role = m[i] ?? '.'
      let j = i
      while (j < row.length && (m[j] ?? '.') === role) j++

      const text = row.slice(i, j)
      const cls = ROLE_CLASS[role]
      spans.push(cls ? <span key={i} className={cls}>{text}</span> : text)
      i = j
    }

    return <Fragment key={y}>{spans}{'\n'}</Fragment>
  })
}

const TREE = paint(ART.replace(/^\n/, ''), PAINT.replace(/^\n/, ''))

export function BonsaiGhost() {
  return (
    <pre aria-hidden="true" className="bonsai-ghost">
      {TREE}
    </pre>
  )
}
