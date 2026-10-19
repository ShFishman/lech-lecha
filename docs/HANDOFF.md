# HANDOFF — finishing the Lech Lecha game

## Status (2026-10-19)
The engine/scaffold is done and committed. The build agent that wrote it died mid-run.
**Missing:** the four chapter scripts that `index.html` already loads, in this order:

- `js/prologue.js`  — לך לך: Charan at dawn, pulling the tent pegs, title card.
- `js/ch1.js`       — journey/altars, famine, Egypt border, Sarai taken, plagues, return, promise, parting from Lot.
- `js/war.js`       — the playable war to rescue Lot (march → night split/stealth → pursuit/search), Malkitzedek, the oath.
- `js/ch3.js`       — ברית בין הבתרים: stars counting, the pieces + birds, the dread, the torch, epilogue.

Each file must register its chapter with the engine. **Read `js/main.js`, `js/engine.js`, `js/scenes.js`,
`js/paint.js`, `js/audio.js`, `js/util.js` first** — they expose `window.Engine`, `window.Scenes`,
`window.Paint`, `window.Audio2`, `window.U`, and `main.js` shows how chapters are started and how
progress is saved to localStorage. Match the API that is already there; do not rewrite the engine.

Then: test every chapter end-to-end in headless Chromium, fix console errors, write the Hebrew README,
commit, and push to `main` (GitHub Pages serves from `main` root → https://shfishman.github.io/lech-lecha/).

## Original product brief (authoritative)
You are building a complete, polished, emotionally powerful browser game in Hebrew about פרשת לך לך (Genesis 12–17), and publishing it to the GitHub repository **ShFishman/lech-lecha** (branch `main`, GitHub Pages is already enabled from `main` root, so the live URL will be https://shfishman.github.io/lech-lecha/ ). Clone that repo (it has only a README), build inside it, commit, and push to `main`. If you cannot push for credential reasons, try `gh auth status`, `git push` with any available token, or open a PR; if all fail, leave everything committed and report precisely what blocked you. Commit often as you go so partial progress is never lost. End every commit message with the line: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`

# Product brief (from the user, authoritative)
"An astonishing, overwhelming browser game for פרשת לך לך that makes a lot of drama out of the story. It engages the user in a touching way and makes them active and emotionally touched but NOT in a kitsch way."
- **Language: Hebrew only**, right-to-left layout (`dir="rtl"`, `lang="he"`). Biblical quotes in the original Hebrew of the Torah text (quote accurately; use נוסח המסורה wording, with or without niqqud as you judge works for readability — niqqud is welcome on verse quotes). Narration/dialogue in modern literary Hebrew, elevated but natural. No English anywhere in the UI.
- **Audience: traditional adults/teens.** God is NEVER depicted as a figure. God's presence = voice (text + light + sound), never a face or body. Be faithful to the verses; well-known midrashim (Rashi, Bereshit Rabbah — e.g., אור כשדים, Sarai in the box at the Egyptian border, Abram's 318 men / Eliezer, Og telling Abram of Lot's capture, Malkitzedek = Shem) may be used where they add depth, clearly as midrash-flavor not scripture. Serious tone. War is real and tense but not gory.
- **Visual style: PAINTERLY ILLUSTRATED.** Rich layered scenes with parallax depth: textured dunes, painted cloud banks, the Nile with reeds and palms, Pharaoh's palace in gold and lapis, the night sky of the covenant with thousands of stars. Since no real artwork files exist, build everything procedurally: layered SVG/canvas with gradients, noise textures (canvas noise, SVG feTurbulence), soft-edge shapes, atmospheric perspective (far layers paler/bluer), vignette, film-grain overlay, slow parallax on mouse/scroll/gyroscope. Characters are stylized robed figures (shapes and gradients, no detailed faces — faces should be suggested, in shadow or turned, to avoid the uncanny/kitsch). Aim for the feeling of a painted storybook or a Gris/Journey-like game, not clip-art. Avoid the kitsch trap: no cartoon smiles, no stock-icon look, no emojis as art.
- **Audio:** procedurally generated with WebAudio (no audio files): wind, a low drone, sparse oud/ney-like plucked or breathy tones, drums during the war, a swelling sustained chord during the covenant. A mute button. Audio starts only after first user gesture (browser policy).
- Must work on desktop and mobile (touch), single-page, no build step, no backend. Must run from GitHub Pages as static files. Prefer ONE `index.html` plus a few `js/`/`css/` files; no npm, no bundler. Any library only from cdnjs/jsdelivr with pinned versions, and only if it clearly earns its place (prefer vanilla).
- Progress saved to localStorage (chapter reached, choices), with a "התחל מחדש" option.
- Hebrew typography: load from Google Fonts (e.g., "Frank Ruhl Libre" for narration, "David Libre" or "Amatic SC"-like is NOT appropriate; use a serif Hebrew for body and a heavier one for titles such as "Suez One" or "Frank Ruhl Libre 900"). Make line-height and sizes generous; this is a reading-heavy game.

# Structure: a prologue + 3 chapters + epilogue

## Prologue (short): לך לך
Charan at dawn. The voice: "לֶךְ־לְךָ מֵאַרְצְךָ וּמִמּוֹלַדְתְּךָ וּמִבֵּית אָבִיךָ אֶל־הָאָרֶץ אֲשֶׁר אַרְאֶךָּ". The player must *act* to leave: e.g., a drag/hold gesture that pulls the tent pegs out one by one, each one revealing a short line of what Abram leaves behind (father's house, the known gods of Charan, Terach's grave, the only language of his childhood). Then "וַיֵּלֶךְ אַבְרָם כַּאֲשֶׁר דִּבֶּר אֵלָיו ה'". Title card appears only now.

## Chapter 1: הַמַּסָּע, הָרָעָב, וּמִצְרַיִם (sad, but ending in a promise of hope and a holier, happier new beginning)
- The journey through Canaan: Shechem, Elon Moreh, the altar, Bethel. Player walks (hold to walk, scene scrolls with parallax); at each place, a short beat and the building of an altar (a small interaction: place stones).
- The famine: color drains from the scenes gradually as the player keeps walking; the flock thins; a counter of water/bread you cannot refill. Make the player feel the decision to go down to Egypt is forced, not chosen.
- The Egyptian border: Abram's fear, "אִמְרִי־נָא אֲחֹתִי אָתְּ". Give the player a real moral tension: the choice is presented but history is fixed — play with that honestly (e.g., let the player try alternatives and have the scene gently refuse them, "אבל כך לא היה"). 
- Sarai taken into Pharaoh's house: the saddest point. Slow, silent, the screen narrows. Abram alone receiving sheep, oxen, donkeys, servants, camels — each gift lands like a blow. The player can do nothing; make the inability itself the experience (a prayer interaction that only produces silence at first).
- The plagues on Pharaoh's house, the return of Sarai, the expulsion "קַח וָלֵךְ".
- Ending of the chapter: back in Canaan, back at the altar between Bethel and Ai, Abram calls in the name of ה'. Here the promise: the land, the seed, "וְאֶעֶשְׂךָ לְגוֹי גָּדוֹל". Dawn returns to the palette; Sarai beside him. A promise of hope: a new beginning that will be holier and happier. Do not oversell it — one true line is better than ten.
- Also include the parting from Lot (the quarrel of the shepherds, "הִפָּרֶד נָא מֵעָלָי", Lot choosing Sodom) as the bridge into chapter 2; the player chooses for Lot as if from Lot's eyes, seeing the lush Jordan plain — and then the text notes Sodom's wickedness.

## Chapter 2: הַמִּלְחָמָה — an actual, playable war game to rescue לוט from captivity
- Set up: the war of the four kings vs. the five, Lot captured, the fugitive (midrash: Og) comes to Abram at Elonei Mamre. Abram "וַיָּרֶק אֶת־חֲנִיכָיו יְלִידֵי בֵיתוֹ שְׁמֹנָה עָשָׂר וּשְׁלֹשׁ מֵאוֹת".
- Make a real game with decisions and skill, not a cutscene: suggested design — top-down painterly map of the pursuit from Hebron to Dan to Hovah north of Damascus. Phases: (1) the march: manage pace vs. exhaustion of 318 men, choose route, allies Aner/Eshkol/Mamre. (2) the night: "וַיֵּחָלֵק עֲלֵיהֶם לַיְלָה" — the player splits the force into groups and positions them around the enemy camp (drag units), chooses the moment to strike when torches dim; stealth meter; if detected, fight a tense real-time skirmish (simple but tactile: tap/click to strike, timed parries, drums). (3) the pursuit to Hovah and finding Lot among the captives (a search in a dark camp with a torch radius; find Lot and the captives and the goods). Losing is possible (retry at phase), to make winning meaningful; but keep difficulty fair.
- Aftermath: Malkitzedek king of Shalem brings bread and wine, blesses Abram; the king of Sodom "תֶּן־לִי הַנֶּפֶשׁ וְהָרְכֻשׁ קַח־לָךְ" and Abram's oath "אִם־מִחוּט וְעַד שְׂרוֹךְ־נַעַל". Let the player make the refusal — a gesture of letting go.

## Chapter 3: בְּרִית בֵּין הַבְּתָרִים — establishing the covenant between God and Abram's descendants
- "אַל־תִּירָא אַבְרָם אָנֹכִי מָגֵן לָךְ". Abram's fear and his honesty: "מַה־תִּתֶּן־לִי וְאָנֹכִי הוֹלֵךְ עֲרִירִי".
- The stars: "הַבֶּט־נָא הַשָּׁמַיְמָה וּסְפֹר הַכּוֹכָבִים אִם־תּוּכַל לִסְפֹּר אֹתָם ... כֹּה יִהְיֶה זַרְעֶךָ". Make this the visual peak: the player tilts/drags up into an immense parallax starfield (thousands of stars with depth), tries to count them by tapping — the counter rising, then the stars multiplying beyond counting, with the swelling chord. "וְהֶאֱמִן בַּה' וַיַּחְשְׁבֶהָ לּוֹ צְדָקָה".
- The pieces: the player lays out the heifer, goat, ram, and the birds not divided; the birds of prey descend and the player drives them away ("וַיַּשֵּׁב אֹתָם אַבְרָם") — a small vigilance interaction as the sun goes down.
- The dread: "וְהִנֵּה אֵימָה חֲשֵׁכָה גְדֹלָה נֹפֶלֶת עָלָיו" — the screen darkens; the prophecy of 400 years of exile and the return in the fourth generation, delivered as weighty, slow text; let the player feel the cost that comes with the promise.
- The smoking furnace and the torch of fire passing between the pieces — light moving between them, the only light on screen — the covenant: "לְזַרְעֲךָ נָתַתִּי אֶת־הָאָרֶץ הַזֹּאת מִנְּהַר מִצְרַיִם עַד־הַנָּהָר הַגָּדֹל נְהַר־פְּרָת". Optionally a brief epilogue card for the end of the parasha: the name change אברם→אברהם, שרי→שרה, and the covenant of circumcision, in a few lines; and a closing that gently addresses the player as one of the stars counted that night (this is the emotional landing — earn it, keep it to one or two lines, no kitsch).

# Quality bar
- The text is the heart. Write the Hebrew with care: short lines, rhythm, silence (pauses, slow fades). Each scene should have at most a few sentences on screen at once. Use the verses themselves as the strongest moments.
- Interactions must be *meaningful* to the story (pulling the pegs, placing altar stones, being unable to act when Sarai is taken, splitting the army, driving away the birds, counting the stars). Avoid generic "click to continue" where an action can carry meaning — but do provide a subtle "המשך" where needed, and a chapter menu to replay chapters.
- Transitions: cinematic fades, letterboxing for key moments, slow camera drifts. Grain + vignette overlay globally. Performance: keep canvas layers efficient, cap particle counts on mobile, use requestAnimationFrame properly, pause when tab hidden.
- Test it: open the page in a headless browser (e.g., playwright/chromium if available, or at least run `node --check` on scripts and open with a headless chrome screenshot) and fix any console errors. Verify every chapter is reachable end-to-end, that the war game can be won and lost, and that nothing is hidden by RTL/mobile layout bugs. Take screenshots of each chapter and look at them critically for kitsch or ugliness and improve.
- Include a `README.md` in Hebrew (with an English line) that explains the game and links to the live page https://shfishman.github.io/lech-lecha/ .
- Finally: push to `main`, then check `curl -sI https://shfishman.github.io/lech-lecha/` (Pages may take a minute or two to deploy; retry a few times). Report: the live URL, commit SHA, what each chapter contains, what interactions exist, known limitations, and anything you could not verify.

Take your time and use your full capability. This should be something the user will be proud to share.