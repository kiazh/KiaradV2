'use client'

import { ScrambleText } from '@/components/ScrambleText'

/**
 * Section heading used on the home page ("currently" / "recently"). The
 * English label scrambles on hover, extending the sidebar's signature
 * interaction into the page body.
 */
export function SectionHead({ en, ja }: { en: string; ja: string }) {
  return (
    <h2 className="section-head">
      <ScrambleText text={en} className="section-head-en" />
      <span lang="ja" aria-hidden="true" className="section-head-ja">{ja}</span>
    </h2>
  )
}
