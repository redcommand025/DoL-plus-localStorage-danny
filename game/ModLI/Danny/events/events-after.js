/* Danny location events: aftermath, after school, the studio. Format: see events/engine.js.
 * This file loads first, so the aftermath scene takes priority over everything else. */
window.DannyEventData = window.DannyEventData || [];

window.DannyEventData.push(
	{
		id: "aftermath",
		title: "Post-accident aftermath",
		places: ["hallways", "library", "canteen", "schoolFront", "schoolRear", "orphanage", "kitchen", "domus"],
		days: "any",
		/* later the same day (at least an hour on) or the next morning, after DannyEvents.accident() */
		when: c => {
			const a = c.state.accident;
			if (!a) return false;
			return (c.day === a.d && c.hour >= a.h + 1) || (c.day === a.d + 1 && c.hour < 12);
		},
		chance: 100,
		onBegin: s => {
			delete s.accident;
		},
		teaser: "Danny is here, keeping to the edge of things with {his} bag held close against {his} side. {He} sees you and looks away fast.",
		link: "Go to {him}",
		src: `
## 0
Up close, Danny looks like {he} hasn't slept. {He} won't meet your eyes, and {his} grip on the bag strap is white-knuckled.
-> 1: Give {him} space; just say hi and keep going
-> 2: Quietly offer practical help: spare clothes, or a cover story if anyone asks
-> 3: Try to talk about what happened
-> 4: Tell {him} {he} should just wear protection

## 1
"Hi," you say, normal as anything, and keep walking. Behind you, you hear Danny let out a long breath.
=> 1.1 ?? dannyLove() gte 25

## 1.1
Later, a message turns up in your bag: a small print of the orphanage garden, and on the back in pencil, <i>thanks</i>.
!fx acc+ love+1

## 2
=> 2.1 ?? dannyLove() gte 25
=> 2.2

## 2.1
You keep your voice low: you've got a spare hoodie, and if anyone asks, Danny was helping you with something. Danny looks at you for a long moment.
"...Okay," {he} says. "Thanks. I mean it." It's barely above a whisper.
!fx acc++ love+1

## 2.2
"I don't need anything," Danny says stiffly. But {he} doesn't walk away straight off, and when {he} does, it isn't angry.
!fx acc+

## 3
=> 3.1 ?? dannyLove() gte 50 and dannyAcc() gte 40
=> 3.2

## 3.1
Danny is quiet for so long you think {he} won't answer. "It's a medical thing," {he} says finally. "It's been worse lately. Stress makes it worse." {He} swallows. "I don't want to talk about it more than that. But... thanks for not being weird."
!fx acc++

## 3.2
"Please don't." Danny's voice cracks on it. {He} turns away and is gone before you can say anything else.
!fx love-1 stress+

## 4
=> 4.1 ?? dannyAcc() lte 15 and dannyLove() lt 40
=> 4.2

## 4.1
Danny's face goes completely still. "Right," {he} says. "Thanks." There's nothing in {his} voice at all. {He} walks away, and you have the feeling {he}'s decided something about you.
!fx forced

## 4.2
Danny's mouth tightens. "I know," {he} says. "I'm dealing with it. My way." {He} leaves.
!fx love-1 acc-
`,
	},
	{
		id: "bleachers",
		title: "After-school photography on the field",
		places: ["schoolRear"],
		days: "school",
		windows: [["15:00", "15:19"]],
		req: c => c.weather === "clear" && c.love >= 10,
		chance: 40,
		teaser: "Out past the courtyard, Danny is sitting alone on the empty spectator steps by the field, camera raised at the sky.",
		link: "Join {him} on the steps",
		src: `
## 0
The field is nearly empty, the light going long and gold. Danny lowers the camera as you sit down.
<<if dannyCont() lte 30>>{He} keeps checking the time.<</if>>
=> 1 ?? dannyCont() lte 30 and dannyAcc() lt 60
=> 2

## 1
"I can't stay long," Danny says. {He} takes two more shots of the empty goalposts, then packs up. "Next time, maybe."
!fx love+1

## 2
=> 3 ?? dannyLove() gte 30
Danny gives you a nod and goes back to shooting the clouds.
-> 2.1: Sit and watch
-> 2.2: Ask to see a shot

## 2.1
You sit in silence. It's nice.
!fx love+1 stress-

## 2.2
Danny shows you one: the shadow of the goalposts stretched across the grass like a ladder.
!fx love+1

## 3
"Look at this." Danny shows you a shot of the empty stands, rows of seats catching the light. "Like teeth," {he} says, pleased. <<if dannyAcc() gte 60>>{He} seems relaxed, in no hurry at all.<</if>>
-> 3.1: Offer to be in a photo
-> 3.2: Ask what {he}'s going to do with them

## 3.1
=> 3.1.1 ?? dannyLove() gte 45
=> 3.1.2

## 3.1.1
Danny hesitates, then says, "Um. Okay. Just... sit on the rail and look at the field." It takes ten minutes and a lot of muttering about light. When {he} shows you the result, you look like someone in a film.
!fx love+2

## 3.1.2
"I don't really do people," Danny says. "Sorry." {He} doesn't seem upset that you asked.

## 3.2
"Niki says if I get enough good ones I could put a little show together. At the studio." {He} looks at {his} shoes. "Probably not."
-> 3.2.1: Tell {him} {he} should
-> 3.2.2: Joke that {he}'d better not need to run off halfway through the opening

## 3.2.1
"Maybe," Danny says. It sounds like {he}'s thinking about it.
!fx love+2

## 3.2.2
Danny's face falls, and {he} goes quiet. You've hit something you didn't mean to.
!fx love-1 acc-
`,
	},
	{
		id: "studio",
		title: "Niki's studio critique (photography club stand-in)",
		places: ["studio"],
		days: "any",
		when: c => c.loc === "work",
		chance: 35,
		teaser: "At the back of the studio, Niki has Danny's prints spread out on the light table, and a couple of the other assistants are crowded round looking.",
		link: "Join the critique",
		src: `
## 0
Danny is more animated than you've ever seen {him}, pointing at grain and contrast, arguing about a crop with Niki. Here, about the camera, {he}'s not guarded at all.
=> 1 ?? dannyCont() lte 30 and $dannyEv.roll lt 50
-> 2: Say what you like about {his} shots
-> 3: Ask {him} to show you how {he} framed one

## 1
Halfway through Niki's comments, Danny goes quiet, then says, "Sorry, one sec," and slips out. One of the assistants raises an eyebrow and says something about "always disappearing." Danny clearly heard it.
-> 1.1: Change the subject loudly
-> 1.2: Join in the joke

## 1.1
You ask the assistant a long, boring question about lenses. By the time Danny comes back, everyone's moved on. {He} catches your eye and gives you the tiniest nod.
!fx love+2 acc+

## 1.2
The assistants laugh. When Danny comes back {he} goes straight to the darkroom and doesn't come out while you're there.
!fx love-2 acc-

## 2
Danny listens to everything you say with a kind of hungry attention, and argues with half of it. It's great.
!fx love+2

## 3
Danny lifts the camera, puts your hands in the right place, and talks you through the rule of thirds as if it's a secret. Niki watches, amused.
!fx love+2
`,
	}
);
