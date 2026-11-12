// The Nordic Fix: a Parreira Advisory business-fix story. An unnamed Nordic spa already hands every guest an RFID
// bracelet; the fix is to let it run the hot stone room, the bistro tables and a guided day.
// Photos live in photos/ (generated in Canva). Run: npm run reel:nordic
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../story.mjs';

// photo: file in photos/ (Canva media id in the comment). at: where the caption sits. lines: one yellow box each.
// Captions are carousel-only; the reel is photos alone.
const SLIDES = [
  { photo: '01.jpg', at: 'bottom', title: 'The Nordic Fix', inset: 'timer.jpg', // autumn pool + stuck timer inset
    lines: ['I spent $500 at a Nordic spa. The best', 'tech in the building was on my wrist,', 'and it barely did anything.'] },
  { photo: '02.jpg', at: 'top', // locker tap
    lines: ['Every guest gets an RFID bracelet.', 'It opens your locker and pays at the', 'bistro. That’s all it does.'] },
  { photo: '03.jpg', at: 'top', // hot stone room, stuck timers
    lines: ['10 hot stone bays, a sand timer at', 'each. Neither of mine worked, so I lay', 'there watching sand that wouldn’t fall.'] },
  { photo: '04.jpg', at: 'top', // MAHYnUfXIsE
    lines: ['Every few minutes the door opens.', 'Someone checking for a free bay. The', 'heat and the quiet leave with them.'] },
  { photo: '05.jpg', at: 'top', // bistro runner
    lines: ['At the bistro you carry a number to', 'your table. Twice I heard runners', 'auction off food they couldn’t place.'] },
  { photo: '06.jpg', at: 'top', // checkout receipt
    lines: ['$500 for two. I left with a receipt', 'and no idea what any of it did for me.'] },
  { photo: '07.jpg', at: 'top', // MAHYnWjdaA0
    lines: ['The fix is already on every wrist. A', 'board outside the stone room: green is', 'free, red is taken. Nobody opens the door.'] },
  { photo: '08.jpg', at: 'top', // MAHYnQFthvE
    lines: ['Tap in at your bay and the bracelet', 'keeps time. A gentle buzz at 15', 'minutes. No sand to watch.'] },
  { photo: '09.jpg', at: 'top', // table tap
    lines: ['Tap the bracelet on your table. The', 'runner’s tablet shows who’s sitting', 'where. No more auctions.'] },
  { photo: '10.jpg', at: 'top', // wrist + circuit map
    lines: ['Opt in and it guides first-timers', 'around the circuit and the queues, then', 'shows what the day did for them.'] },
  { photo: '11.jpg', at: 'top', // autumn pool
    lines: ['Give me a business you love.', 'I’ll show you the fix hiding', 'inside it.'] },
];

const CAPTION = `I spent $500 at a Nordic spa. The smartest thing in the building was the RFID bracelet on my wrist, and all it did was open a locker and pay for lunch.

Meanwhile: broken sand timers in the hot stone room, a door that never stops opening, and bistro runners auctioning off food they can't place.

The fix is already on every wrist. A free-bay board outside the stone room. A gentle buzz when your time is up. Tap-the-table food delivery. And an opt-in guided circuit for first-timers.

Give me a business you love. I'll show you the fix hiding inside it.

#businessideas #nordicspa #smallbusiness #customerexperience #simcoecounty`;

run({
  dir: path.dirname(fileURLToPath(import.meta.url)),
  name: 'Nordic Fix',
  slides: SLIDES,
  caption: CAPTION,
  // Kept as first published: a 1.8s title hold, then 25 frames a slide and 21 for the last.
  quick: [1.8, ...Array(9).fill(25 / 30), 21 / 30],
});
