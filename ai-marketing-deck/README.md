# Marketing in the era of Artificial Intelligence (talk deck)

20 slides, 16:9, in Ramzi's own DA (black, stipple engraving, one lime object, italic serif title).

- `export/ai-marketing-deck.pdf`: the deck, open fullscreen to present
- `export/index.html` + `export/slides/`: browser presenter (arrow keys, click, F for fullscreen)
- `export/contact-sheet.jpg`: all slides at a glance
- `SPEECH.md`: one line per slide, transitions, power lines, quotes
- `gen/`: illustration plates generated on Higgsfield (GPT Image 2.6) from three ramzi.digital covers as style references and two photos of Ramzi as identity references
- `deck.mjs`: all the slide text. Edit it, then rebuild.

Rebuild after editing text:

```bash
npm install
NODE_PATH=$(npm root -g) node build.mjs
python3 export.py
```

Plate prompts all share one style line ("pure black background, black and white stipple halftone engraving with film grain, exactly one object glowing lime green, no text") plus one scene: conductor of a robot orchestra, three people casting a robot army shadow, three pedestals, hamster wheel, paper ouroboros, phone conveyor, first domino, owl on monitors, sleeper and night-shift robot, switchboard, fingerprint robot, knowledge ribbon, robot mirror, vault key, four-tier cake, telescope, baton handover.
