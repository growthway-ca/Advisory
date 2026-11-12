// The Parlour Guild: the barbershop redesigned as a grooming house and members' club, the second in the series that
// turns an everyday service into a place people would choose. Carousel and preview only, no reel.
// Photos live in photos/: logo, floor, library, bar and member-kit are Matt's; the rest were generated in Canva.
// Run: npm run carousel:parlour
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../story.mjs';

// photo: file in photos/. at: where the caption sits. lines: one yellow box each.
const SLIDES = [
  { photo: 'ordinary.jpg', at: 'bottom', title: 'Barbershop, Upgraded', inset: 'floor.jpg',
    lines: ['A $35 cut, a plastic chair and a', '40-minute wait with the TV on. The', 'barbershop most of us know.'] },
  { photo: 'logo.jpg', at: 'top',
    lines: ['I’d call it The Parlour Guild. A', 'grooming house and members’ club, where', 'the haircut is the reason to drop by.'] },
  { photo: 'floor.jpg', at: 'top',
    lines: ['Four chairs, green marble and real', 'light. Booked online, so nobody waits', 'on a plastic bench.'] },
  { photo: 'library.jpg', at: 'top',
    lines: ['Early? Wait in the library with the', 'records, a backgammon board', 'and a decanter.'] },
  { photo: 'shave.jpg', at: 'top',
    lines: ['The hot-towel shave is the treat.', 'Twenty quiet minutes nobody', 'else gives you.'] },
  { photo: 'bar.jpg', at: 'top',
    lines: ['Chairs cap what haircuts can earn.', 'The bar doesn’t: espresso before', 'work, a whisky after.'] },
  { photo: 'member-kit.jpg', at: 'top',
    lines: ['Members get a card, a locker key and', 'the house oil. Paid monthly,', 'not per cut.'] },
  { photo: 'regular.jpg', at: 'top',
    lines: ['It’s for regulars who get a cut every', 'three weeks and want a third place', 'that isn’t home or work.'] },
  { photo: 'popup.jpg', at: 'top',
    lines: ['$89 a month for two cuts and the bar.', 'First I’d run Thursday nights in a Barrie', 'shop and sell 30 founding memberships.'] },
  { photo: 'storefront.jpg', at: 'top',
    lines: ['Give me a neglected category.', 'I’ll show you the modern company', 'hiding inside it.'] },
];

// The scroll-stopping cover, in the sports-podcast style; *stars* turn words yellow.
const PREVIEW = {
  photo: 'floor.jpg',
  inset: 'ordinary.jpg',
  stat: ['$35 cut.', '40 min wait.'],
  headline: ['I’d turn the', 'barbershop into a', '*members’ club*'],
  sub: 'The Parlour Guild · grooming house',
};

const CAPTION = `A $35 cut, a plastic chair and a 40-minute wait with the TV on. That's the barbershop most of us know.

I'd call it The Parlour Guild: a grooming house and members' club. Four chairs booked online, a library to wait in, a hot-towel shave worth the trip, and a bar for espresso before work and a whisky after.

Chairs cap what haircuts can earn. The bar and monthly memberships don't. $89 a month for two cuts and the bar, for regulars who want a third place that isn't home or work.

Before signing a lease, I'd run Thursday nights in an existing Barrie shop and sell 30 founding memberships.

Give me a neglected category. I'll show you the modern company hiding inside it.

#businessideas #barbershop #smallbusiness #barrie #simcoecounty`;

run({ dir: path.dirname(fileURLToPath(import.meta.url)), name: 'Parlour Guild', slides: SLIDES, caption: CAPTION, preview: PREVIEW, reel: false });
