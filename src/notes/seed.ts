import { serializeNote } from './parse'
import { NOTES_DIR, type NoteMeta } from './types'
import type { FileStorageAdapter } from '../storage/types'

function md(partial: Partial<NoteMeta>, body: string): string {
  const now = '2026-08-19T09:00:00.000Z'
  return serializeNote(
    {
      tags: [],
      pinned: false,
      archived: false,
      trashed: false,
      locked: false,
      created: now,
      modified: now,
      ...partial,
    },
    body.trim() + '\n',
  )
}

const SEED: Record<string, string> = {
  'polar-bears.md': md(
    {
      tags: ['bear', 'animals', 'science'],
      pinned: true,
      created: '2026-08-17T09:12:00.000Z',
      modified: '2026-08-18T16:40:00.000Z',
    },
    `
# Polar Bears

![A polar bear walking across sea ice](https://images.unsplash.com/photo-1589656966895-2e33e7653819?auto=format&fit=crop&w=1400&q=80)

The **polar bear** (*Ursus maritimus*) is a hypercarnivorous bear whose native range lies largely within the **Arctic Circle**, encompassing the Arctic Ocean and its surrounding seas and landmasses.

Polar bears are uniquely adapted to life on the sea ice. Their **strength**, thick fur, and large paws make them formidable hunters of seals. #bear #animals

They are classified as *vulnerable*, with climate change shrinking the sea ice they depend on.

## Classification

| Rank | Name |
| --- | --- |
| Kingdom | [Animalia](https://en.wikipedia.org/wiki/Animal) |
| Phylum | [Chordata](https://en.wikipedia.org/wiki/Chordate) |
| Class | [Mammalia](https://en.wikipedia.org/wiki/Mammal) |
| Order | [Carnivora](https://en.wikipedia.org/wiki/Carnivora) |
| Family | [Ursidae](https://en.wikipedia.org/wiki/Bear) |
| Species | *Ursus maritimus* |

#science
`,
  ),

  'the-life-of-a-programmer.md': md(
    {
      tags: ['code', 'work'],
      created: '2026-08-16T11:00:00.000Z',
      modified: '2026-08-18T10:22:00.000Z',
    },
    `
# The Life of a Programmer

Being a programmer is a unique existence. We spend our days translating human intention into something a machine can run — and our nights wondering why the semicolon mattered.

A typical day:

- [x] Read the backlog and pretend it is shorter than yesterday
- [ ] Pair on the auth refactor
- [ ] Write the tricky test you have been avoiding
- [ ] Ship something small enough to feel real

The best code is boring. The best comments explain *why*. The best teams leave the campground cleaner than they found it.

\`\`\`ts
function tomorrow(bugs: number): number {
  return bugs + Math.ceil(Math.random() * 3)
}
\`\`\`

#code #work
`,
  ),

  'recipes/homemade-pizza.md': md(
    {
      tags: ['food', 'personal'],
      created: '2026-07-08T18:20:00.000Z',
      modified: '2026-07-08T19:05:00.000Z',
    },
    `
# Recipe: Homemade Pizza

There's nothing quite like homemade pizza. Here's my go-to recipe after a few years of Friday-night experiments. #food

![Margherita pizza](https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80)

## Dough

- 500g tipo 00 flour
- 325g warm water
- 10g salt
- 3g instant yeast
- 15g olive oil

Mix, rest 30 minutes, fold, then cold ferment overnight.

## Assembly

1. Stretch gently — no rolling pin.
2. Sauce lightly. Cheese is not a blanket.
3. Bake as hot as the oven will go, stone preheated.

Finish with basil and a drizzle of oil. #personal
`,
  ),

  'work/q3-planning.md': md(
    {
      tags: ['work', 'work/meetings'],
      created: '2026-07-08T09:00:00.000Z',
      modified: '2026-07-08T11:30:00.000Z',
    },
    `
# Meeting Notes — Q3 Planning

Attendees: Maya, Jon, Priya, Alex

## Goals

- Ship the markdown storage adapter
- Cut time-to-first-note in half
- Keep the editor feeling like a notebook, not a CMS

## Decisions

- Notes are plain files. No database for the document body.
- Tags live in YAML frontmatter and as inline hashtags.
- Auth is later. Today is the writing experience.

## Actions

- [x] Draft the three-pane layout
- [ ] Hybrid markdown rendering for tags
- [ ] Autosave that does not fight the caret

#work/meetings
`,
  ),

  'travel/japan-itinerary.md': md(
    {
      tags: ['travel'],
      created: '2026-07-06T08:00:00.000Z',
      modified: '2026-07-07T21:15:00.000Z',
    },
    `
# Travel Itinerary: Japan

A loose plan — enough structure to book trains, not enough to ruin wandering. #travel

![Fushimi Inari](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=80)

## Tokyo — 4 nights

- Tsukiji outer market, early
- TeamLab, timed ticket
- Shimokitazawa record stores
- One proper ramen pilgrimage (Ivan Ramen or Afuri)

## Kyoto — 3 nights

- Fushimi Inari at sunrise
- Philosopher’s Path
- Day trip to Nara if the weather holds

## Trains

Buy the IC card on day one. Reserve the Shinkansen seats the night before.
`,
  ),

  'health/workout-plan.md': md(
    {
      tags: ['health', 'personal/health'],
      created: '2026-08-12T07:00:00.000Z',
      modified: '2026-08-19T07:10:00.000Z',
    },
    `
# Workout Plan

Keep it simple enough that it actually happens. #health #personal/health

## This week

- [x] Monday — 40 min zone 2
- [x] Tuesday — strength (push)
- [ ] Wednesday — walk + mobility
- [ ] Thursday — strength (pull)
- [ ] Friday — intervals
- [ ] Saturday — long easy hike
- [ ] Sunday — off

Sleep is the program. Training is the commentary.
`,
  ),

  'books/atomic-habits.md': md(
    {
      tags: ['books', 'personal'],
      created: '2026-06-02T20:00:00.000Z',
      modified: '2026-06-20T21:44:00.000Z',
    },
    `
# Book Notes: Atomic Habits

You do not rise to the level of your goals. You fall to the level of your systems.

- Make it obvious
- Make it attractive
- Make it easy
- Make it satisfying

Environment design beats motivation. Identity is the real loop: *I am the kind of person who writes every morning.*

#books #personal
`,
  ),

  'personal/family-reunion.md': md(
    {
      tags: ['personal', 'personal/family'],
      created: '2026-05-18T14:00:00.000Z',
      modified: '2026-05-19T09:12:00.000Z',
    },
    `
# Family Reunion — packing & people

Cabin is booked for the last weekend of August. Bring the big coffee percolator. #personal/family

- [ ] Board games that do not start a war
- [ ] Extra blankets
- [ ] Photo book from last year
- [x] Confirm dietary list with Maya

If it rains: museum in town, then the diner with the too-sweet pie.
`,
  ),

  'travel/weekend-in-the-mountains.md': md(
    {
      tags: ['travel', 'personal'],
      created: '2026-08-01T12:00:00.000Z',
      modified: '2026-08-02T18:00:00.000Z',
    },
    `
# Weekend in the Mountains

Leave Friday after lunch. No itinerary beyond trail shoes and a paperback. #travel #personal

![Alpine ridge](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80)

- Ridgeline loop if the weather holds
- Swim in the lake even if it is cold
- Cook something that only needs one pan
`,
  ),

  'ideas/project-ideas.md': md(
    {
      tags: ['code', 'ideas'],
      created: '2026-08-10T22:00:00.000Z',
      modified: '2026-08-15T08:30:00.000Z',
    },
    `
# Project Ideas

A running list. Most will stay here, and that is fine. #code #ideas

1. A notes app that is just a folder of markdown files
2. Local-first reading list with highlights
3. Tiny map of coffee shops that still let you sit
4. Personal wiki that does not feel like a wiki

The trick is not capturing ideas. It is starting the one that keeps tapping you on the shoulder.
`,
  ),

  'science/science-field-notes.md': md(
    {
      tags: ['science'],
      created: '2026-04-11T10:00:00.000Z',
      modified: '2026-04-12T16:18:00.000Z',
    },
    `
# Field Notes — tide pools

Low tide at 6:40. Water was unusually clear after yesterday’s wind. #science

- Ochre stars on the shaded side of the rock
- A pair of hermit crabs fighting over a shell that fit neither of them
- Remember: the anemones look like pebbles until they are not

Sketch later. Do not rely on memory for color.
`,
  ),

  'personal/blog-draft.md': md(
    {
      tags: ['personal/blog-post', 'code'],
      created: '2026-08-05T19:00:00.000Z',
      modified: '2026-08-09T20:11:00.000Z',
    },
    `
# Why plain text still wins

Every few years we reinvent notes. The versions I still have are the ones I can open in any editor, grep, and diff. #personal/blog-post #code

Markdown is not a format so much as a truce: readable without rendering, useful with it.

If your notes require a company to stay in business, they are not notes. They are a subscription.
`,
  ),

  'personal/private-journal.md': md(
    {
      tags: ['journal', 'personal'],
      locked: true,
      created: '2026-08-14T23:10:00.000Z',
      modified: '2026-08-14T23:40:00.000Z',
    },
    `
# Private journal

A quiet page for things that do not need an audience. #journal #personal

Today was ordinary in the way that later becomes the part you miss.
`,
  ),

  'work/old-roadmap.md': md(
    {
      tags: ['work'],
      archived: true,
      created: '2025-11-02T10:00:00.000Z',
      modified: '2026-01-15T09:00:00.000Z',
    },
    `
# 2025 Product Roadmap

Kept for history. We did not ship half of this, and that turned out to be the point. #work

- Sync
- Collaboration
- Public sharing

Archive, don’t delete — future-you likes receipts.
`,
  ),

  'random-scratch.md': md(
    {
      tags: [],
      trashed: true,
      created: '2026-08-03T12:00:00.000Z',
      modified: '2026-08-03T12:04:00.000Z',
    },
    `
# scratch

asdf buy oat milk

(this was never a note)
`,
  ),
}

export async function seedIfEmpty(storage: FileStorageAdapter): Promise<void> {
  if (!(await storage.exists(NOTES_DIR))) {
    await storage.mkdir(NOTES_DIR)
  }
  const existing = await storage.readdir(NOTES_DIR)
  if (existing.some((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))) {
    return
  }

  const workoutKey = 'health/workout-plan.md'
  const workout = SEED[workoutKey].replace(
    /modified: .*/u,
    `modified: ${new Date().toISOString()}`,
  )

  for (const [name, raw] of Object.entries(SEED)) {
    const content = name === workoutKey ? workout : raw
    await storage.writeFile(`${NOTES_DIR}/${name}`, content)
  }
}
