export type Project = {
  name: string
  blurb: string
  description: string
  github: string
  year: string
  status: string | null
}

export const projects: Project[] = [
  {
    name: 'Facial Recognition',
    blurb: 'face verification with a Siamese network',
    description: "Face verification with a Siamese network, it compares faces instead of memorizing them so adding a new person doesn't mean retraining the whole thing. Also built a document scanner next to it while I was figuring out TensorFlow and OpenCV.",
    github: 'https://github.com/kiazh/OpenCVProj',
    year: '2025',
    status: null,
  },
  {
    name: 'MLscratch',
    blurb: 'machine learning in C, no libraries',
    description: "Machine learning in C with no libraries, just linear algebra and calculus. I didn't want to call torch.nn without knowing what it was actually doing. Still the project I'm most attached to.",
    github: 'https://github.com/kiazh/MLscratch',
    year: '2026',
    status: null,
  },
  {
    name: 'AES-128',
    blurb: 'AES-128 in Go, straight off the spec',
    description: "AES-128 in Go, written straight off the FIPS 197 spec. The S-box is a hardcoded table but MixColumns actually does GF(2⁸) field arithmetic at runtime through gmul. Passes the official test vector. C port eventually.",
    github: 'https://github.com/kiazh/AES-128',
    year: '2025',
    status: null,
  },
  {
    name: 'Esp32Network',
    blurb: 'decision tree running on an ESP32',
    description: "A scikit-learn decision tree running on an ESP32, classifying NRF24 link quality as normal, weak, or interference. Compiles down to one C header, zero runtime dependencies.",
    github: 'https://github.com/kiazh/Esp32Network',
    year: '2024',
    status: null,
  },
  {
    name: 'Cube',
    blurb: 'spinning cube in plain C, no graphics lib',
    description: "A spinning cube in plain C, no graphics library. Mostly an excuse to actually do the rotation math myself and was related to course work.",
    github: 'https://github.com/kiazh/Cube',
    year: '2026',
    status: null,
  },
]

export type Tab = 'anime' | 'physics' | 'games' | 'goals'

export type TabItem = {
  title: string
  note: string
}

export type TabContent = {
  label: string
  body: string
  items?: TabItem[]
}

export const interests: Record<Tab, TabContent> = {
  anime: {
    label: 'Anime/Manga',
    body: "As much as people like to clown on anime and manga, it has helped me at my lowest. The best I can describe whats felt through these shows is catharsis.",
    items: [
      { title: 'Firepunch', note: "Actual masterpiece and very underrated. WAYYY better than chainsawman although not really for everyone lol." },
      { title: 'Vagabond', note: "Beautiful book 10/10 masterpeice, its a shame the author stopped writting it." },
      { title: 'Sonny Boy', note: "This anime really helped me at a time of transition and fear, not very well known but I'd consider a 10/10, would recommend" },
      { title: 'Neon Genesis Evangelion', note: "Same message, different delivery. This one was with me at my lowest and I'm never forgetting it. Would give a lot to talk to Anno" },
    ],
  },
  physics: {
    label: 'Physics',
    body: "I liked physics before I knew that was the word for it. It's the thing that makes the fiction feel reachable; concepts like time travel, aliens, and teleportation are things that physics offers hope for and lays the groundwork for mankind's next steps.",
  },
  games: {
    label: 'Games',
    body: '',
    items: [
      { title: 'Destiny 2', note: 'Peaked top 500 global in speedrank on raid.report' },
      { title: 'Elden Ring', note: 'NG+7. Best game ever made, not really up for debate' },
      { title: 'Fortnite', note: "I know. But I competed and hit Unreal, plus Champ League back when it existed" },
      { title: 'Lego Marvel Super Heroes', note: "My childhood. Played almost every Lego game and this one's still the best" },
      { title: 'Plants vs Zombies Garden Warfare 2', note: 'Played this with my childhood best friend every single time he came over' },
    ],
  },
  goals: {
    label: 'Goals',
    body: "Some of these are more realistic than others lol.",
    items: [
      { title: 'Build a time machine', note: "" },
      { title: 'Build a plane', note: 'Just want to. I love aerospace.' },
      { title: 'Actually discover something in physics', note: '' },
      { title: 'PhD in physics', note: "Roughly 10 straight years of school, we will see how it goes." },
    ],
  },
}

export const tabs: Tab[] = ['anime', 'physics', 'games', 'goals']

export type CurrentItem = {
  label: string
  value: string
  href?: string
}

export const currently: CurrentItem[] = [
  {
    label: 'job 💔',
    value: 'ML research @ UofT',
    href: 'https://cadipt.mie.utoronto.ca/'
  },
  {
    label: 'building',
    value: 'a C compiler (fried)',
    href: 'https://github.com/kiazh/C-compiler',
  },
  {
    label: 'learning',
    value: 'More abt ML',
  },
  {
    label: 'playing',
    value: 'Destiny 2',
  },
]

export const recently: CurrentItem[] = [
  {
    label: 'built',
    value: 'MLscratch — machine learning in C, no libraries',
    href: 'https://github.com/kiazh/MLscratch',
  },
]
