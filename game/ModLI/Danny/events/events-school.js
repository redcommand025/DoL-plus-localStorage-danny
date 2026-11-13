/* Danny location events at school. Format: see events/engine.js. */
window.DannyEventData = window.DannyEventData || [];

window.DannyEventData.push(
	{
		id: "stairwell",
		title: "Stairwell / side entrance",
		places: ["schoolFront"],
		days: "school",
		windows: [["7:35", "7:50"]],
		chance: 30,
		avoid: ["route"],
		teaser: "While everyone else funnels through the main doors, Danny peels off towards the side entrance and the back stairs.",
		link: "Follow {him}",
		src: `
## 0
The side stairwell is quieter: no shoving, no crowd, and the toilets are right at the foot of the stairs. Danny takes the steps two at a time.
-> 1: Follow the same way without saying anything
-> 2: Call out to {him} across the courtyard

## 1
You take the side stairs too, a few steps behind. Danny glances back, sees you, and doesn't speed up. At the top, {he} holds the door.
!fx love+1

## 2
=> 2.1 ?? dannyLove() gte 20
=> 2.2

## 2.1
Danny turns, waits for you on the first step. "It's quicker this way," {he} says, a little defensively, and then, "You can come if you want."
!fx love+1

## 2.2
Half the courtyard turns to look where you're shouting. Danny flinches, raises a hand without really looking and ducks inside.
!fx love-1
`,
	},
	{
		id: "hallway",
		title: "Hallway pass-by (near the bathrooms)",
		places: ["hallways"],
		days: "school",
		windows: [["7:40", "7:50"]],
		chance: c => (c.cont <= 30 ? 30 : 15),
		avoid: ["route"],
		teaser: "Danny is coming down the corridor from the direction of the toilets, head slightly down, adjusting the strap of {his} camera bag.",
		link: "Say hello",
		src: `
## 0
<<if dannyCont() lte 30>>{He} looks <<if $dannyEv.roll lt 50>>relieved, the tension just starting to drain out of {his} shoulders<<else>>tense, walking with careful, quick steps<</if>>.<<else>>{He}'s moving quickly, the way people do when they want to get somewhere before the crowd.<</if>>
-> 1: Nod
-> 2: Wave and call {his} name
-> 3: Ask if {he}'s heading to class
-> 4: Say something about the camera
-> 5: Comment that {he}'s always coming out of the toilets at this time
-> 6: Ignore {him}

## 1
Danny nods back. <<if dannyLove() gte 20>>{He} even slows down for half a step.<</if>>
!fx love+1

## 2
=> 2.1 ?? dannyLove() gte 20 and dannyCont() lte 30
=> 2.2 ?? dannyLove() gte 20
=> 2.3

## 2.1
Danny slows, looks at you, opens {his} mouth, and then {his} eyes slide past you towards the toilets. "Sorry, I'll... one sec." {He} turns on {his} heel and goes back the way {he} came.

## 2.2
Danny slows. "Hey." It's small, but {he} stops long enough for you to catch up. "Science first, right? Ugh."
!fx love+1

## 2.3
Danny gives you a brief nod and keeps going.

## 3
"Yeah." Danny keeps walking, but lets you walk with {him} for a bit.
-> 3.1: Leave it there
-> 3.2: Keep asking questions

## 3.1
At the corner {he} gives you a little wave and peels off.
!fx love+1

## 3.2
Danny answers in single words, walking faster and faster. In the end {he} just says, "I'm in a hurry, okay?"
!fx love-1

## 4
"Got a new roll of film in," Danny says, and pats the bag. It's one line, but it comes with half a smile.
!fx love+1

## 5
=> 5.1 ?? dannyLove() lt 30
=> 5.2

## 5.1
Danny stops dead. Something closes in {his} face. "Okay," {he} says. "Weird thing to notice." {He} walks off, and for the next few days you don't see {him} in this corridor at all.
!fx love-2
!fx avoid:route:72

## 5.2
Danny gives you a long look. "Yeah, well. Better early than sorry," {he} says quietly, and walks on. It wasn't a joke.
!fx love-1

## 6
You let {him} pass. Danny doesn't seem to notice.
`,
	},
	{
		id: "toilets",
		title: "Pre-class bathroom timing overlap",
		places: ["toilets"],
		days: "school",
		windows: [["7:45", "7:55"]],
		chance: 30,
		avoid: ["route"],
		teaser: "Danny comes through the door to the toilets at the same moment you do, and you both do the awkward dance of who goes first.",
		link: "Go in",
		src: `
## 0
Danny ducks in ahead of you. <<if dannyCont() lte 30>>{He}'s out again almost before you've washed your hands, drying {his} on {his} jumper on the way.<<else>>{He} takes a while. You end up at the sinks at the same time on the way out.<</if>>
-> 1: Say nothing
-> 2: "Long morning?"
-> 3: Comment on how long {he} was in there

## 1
You nod at each other in the mirror, the way everyone does. Normal. Danny seems to appreciate normal.
!fx love+1

## 2
=> 2.1 ?? dannyLove() gte 13
=> 2.2

## 2.1
Danny snorts. "Long week, and it's Monday in spirit." {He} gives you a crooked half-smile on the way out.
!fx love+1

## 2.2
Danny gives you a startled look, mumbles something and leaves.

## 3
Danny's ears go red. "Are you timing me?" {He} leaves without drying {his} hands.
!fx love-2
!fx avoid:route:48
`,
	},
	{
		id: "library",
		title: "Library before class (with bathroom return)",
		places: ["library"],
		days: "school",
		windows: [["7:50", "8:55"]],
		chance: c => (c.love >= 25 ? 70 : 50),
		avoid: ["library"],
		teaser: "Danny is at {his} usual back table by the window, camera on the desk in a patch of early light, looking like {he} arrived early on purpose.",
		link: "Go over",
		src: `
## 0
The library is nearly empty. Danny has a textbook open that {he} definitely isn't reading; the camera's little screen is lit up beside it. The toilets are just across the corridor.
-> 1: Sit at the next table without forcing a conversation
-> 2: Ask what {he}'s looking at
-> 3: Ask how {his} morning was at the orphanage

## 1
You sit nearby and open your own book. Danny glances over, then goes back to {his} camera. After a while, {he} slides it across the table so you can see a shot of frost on the bike racks.
!fx love+2
=> 10 ?? dannyCont() lte 25 and $dannyEv.roll lt 60

## 2
=> 2.1 ?? dannyLove() gte 20
=> 2.2

## 2.1
Danny turns the screen towards you. "This morning. The light came through the fence like stripes." {He} flicks through a few more, explaining what {he} wanted and where {he} missed. It's the most you've heard {him} say at once.
<<if dannyCont() lte 30>>{He} keeps losing the thread, though, glancing at the door.<</if>>
!fx love+2
=> 10 ?? dannyCont() lte 25 and $dannyEv.roll lt 60

## 2.2
Danny glances up. "Hey." {He} tilts the screen a little. "Just shots from this morning. Nothing good." Then {he} goes back to it.
!fx love+1
=> 10 ?? dannyCont() lte 25 and $dannyEv.roll lt 40

## 3
=> 3.1 ?? dannyLove() gte 45 and dannyAcc() gte 40
=> 3.2 ?? dannyLove() gte 30
=> 3.3

## 3.1
"Busy," Danny says. "It's always busy." {He} turns {his} pencil over and over. "I have to be... careful with timing. In the mornings. That's why I come here early." {He} doesn't explain further, and doesn't look at you, but {he} said it.
-> 3.1.1: Just nod
-> 3.1.2: Ask what {he} means

## 3.1.1
You nod. Danny lets out a breath {he} seems to have been holding for a while.
!fx acc+ love+1

## 3.1.2
Danny's face shutters. "Nothing. Forget it." The moment's gone.

## 3.2
"Loud," Danny says. "Somebody's alarm went off at five. I got some shots of the garden though." {He} shows you one.
!fx love+1

## 3.3
"Fine." Danny picks up the camera again. The conversation's over.

## 10
Mid-sentence, Danny stops. {His} face goes still. Then {he}'s packing up, quick and clumsy, shoving the camera into {his} bag. "Be right back," {he} says, already moving.
-> 10.1: Wait at the table
-> 10.2: Follow at a distance
-> 10.3: Let {him} go and get on with your work

## 10.1
You wait.
=> 11 ?? dannyCont() lte 15 and $dannyEv.roll lt 30
=> 12

## 10.2
=> 10.2.1 ?? dannyLove() lt 40
=> 10.2.2

## 10.2.1
You follow {him} into the corridor. At the toilet door Danny turns, sees you, and the look on {his} face makes you stop dead. {He} goes in without a word. {He} doesn't come back to the library, and {his} back table stays empty for days.
!fx love-2
!fx avoid:library:72

## 10.2.2
You drift into the corridor and wait by the noticeboard, near but not too near. When Danny comes out, {he} sees you, hesitates, then gives you a small nod. You walk back in together.
!fx love+1

## 10.3
You let {him} go. By the time the bell goes, {his} bag is back at the table but Danny isn't, quite; {he} slides in at the last second, breathless.

## 11
!fx accident
When Danny comes back, {his} hoodie is gone, tied around {his} waist instead, and {he}'s holding {his} bag very carefully against {his} side. {He} sits down without looking at you. {His} hands aren't quite steady.
-> 11.1: Pretend not to notice
-> 11.2: Quietly ask, "You good?"
-> 11.3: Offer to help, quietly
-> 11.4: Ask what happened, right out

## 11.1
You turn a page. Danny turns a page. After a while, {his} hands stop shaking.
!fx acc+

## 11.2
=> 11.2.1 ?? dannyLove() gte 30
=> 11.2.2

## 11.2.1
"Yeah," Danny says, very quietly. Then, "No. But I will be." {He} gives a tiny shrug. "Thanks for asking normal."
!fx acc+ love+1

## 11.2.2
"Fine." Danny's eyes stay on the table.

## 11.3
=> 11.3.1 ?? dannyLove() gte 30 or dannyAcc() gte 30
=> 11.3.2

## 11.3.1
You say, low, that you've got a spare jumper in your locker if {he} wants it. Danny looks at you for a long second. "...Yeah. Okay. Thanks."
!fx love+1 acc++

## 11.3.2
"I'm fine," Danny says. "I don't need help." The words are steady. {His} face isn't.

## 11.4
=> 11.4.1 ?? dannyLove() lt 40 or dannyAcc() lt 30
=> 11.4.2

## 11.4.1
Danny's face goes blank. "Nothing happened." {He} packs up and leaves. You don't see {him} at the back table again for several days.
!fx love-2 acc-
!fx avoid:library:72

## 11.4.2
Danny flinches, but stays. "Later," {he} says. "Not here. Please."
!fx love-1

## 12
<<if dannyCont() lte 15>>Danny is gone a long time.<<else>>Danny is back in a few minutes.<</if>> {He} sits back down, pulls the camera back out and picks up where {he} left off, as if nothing happened. Maybe nothing did.
!fx love+1
`,
	},
	{
		id: "scienceEarly",
		title: "Science class early seat",
		places: ["scienceEarly"],
		days: "school",
		windows: [["8:30", "8:59"]],
		chance: 80,
		teaser: "Danny is already in {his} seat, bag tucked under the desk, double-checking something inside it.",
		link: "Sit next to {him}",
		src: `
## 0
No crowd, no fighting over seats. You take the one beside {him}.
<<if dannyCont() lte 30>>Danny shifts in {his} chair, can't seem to get comfortable, checks the bag again.<</if>>
=> 1 ?? dannyLove() gte 30
=> 2 ?? dannyLove() gte 10
=> 3

## 1
"Morning," Danny says, and then, before you can answer, "I was up till two last night developing a roll. Niki let me use the darkroom." {He} looks wrecked and pleased about it.
-> 1.1: Ask how the photos came out
-> 1.2: Tell {him} {he} needs more sleep

## 1.1
"Two good ones out of thirty-six," {he} says. "Which is a really good roll." {He} shows you a print from {his} bag, a pigeon on a lamp post, perfectly sharp.
!fx love+2

## 1.2
"Yeah, yeah." But {he} smiles.
!fx love+1

## 2
Danny gives you a small nod. "Morning."
!fx love+1

## 3
Danny glances at you, then back at {his} bag. That's all.
`,
	},
	{
		id: "scienceLab",
		title: "Science class lab partner",
		places: ["scienceLesson"],
		days: "school",
		/* lab days: Time.weekDay 1 is Sunday, so 3 and 5 are Tuesday and Thursday */
		when: c => [3, 5].includes(c.weekDay) && c.minute < 5,
		chance: 40,
		teaser: 'Sirris is pairing people up for the practical, reading names off a list. "...and Danny, with you."',
		link: "Join Danny at the bench",
		src: `
## 0
Danny is already pulling on goggles at a bench near the back. {He} slides the worksheet over to you without a word: titration, burettes, everything that can go wrong.
=> 1 ?? dannyCont() lte 30 and $dannyEv.roll lt 60
=> 2 ?? dannyLove() gte 40
=> 3

## 1
Halfway through, Danny starts shifting from foot to foot. Then {he} sets the burette down very carefully. "I need to... I'll be quick," {he} whispers, and goes to Sirris, who waves {him} out.
-> 1.1: Carry on and cover for {him} smoothly
-> 1.2: Loudly ask where your partner's gone

## 1.1
You keep the titration going and jot down both sets of readings. When Sirris comes round, you say Danny's just getting more indicator. When Danny gets back {he} sees the finished table and stares at you. "Thanks," {he} breathes.
!fx love+2 acc+
!fx <<scienceskill 2>><<gscience>>

## 1.2
A few heads turn. Somebody snickers. When Danny comes back {his} face is red, and {he} doesn't speak to you for the rest of the lesson.
!fx love-2

## 2
It goes well. Danny's careful and quick, and halfway through {he} says, "Here, swirl it while I drip, it's easier," and shows you how to read the meniscus properly. You get the cleanest result in the class.
!fx love+2
!fx <<scienceskill 3>><<gscience>>

## 3
Danny works quietly and efficiently, talking only to read out numbers. It's not chatty, but it's easy.
!fx love+1
!fx <<scienceskill 1>><<gscience>>
`,
	},
	{
		id: "scienceSeat",
		title: "Science class: seat next to Danny (with continence check)",
		places: ["scienceLesson"],
		days: "school",
		when: c => c.minute < 5,
		chance: 75,
		teaser: "Danny is at {his} usual desk as the class files in, bag tucked under {his} chair.",
		link: "Head for the seat next to Danny",
		onBegin: s => {
			/* a second, decorrelated roll from the same number: about 40% of seats are taken */
			s.seatTaken = (s.roll * 7) % 100 < 40;
		},
		src: `
## 0
=> 20 ?? $dannyEv.seatTaken
=> 10

## 10
You slide into the seat beside {him}.
<<if dannyLove() gte 10>>Danny gives you a small nod.<<else>>Danny barely looks up, busy laying out {his} notes and checking the camera in {his} bag.<</if>>
-> 30: Settle in for the lesson

## 20
A classmate has dumped their bag on the seat beside Danny and is chatting over their shoulder.
=> 21 ?? dannyLove() gte 15 and dannyCont() gt 10 and $dannyEv.roll lt (20 + dannyLove())
-> 22: Ask the student to move
-> 23: Tell them to move. Now. ?? $submissive lte 850
-> 24: Ask, very nicely and very nervously ?? $submissive gte 1150
-> 25: Find another seat

## 21
Before you can say anything, Danny clears {his} throat. "They were going to sit here," {he} says quietly, to the other student. The student shrugs and moves. Danny doesn't look at you, but {his} ears are a bit pink.
!fx love+1
-> 30: Sit down

## 22
=> 22.1 ?? $dannyEv.roll lt Math.clamp($cool / 4, 10, 90)
=> 22.2

## 22.1
The student looks you up and down, decides you're not worth arguing with, and moves. You sit next to Danny.
<<if dannyLove() gte 10>>{He} nods.<</if>>
-> 30: Settle in

## 22.2
"I was here first." The student doesn't budge. You end up two rows back, looking at the back of Danny's head.
-> 31: Sit through the lesson

## 23
You loom. The student moves, fast. Danny watches the whole thing with an unreadable face.
<<if dannyAcc() lt 30>>{He} edges {his} chair a few centimetres away when you sit.<</if>>
!fx <<if dannyAcc() lt 30>><<npcincr Danny love -1>><<llove "Danny">><</if>>
-> 30: Sit down

## 24
You ask in a small voice if maybe, possibly, they wouldn't mind. They roll their eyes, but they move. Danny gives you a sympathetic look.
-> 30: Sit down

## 25
You take a seat a couple of rows back. Danny glances round once, as if checking where you went.
-> 31: Sit through the lesson

## 30
Sirris starts the lesson.
=> 40 ?? dannyCont() lte 10 and $dannyEv.roll lt 35
=> 32 ?? dannyCont() lte 30
=> 33

## 31
Sirris starts the lesson. From back here, you can see Danny <<if dannyCont() lte 30>>shifting in {his} seat, and at one point {he} slips out with a quick word to Sirris and comes back a few minutes later<<else>>taking careful notes<</if>>.

## 32
Twenty minutes in, Danny is restless, shifting, tapping {his} pen. Then {he} raises {his} hand and mumbles an excuse to Sirris.
<<if dannyLove() gte 20>>As {he} gets up {he} mutters to you, "Sorry. Be right back."<</if>>
{He}'s gone five minutes, and slides back in with {his} eyes on the desk.
-> 32.1: Slide your notes over so {he} can catch up
-> 32.2: Raise an eyebrow at {him}

## 32.1
Danny copies the missed part in silence. At the end, {he} pushes your notes back with a tiny "thanks."
!fx love+1

## 32.2
Danny pretends not to see.

## 33
The lesson goes by. Danny takes careful notes and occasionally points something out in the textbook to you.
!fx love+1

## 40
!fx accident
Midway through, Danny goes suddenly, completely still. {His} face drains of colour. Then {he}'s on {his} feet, bag held low in front of {him}, muttering something to Sirris on {his} way to the door. {He} doesn't come back for the rest of the lesson.
You're fairly sure you're the only one who noticed what happened.
=> 41 ?? dannyLove() gte 25
-> 42: Get on with the lesson

## 41
After class you find Danny by the lockers, in different trousers, shoulders hunched, bag clutched tight.
-> 41.1: Quietly offer {him} the spare clothes in your locker
-> 41.2: Say nothing; just walk past normally
-> 41.3: Ask if {he}'s okay
-> 41.4: Tell {him} {he} should just wear protection

## 41.1
Danny stares at you. "I already... I had spares." A pause. "But. Thanks. Seriously." {He} looks at the floor, then, very briefly, at you.
!fx love+1 acc++

## 41.2
You walk past as if it's any other day. Out of the corner of your eye, you see Danny's shoulders come down a little.
!fx acc+

## 41.3
=> 41.3.1 ?? dannyAcc() gte 30
=> 41.3.2

## 41.3.1
"No," Danny says. "But I will be." {He} manages a crooked attempt at a smile. "Don't... make it a thing. Okay?"
!fx acc+

## 41.3.2
"Fine. Why wouldn't I be?" Danny turns away, busy with {his} locker.
!fx love-1

## 41.4
=> 41.4.1 ?? dannyAcc() lt 20 and dannyLove() lt 50
=> 41.4.2

## 41.4.1
Danny's face goes completely blank. "Right," {he} says. {He} shuts the locker and walks away without another word.
!fx forced

## 41.4.2
Danny flinches. "I know my options," {he} says stiffly. "I'll handle it." It stings, but it's not a door slammed shut.
!fx love-1 acc-

## 42
You keep your eyes on the board. Whatever happened, it's Danny's to tell.
`,
	},
	{
		id: "canteen",
		title: "Canteen edge seat",
		places: ["canteen"],
		days: "school",
		windows: [["12:00", "12:59"]],
		when: c => c.loc === "canteen",
		chance: 40,
		teaser: "Danny is at the very end of a table by the door, camera beside {his} tray, eating fast.",
		link: "Sit nearby",
		src: `
## 0
You put your tray down a seat away. Danny looks up, then back down.
=> 1 ?? dannyCont() lte 30
=> 2 ?? dannyLove() gte 25
=> 3

## 1
Danny finishes {his} lunch in about four bites, mumbles "see you," and is gone towards the corridor before you've opened your drink.

## 2
"Hey." Danny nudges the camera a few centimetres towards you. "Took this on the way in." It's a puddle with the whole sky in it.
-> 2.1: Talk about photos
-> 2.2: Offer {him} half your dessert
-> 2.3: Comment on how fast {he} eats

## 2.1
You end up talking about nothing much, photos, Sirris's terrible jokes, the leak in the art room, until the bell. Danny stays the whole time.
!fx love+2

## 2.2
Danny blinks. "Oh. Um. Sure." {He} takes it, and you catch the start of a smile.
!fx love+1

## 2.3
Danny's fork stops. "I'm just hungry," {he} says, a bit too quickly. {He} finishes and leaves.
!fx love-1

## 3
Danny nods, keeps eating. You trade a couple of sentences about the food. Then {he}'s done and packing up.
-> 3.1: Offer to sit with {him} again tomorrow
-> 3.2: Let {him} go

## 3.1
"Maybe," Danny says. It sounds more like yes than no.
!fx love+1

## 3.2
"See you," Danny says.
`,
	},
	{
		id: "rainBag",
		title: "Rainy day spare clothes",
		places: ["hallways", "schoolFront"],
		days: "school",
		windows: [["8:00", "15:00"]],
		req: c => c.weather === "rain" && c.love >= 15,
		chance: 35,
		teaser:
			"Danny shakes rain off {his} hood. {His} bag looks bulkier than usual<<if dannyCont() lte 30>>, and a folded plastic bag pokes out of the top, a spare jumper visible inside it<</if>>.",
		link: "Go over",
		src: `
## 0
Danny looks damp and grumpy. "Hate this weather," {he} says. "Bad light."
-> 1: Ask what's in the bag
-> 2: Ignore the bag and talk about the rain
-> 3: Ask straight out if it's spare clothes and why

## 1
=> 1.1 ?? dannyLove() gte 35
=> 1.2

## 1.1
Danny hesitates, then shrugs one shoulder. "Spare stuff. Just in case." {He} doesn't say in case of what, and you don't ask.
!fx acc+

## 1.2
"Just stuff." Danny zips the bag the rest of the way. "Books."

## 2
You complain about the rain together. It's surprisingly companionable.
!fx love+1

## 3
Danny's face closes. "Why does it matter?" {He} hitches the bag higher and goes, and the next time the subject comes near, {he} steers well clear.
!fx acc-
`,
	}
);
