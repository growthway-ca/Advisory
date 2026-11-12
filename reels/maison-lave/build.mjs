// Maison Lave: the first in a series that redesigns an everyday service as a place people would choose. Here the
// laundromat becomes a lounge and bar where the laundry happens to get done.
// Photos live in photos/: logo, lounge, bar, member-kit and library are Matt's; the rest were generated in Canva.
// Run: npm run reel:maison
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../story.mjs';

// photo: file in photos/. at: where the caption sits. lines: one yellow box each.
// Captions are carousel-only; the reel is photos alone.
const SLIDES = [
  { photo: 'ordinary.jpg', at: 'bottom', title: 'Laundry, Upgraded', inset: 'lounge.jpg',
    lines: ['Nobody likes the laundromat. Fluorescent', 'lights, plastic chairs and 90 minutes', 'of dead time.'] },
  { photo: 'logo.jpg', at: 'top',
    lines: ['I’d call it Maison Lave. Not a', 'laundromat. A living room where your', 'laundry happens to get done.'] },
  { photo: 'lounge.jpg', at: 'top',
    lines: ['The machines go into the wall. Sofas,', 'an olive tree and good light', 'take the rest of the room.'] },
  { photo: 'bar.jpg', at: 'top',
    lines: ['The bar is the business. Coffee by', 'day, wine by night, and the washers', 'spinning behind glass.'] },
  { photo: 'library.jpg', at: 'top',
    lines: ['A quiet room with records and books,', 'for anyone who’d rather not', 'make small talk.'] },
  { photo: 'member-kit.jpg', at: 'top',
    lines: ['Members get a card, house detergent', 'and brass wash tokens. Paid monthly,', 'not by the load.'] },
  { photo: 'wash-fold.jpg', at: 'top',
    lines: ['The machines barely make money.', 'The bar, memberships and wash-and-fold', 'pickup do.'] },
  { photo: 'renter.jpg', at: 'top',
    lines: ['It’s for condo renters with no', 'in-suite laundry, and anyone done', 'with the fluorescent box.'] },
  { photo: 'popup.jpg', at: 'top',
    lines: ['$45 a month. Before any lease, I’d put', 'a coffee cart in a Barrie laundromat for', 'a month and count who comes back.'] },
  { photo: 'storefront.jpg', at: 'top',
    lines: ['Give me a neglected category.', 'I’ll show you the modern company', 'hiding inside it.'] },
];

const CAPTION = `Nobody likes the laundromat. Fluorescent lights, plastic chairs and 90 minutes of dead time.

I'd call it Maison Lave. Not a laundromat: a living room where your laundry happens to get done. Machines built into the wall, a bar for coffee by day and wine by night, and a quiet room with records and books.

The machines barely make money. The bar, monthly memberships and wash-and-fold pickup do. $45 a month, for condo renters with no in-suite laundry.

Before signing any lease, I'd run a coffee cart inside an existing Barrie laundromat for a month and count who comes back.

Give me a neglected category. I'll show you the modern company hiding inside it.

#businessideas #laundromat #smallbusiness #barrie #simcoecounty`;

run({ dir: path.dirname(fileURLToPath(import.meta.url)), name: 'Maison Lave', slides: SLIDES, caption: CAPTION });
