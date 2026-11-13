/* Danny location events at the orphanage. Format: see events/engine.js. */
window.DannyEventData = window.DannyEventData || [];

window.DannyEventData.push(
	{
		id: "sendoff",
		title: "Orphanage send-off",
		places: ["orphanage"],
		days: "school",
		windows: [["7:00", "7:30"]],
		chance: 25,
		met: "first",
		teaser:
			"Danny is crossing the main hall towards the front door, bag over one shoulder and camera strap around {his} neck, moving like {he}'s already running late.",
		link: "Say good morning",
		src: `
## 0
=> 10 ?? $dannyEv.firstMeeting
=> 20

## 10
!fx met
You step into {his} path just as {he} reaches the door. {He} stops short, hitches the bag higher on {his} shoulder and gives you a quick, guarded look.
"Oh. Um. Hi." {He} pats the side of the bag, checking for something without opening it. "I'm Danny. Room down the hall. I... have to get going."
<<if $dannyEv.roll lt 40>>Behind you, one of the staff is calling names off a list. Danny's eyes flick towards the voice and {his} shoulders go tight.<</if>>
-> 11: Introduce yourself and say you'll see {him} around
-> 12: Ask about the camera
-> 13: Ask why {he}'s leaving so early

## 11
You tell {him} your name. Danny nods, repeating it under {his} breath like {he}'s filing it somewhere safe.
"Okay. See you around." {He}'s through the door before the words have quite finished.
!fx love+1

## 12
Danny glances down at the camera as if {he}'d forgotten it was there, and something in {his} face loosens.
"It was my gran's. It's old, but it still works better than a phone." {He} turns it so you can see the scuffed lens cap. "The light's good early. That's... that's why I go early."
{He} gives you a small, quick nod and slips out.
!fx love+2

## 13
"Just do," Danny says, a little too fast. {He} looks at the door, then at you, then at the door again. "Bye."
The door swings shut behind {him}.
<<if $dannyEv.roll lt 40>>The staff member with the list doesn't even look up.<</if>>

## 20
=> 21 ?? dannyCont() lte 30
=> 22 ?? dannyLove() gte 15
=> 23

## 21
You say good morning. Danny barely slows. {He}'s already got one hand on the door, the other clamped on the strap of a bag that looks fuller than usual.
"Morning. Can't stop, sorry." {He} doesn't look at you.
-> 21.1: Let {him} go
-> 21.2: Try to keep {him} talking ?? true

## 21.1
You step aside. Danny's "thanks" is almost lost in the creak of the door, but you hear it.
!fx love+1

## 21.2
"I said I can't stop." It comes out sharper than {he} probably meant. {He} goes without another word.
!fx love-1

## 22
Danny actually pauses this time, one hand on the door. "Morning," {he} says, and it sounds like {he} means it.
<<if $dannyEv.roll lt 40>>A pair of younger kids thunder past, and Danny steps closer to the wall to let them by, waiting until they're gone before {he} looks back at you.<</if>>
-> 22.1: Ask what {he}'s hoping to photograph today
-> 22.2: Ask how {he} slept
-> 22.3: Wave {him} off

## 22.1
"There's fog on the river some mornings," {he} says. "If I'm quick I can get it before it burns off." {He} lifts the camera half an inch, a small proud movement. "Wish me luck."
!fx love+2

## 22.2
=> 22.2.1 ?? dannyAcc() gte 40 and dannyLove() gte 30
=> 22.2.2

## 22.2.1
Danny hesitates. "Not great," {he} admits quietly. "It's fine. I'm used to it." {He} gives you a small, tired smile and heads out.
!fx acc+

## 22.2.2
"Fine." The word shuts like a door. Danny adjusts the bag, glances at the hall behind you and leaves without another word.
<<if $dannyEv.roll lt 40>>You realise a member of staff was within earshot.<</if>>
!fx love-1

## 22.3
You give {him} a little wave. Danny returns it, awkward and a bit pleased, and slips out into the morning.
!fx love+1

## 23
"Morning," Danny says, polite and brief, already reaching for the door.
-> 23.1: Say something about the camera
-> 23.2: Ask something personal
-> 23.3: Just nod

## 23.1
Danny's hand stops on the handle. "It's a film camera. Thirty-six shots a roll, so you have to mean it." {He} almost smiles. "See you."
!fx love+1

## 23.2
Danny's face closes over. "I really have to go." And {he} does.
!fx love-1

## 23.3
You nod. Danny nods back and is gone.
`,
	},
	{
		id: "camera",
		title: "Camera check outside the orphanage",
		places: ["domus"],
		days: "school",
		windows: [["7:10", "7:30"]],
		chance: 35,
		met: "first",
		teaser: "Just past the orphanage gate, Danny has stopped on the pavement with {his} camera in both hands, checking it over.",
		link: "Walk over",
		src: `
## 0
=> 1 ?? dannyCont() lte 30
=> 2

## 1
Danny is checking the camera's battery door with quick, distracted fingers. {He} snaps it shut almost as soon as you reach {him}, already turning towards the road.
<<if $dannyEv.firstMeeting>>"Oh. Hi. I'm Danny. From the orphanage." {He} says it on the move.<<else>>"Hey. Can't stop."<</if>>
!fx met
-> 1.1: Ask what {he}'s hoping to shoot
-> 1.2: Ask if {he}'s okay; {he} seems rushed

## 1.1
"Whatever's there," {he} says over {his} shoulder, but {he} gives you a quick backwards glance that isn't unfriendly.
!fx love+1

## 1.2
"I'm fine." {He} walks faster. You don't catch up.

## 2
{He} has the lens cap off and is squinting at the glass, breathing on it and wiping it with the hem of {his} sleeve. The strap is twisted; {he} hasn't noticed.
<<if $dannyEv.firstMeeting>>{He} looks up as you stop beside {him}. "Oh. Hey. I'm Danny. I live here too." A small nod at the orphanage behind you.<<else>>{He} looks up. "Oh. Hey."<</if>>
!fx met
-> 2.1: Ask what {he}'s hoping to shoot today
-> 2.2: Point out the twisted strap
-> 2.3: Ask about {his} family

## 2.1
"The bridge, maybe. There's a gap between the buildings where the sun comes through for about ten minutes." {He} checks the battery one more time. "If I'm quick."
{He} gives you a real smile before {he} goes.
!fx love+2

## 2.2
Danny looks down, untwists the strap and lets out a breath that's almost a laugh. "Thanks. That'd have bugged me all day."
!fx love+1

## 2.3
Danny's hands go still on the camera. "I don't really... talk about that." {He} puts the lens cap back on, a little too carefully. "I should go."
!fx love-1
`,
	},
	{
		id: "sheets",
		title: "Wet sheets (changing sheets / laundry sighting)",
		places: ["orphanage", "orphanageBathroom"],
		days: "any",
		windows: [
			["5:00", "7:09"],
			["19:00", "20:59"],
		],
		chance: c => (c.cont <= 30 ? 30 : 15),
		teaser: "Danny hurries past with a tight bundle of bedding hugged against {his} chest, heading for the washing tubs.",
		link: "Look closer",
		avoid: ["orphanage"],
		src: `
## 0
!fx accident
You get a clearer look than either of you wanted. The bundle is sheets, balled up wet and held as far from {his} clothes as {he} can manage. Danny sees you see it and freezes, mid-step, every line of {him} tense.
=> 1 ?? dannyLove() lt 25 or dannyAcc() lt 30
=> 2

## 1
"It's nothing," {he} says immediately. "I spilled something. It's nothing."
{He} won't meet your eyes.
-> 1.1: Look away and keep walking
-> 1.2: Stare at the bundle
-> 1.3: Say, "Have you thought about just wearing protection?"
-> 1.4: Say you're going to mention it to the staff

## 1.1
You look at the noticeboard as if it's the most interesting thing in the orphanage and walk on. Behind you, quick footsteps, a tap running, a long shaky breath.
Later, Danny is careful not to be anywhere you are. But {he} doesn't look at you like you're dangerous.
!fx acc+
!fx avoid:all:noon

## 1.2
You don't mean to stare, but you do. Danny's face goes red, then white. {He} pushes past you and finishes in the washroom with the door shut. You don't see {him} again all morning.
!fx love-2
!fx avoid:all:noon

## 1.3
Danny's head snaps up. For a second {he} just looks at you, as if you've slapped {him}.
"Right," {he} says flatly. "Thanks for the advice." {He} turns away, and something about the way {he} goes makes you think {he}'s filed you under people who can't be trusted.
!fx forced
!fx avoid:all:noon

## 1.4
"Don't." It's barely a whisper. "Please don't."
You do anyway, later, in what you think is a helpful voice. By evening, two of the younger kids are whispering in the hall, and Danny's door stays shut.
!fx forced
!fx avoid:orphanage:72

## 2
For a long moment, neither of you says anything. Then Danny mutters, "Bad night," to the floor, and shifts the bundle in {his} arms.
-> 2.1: Quietly offer to carry the basket
-> 2.2: Say nothing and give {him} the hallway
-> 2.3: Ask how often this happens
-> 2.4: Say, "You should just wear protection." ?? dannyAcc() lt 40

## 2.1
You pick up the empty laundry basket by the wall and hold it out without a word. Danny looks at it, then at you. Then {he} drops the sheets in.
You carry it to the tubs together. {He} doesn't say thank you, exactly, but {he} stands a little closer than {he} needs to while the water runs.
!fx love+1 acc++

## 2.2
You step back against the wall to let {him} pass and look anywhere else. Danny goes by quickly. At the end of the hall {he} glances back, just once.
!fx acc+

## 2.3
=> 2.3.1 ?? dannyLove() gte 40 and dannyAcc() gte 30
=> 2.3.2

## 2.3.1
Danny's jaw works. "Often enough," {he} says at last. "More when I'm stressed. I'm... handling it." {He} doesn't say anything else, but {he} didn't walk away either.
!fx acc+

## 2.3.2
"Not your business." Danny shoulders past you, and you hear the washroom door lock.
!fx love-1

## 2.4
Danny goes very still. "Yeah," {he} says, in a voice with nothing in it. "I'll get right on that." {He} walks away, and you have the sinking feeling you just closed a door that took a long time to open.
!fx forced
`,
	},
	{
		id: "breakfast",
		title: "Orphanage breakfast line",
		places: ["kitchen"],
		days: "school",
		windows: [["7:00", "7:20"]],
		chance: 50,
		teaser: "Danny is at the end of the breakfast counter, wrapping a slice of toast in a napkin instead of sitting down.",
		link: "Join {him} at the counter",
		src: `
## 0
Orphans jostle around the toaster. Danny takes the toast, an apple and nothing that needs a plate or a chair. {He}'s already half turned towards the door.
<<if dannyCont() lte 30>>{He} eats standing up, fast, and keeps glancing at the clock over the fridge.<<else>>{He} eats standing up, one eye on the clock over the fridge.<</if>>
-> 1: Offer to save {him} a seat
-> 2: Offer to walk to school together
-> 3: Just say good morning

## 1
=> 1.1 ?? dannyLove() gte 30 and dannyCont() gt 30
=> 1.2

## 1.1
Danny hesitates, then sits on the very edge of the bench beside you, bag on {his} lap. It lasts five minutes. It's still five minutes more than {he} usually stays.
!fx love+2

## 1.2
"Thanks, but I'm going." {He} lifts the toast in a small salute and is gone.

## 2
=> 2.1 ?? dannyLove() gte 35 and dannyCont() gt 30
=> 2.2

## 2.1
"Yeah. Okay," Danny says, sounding surprised at {himself}. You walk together as far as the school gate, mostly in silence. It's a comfortable silence.
!fx love+2
!fx <<pass 10>>

## 2.2
"I go early," Danny says. "It's... easier. Maybe another time." {He} goes, toast in hand.

## 3
"Morning," Danny says through a mouthful of toast, and almost smiles.
<<if dannyCont() lte 30>>Then {he}'s out of the door before you can say anything else.<</if>>
!fx love+1
`,
	},
	{
		id: "chores",
		title: "Shared morning chore sighting",
		places: ["garden", "kitchen"],
		days: "any",
		windows: [["6:00", "7:59"]],
		chance: 30,
		teaser: "Danny is doing {his} morning chore, hauling a rubbish bag towards the bins at double speed.",
		link: "Lend a hand",
		src: `
## 0
You fall in beside {him}. Danny's on bins this week, by the look of it, and {he} wants it done. A couple of other orphans are around, sweeping and arguing about whose turn it is.
=> 1 ?? dannyLove() gte 25
=> 2

## 1
"Thanks," Danny says, while you hold the lid. "It's meant to be two of us, but..." {He} shrugs. "Nobody else turned up." It's practically a conversation, for {him}.
-> 1.1: Chat about nothing while you work
-> 1.2: Pull {him} aside to ask about the sheets and the bathroom

## 1.1
You trade a few words about the weather and the broken tap in the bathroom. Danny ties off the last bag and gives you a small nod before {he} goes in.
!fx love+1

## 1.2
Danny's face shuts like a slammed door. "Not here," {he} hisses, glancing at the others. {He} finishes the last bag alone and goes in without looking at you.
!fx love-2 acc-

## 2
Danny takes the help without a word, eyes on the bins, on the others, anywhere but you. The job's done in half the time.
-> 2.1: Leave it at that
-> 2.2: Pull {him} aside to ask about the sheets and the bathroom

## 2.1
Danny mutters "thanks" and goes in.
!fx love+1

## 2.2
"I don't know what you're talking about." Loud enough for the others to hear, flat enough to end it. {He} walks off.
!fx love-2 acc-
`,
	},
	{
		id: "commonroom",
		title: "Orphanage common room evening",
		places: ["orphanage"],
		days: "any",
		windows: [["16:00", "20:59"]],
		when: c => c.loc === "room",
		req: c => c.love >= 10,
		chance: 35,
		avoid: ["orphanage"],
		teaser:
			"In a corner of the main hall, Danny is hunched over {his} camera, flicking through shots on its little screen while the evening noise goes on around {him}.",
		link: "Sit down near {him}",
		src: `
## 0
Danny glances up when you sit down. There are other orphans everywhere: a card game, someone crying over homework, a staff member doing a head count.
<<if dannyCont() lte 30>>{He}'s fidgety tonight, one knee bouncing.<</if>>
=> 1 ?? dannyCont() lte 30 and $dannyEv.roll lt 50
=> 2 ?? dannyLove() gte 30
=> 3

## 1
Danny suddenly stands, tucks the camera under {his} arm and says, "Back in a minute," to no one in particular.
-> 1.1: Wait for {him}
-> 1.2: Follow {him}
-> 1.3: Ask loudly if {he}'s okay

## 1.1
You wait. Ten minutes later Danny comes back, sits down a bit further away than before and goes back to the camera. After a while, {he} turns the screen so you can see a photo of the garden in the rain.
!fx love+1

## 1.2
You get halfway down the corridor before Danny turns round. "Seriously?" {he} says, low and furious. {He} doesn't come back to the hall that evening.
!fx love-2
!fx avoid:orphanage:3

## 1.3
Heads turn. Danny goes red to the ears. "I'm fine," {he} says, and leaves. You don't see {him} again tonight.
!fx love-2
!fx avoid:orphanage:3

## 2
Danny shifts over so you can see the screen. "Don't laugh," {he} murmurs, voice pitched under the noise. It's a photo of the orphanage roof, the gutter full of pigeons.
-> 2.1: Say it's a good shot, and mean it
-> 2.2: Ask how {he} picks what to photograph
-> 2.3: Ask about {his} nights, right here

## 2.1
"It's crooked," Danny says, but {he} looks pleased. {He} shows you three more.
!fx love+2

## 2.2
"Things nobody else looks at," Danny says, after thinking about it. "Then they're mine." {He} goes a bit pink, as if {he} said too much.
!fx love+1 stress-

## 2.3
Danny's eyes dart to the staff member a few metres away. "Not here." {He} switches the camera off and leaves, and doesn't come back.
!fx love-2 acc-
!fx avoid:orphanage:3

## 3
Danny gives you a short nod and goes back to the screen, shoulders hunched. With so many people around, {he}'s clearly not in a talking mood.
-> 3.1: Sit quietly beside {him} for a while
-> 3.2: Ask what {he}'s looking at

## 3.1
You sit. Danny keeps scrolling. After a while {his} shoulders come down a little.
!fx love+1

## 3.2
"Just photos." {He} angles the screen away. Not tonight, then.
`,
	}
);
