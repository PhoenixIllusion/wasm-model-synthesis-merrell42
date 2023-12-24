
Based purely on my own machine testing with non-scientific testing, I saw 10-50x speed improvement of the Ac4 AsmScript over Ac4 Emscripten build.

This may be due to poor configuration issues in my Makefile or compiler setup, but the Asm version of these methods is currently more usable to me until I find a better Emscripten configuration.

#### Tests: (non-scientific)
Main test cases with long execution (rand Seed 5, Ac4)
Em - Emscripten Propagator,  Emscripten Synthesizer
Asm - AssemblyScript Propagator, JS Synthesizer, background thread
Tested on Mac.

|  Test                 | Em Ac4   | Asm Ac4 |
| --------------------- | -------- | ------- |
| Skyline N3            |  2400 ms |   84 ms |
| Flower N3             | 10300 ms |  250 ms |
| Cat N3 sym2 80x80     |  7600 ms |  250 ms |
| Skyline2 N3 sym2      |  3200 ms |  110 ms |
| Lake N3               | 10400 ms |  450 ms |
| Link N3               |  7300 ms |  200 ms |
| Office2 N3            |  3900 ms |  160 ms |
| Qud N3 80x80          |  4200 ms |  140 ms |
| Wrinkles N3 120x120   |  9140 ms |  255 ms |
| 3Bricks sym1          |  6260 ms |  230 ms |
| canyon.txt 25x25,10x10|  7200 ms |  165 ms |
| citylights.txt 25x25  |  5600 ms |  160 ms |
| escher.txt 30x30,10x10|  100 s   | 2650 ms |

Times were lowest in Em on Safari.
Up to 20-40% longer on both values on Firefox/Chrome. Highest values on Chrome, but 10-50x speedup seen still on relative times.
