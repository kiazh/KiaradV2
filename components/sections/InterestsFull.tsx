'use client'

import { useState } from 'react'
import { interests, tabs, type Tab } from '@/lib/content'

export function InterestsFull() {
  const [active, setActive] = useState<Tab>('anime')
  const current = interests[active]

  return (
    <>
      <div role="tablist" aria-label="Interests" style={{ display: 'flex', gap: '26px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === tab}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            onClick={() => setActive(tab)}
            className="interest-tab"
            data-active={active === tab}
          >
            {interests[tab].label}
          </button>
        ))}
      </div>

      <div
        key={active}
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="interests-content"
      >
        {current.body && (
          <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.75, maxWidth: '560px' }}>
            {current.body}
          </p>
        )}

        {current.items && current.items.length > 0 && (
          <ul style={{ marginTop: current.body ? '26px' : '0', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {current.items.map((item) => (
              <li key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--fg)', fontSize: '15px', fontWeight: 500 }}>
                  {item.title}
                </span>
                {item.note && (
                  <span style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.65 }}>
                    {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
