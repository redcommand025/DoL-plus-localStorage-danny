/* Danny room conversations: Hobbies and weekend plans. Format: see talk/engine.js. */
window.DannyTalkData = window.DannyTalkData || [];

window.DannyTalkData.push({
	id: "hobbies.sunrise",
	topic: "hobbies",
	title: "The sunrise plan",
	src: `
## 0
Danny has a bus timetable spread out on {his} bed, and a tide table, and a crumpled weather forecast torn out of a newspaper. {He}'s drawing circles on all three with a red pen.
"I want to photograph the sunrise at the beach," {he} says. "This weekend. If the tide's out and it's not cloudy and the first bus actually comes." {He} looks at the pile of paper. "That's a lot of ifs."
-> 1: Offer to help {him} plan it properly
-> 2: Ask why the sunrise, and not the sunset
-> 3: Ask if {he}'s allowed out that early
-> 4: Tell {him} you love the beach ?? $swimmingskill gte 200
-> 5: Say it sounds like a lot of effort for one photo

## 1
You sit down on the bed and pull the tide table towards you. Danny shuffles over to make room, looking pleased and slightly surprised.
"Okay," {he} says. "Sunrise is at six forty-two on Saturday. I need to be there by six fifteen to set up. The first bus is at five fifty. It takes twenty minutes." {He} looks at you. "If it comes."
-> 1.1: Check the tide times with {him}
-> 1.2: Suggest a backup plan if the bus doesn't come

## 1.1
You run your finger down the tide table. "Low tide at seven," you say. "So the sand will be wet and flat when the sun comes up."
Danny's eyes go wide. "Wet sand reflects. The whole beach will be like a mirror." {He} grabs the pen and draws a big star on Saturday.
-> 1.1.1: Ask what {he}'ll bring
-> 1.1.2: Remind {him} to check the weather again on Friday

## 1.1.1
"What will you take?"
Danny starts counting on {his} fingers. "Camera. Two rolls of film. The little tripod. A towel for my knees. A flask of tea if Bailey doesn't catch me in the kitchen." {He} frowns. "Something to eat. I always forget to eat."
-> 1.1.1.1: Add gloves to the list, it'll be cold
-> 1.1.1.2: Offer to make {him} something to take

## 1.1.1.1
"Gloves," you say. "It'll be freezing at six in the morning."
"Gloves," Danny repeats, and writes it down. "Fingerless. So I can still work the dials." {He} pauses, pen hovering. "You're really good at this. Planning things."
<<if $control gte 700>>You suppose you are. It's one of the few things that makes you feel steady.<</if>>
-> 1.1.1.1.1: Ask if {he}'d like company on the trip
-> 1.1.1.1.2: Tell {him} it's just about thinking ahead

## 1.1.1.1.1
"Do you want company?" you ask. "I could come."
Danny's pen stops completely. "You'd get up at five? For a sunrise?" {He} searches your face for the joke. "You'd be bored. I take ages. I just sit and wait for the light."
-> 1.1.1.1.1.1: Tell {him} you'd like to see {him} work
-> 1.1.1.1.1.2: Admit five sounds awful but you'd do it anyway

## 1.1.1.1.1.1
"I'd like to watch you work," you say. "I've never seen you actually take a big photo."
Danny goes pink. "It's not exciting. I mostly crouch and mutter." {He} chews the end of the pen. "But... okay. If you really want. I'd like that."
!fx love+2
-> 1.1.1.1.1.1.1: Ask what you should bring
-> 1.1.1.1.1.1.2: Ask what you should <i>not</i> do while {he}'s working

## 1.1.1.1.1.1.1
"What should I bring?"
Danny looks thrilled to be asked. {He} turns the timetable over and starts a second list on the back. "Warm coat. Hat. Your own tea. Something to sit on." {He} hesitates. "And... maybe nothing to do. It's nice to just watch. The sky goes through all these colours before the sun comes up. Purple, then pink, then orange, then the gold bit."
<<if $dannyAccidentKnown is 1 and dannyContinence() lt 2000>>{He} adds, a little quieter, "The beach toilets don't open till nine. So I'll go before the bus." {He} glances at you, and you just nod like it's an ordinary thing to plan for, because it is.<</if>>
-> 1.1.1.1.1.1.1.1: Ask which colour is {his} favourite
-> 1.1.1.1.1.1.1.2: Tell {him} you'll bring biscuits for both of you

## 1.1.1.1.1.1.1.1
"Which colour's your favourite?"
Danny thinks about it for so long you wonder if {he}'s forgotten the question. "The bit just before the gold," {he} says finally. "When everything goes really still. The sea goes flat, and the birds stop, and it's like the whole world is holding its breath." {He} looks embarrassed. "That sounds dramatic."
-> 1.1.1.1.1.1.1.1.1: Tell {him} it sounds lovely
-> 1.1.1.1.1.1.1.1.2: Say you've never actually watched a whole sunrise

## 1.1.1.1.1.1.1.1.1
"It sounds lovely," you say. "Not dramatic."
Danny smiles down at the list. "I've never shown anyone that bit before. I'm always on my own." {He} draws a small sun in the corner of the timetable, then another one beside it. "Two suns," {he} says. "Two people."
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} it's a plan, then
-> 1.1.1.1.1.1.1.1.1.2: Tease {him} about how much {he}'s planned

## 1.1.1.1.1.1.1.1.1.1
"It's a plan, then," you say.
Danny looks at the two little suns and nods, very firmly, as if {he}'s signing something. "It's a plan." {He} folds the timetable carefully along its creases and tucks it under {his} pillow, then looks up at you, almost shy. "I'll knock on your door at five. Really quietly. So Bailey doesn't hear."
"I'll be awake," you promise. You both know you probably won't be, and Danny laughs like {he} knows it too.
!fx love+3 stress-

## 1.1.1.1.1.1.1.1.1.2
"You've planned this like a bank robbery," you say.
Danny laughs. "A sunrise heist," {he} says. "We steal the light and run." {He} adds a tiny moustache to one of the suns, for disguise.
!fx love+2 stress-

## 1.1.1.1.1.1.1.1.2
"I've never actually watched a whole sunrise," you admit.
Danny looks genuinely shocked. "Never? Not even once?" {He} shakes {his} head slowly. "Then you <i>have</i> to come. It's the law now." {He} underlines Saturday three times.
!fx love+2

## 1.1.1.1.1.1.1.2
"I'll bring biscuits," you say. "For both of us."
Danny's whole face lights up. "The chocolate ones?" {He} writes BISCUITS (THEM) on the list in capitals, as if it might get forgotten otherwise.
!fx love+1

## 1.1.1.1.1.1.2
"What shouldn't I do while you're working?"
Danny takes this question extremely seriously. "Don't stand in front of the sun. Don't kick sand on the lens. Don't ask if I'm done yet." {He} pauses. "You can talk, though. Quietly. I don't mind quiet talking."
!fx love+1

## 1.1.1.1.1.2
"Five sounds awful," you say honestly. "But I'll do it."
Danny laughs. "It is awful. That's what makes it special. Nobody else is there." {He} writes your name on the list, under <i>gloves</i>.
!fx love+2

## 1.1.1.1.2
"It's just thinking ahead," you say.
Danny nods. "I'm good at thinking ahead about bad things. Not good things." {He} looks at the list. "This is a good-thing list. It's nice."
!fx love+1

## 1.1.1.2
"I'll make you something to take," you offer.
Danny blinks. "You don't have to do that." But {he} looks like nobody has ever offered to make {him} a packed breakfast before. "Maybe... toast. Toast travels well."
!fx love+2

## 1.1.2
"Check the weather again on Friday," you say. "Forecasts change."
Danny nods, writing FRIDAY: CHECK SKY on {his} hand. "If it's cloudy I'll cry," {he} says, only half joking.
!fx love+1

## 1.2
"What if the bus doesn't come?"
Danny's face falls. "Then I walk. It's forty minutes. I'd miss the start." {He} looks at the timetable as if it might change. "Maybe I should just not go."
-> 1.2.1: Suggest leaving early and walking anyway, just in case
-> 1.2.2: Suggest a different spot closer to the orphanage

## 1.2.1
"Leave at five and walk," you say. "If the bus comes, great. If not, you're already halfway."
Danny stares at you. "That's... really obvious. Why didn't I think of that?" {He} draws a little walking person on the timetable.
!fx love+1 control+

## 1.2.2
"Is there anywhere closer?"
Danny thinks. "The hill behind the park. You can see the sea from the top. It's not as good as the beach..." {He} trails off, thinking. "But it's not nothing. Backup sunrise." {He} writes it down.
!fx love+1

## 2
"Why the sunrise? Why not sunset? It's less early."
Danny looks shocked at the question. "Everyone does sunsets. Sunsets have people on the beach with ice creams. Sunrises are empty." {He} hugs {his} knees. "It feels like the world's just for you, for a bit."
-> 2.1: Say you understand that
-> 2.2: Say you'd rather have the ice cream

## 2.1
"I get that," you say. "Having somewhere to yourself."
Danny nods. "There's nowhere here that's just mine. Except this room. And Bailey has a key." {He} shrugs. "The beach at six is mine."
-> 2.1.1: Tell {him} {he} deserves a place that's {his}
-> 2.1.2: Ask if {he}'d share it

## 2.1.1
"You deserve somewhere that's yours," you say. Danny looks at you, startled, then looks away. "Thanks," {he} mumbles. "I'll have one someday." {He} sounds like {he} might believe it.
!fx love+2 acceptance+

## 2.1.2
"Would you share it?" Danny thinks. "With the right person," {he} says. "Someone who doesn't talk during the gold bit." {He} gives you a pointed look, and then grins.
!fx love+1

## 2.2
"I'd rather have the ice cream," you say.
Danny laughs. "You can have ice cream at sunrise. Nobody's stopping you. It's just very cold." {He} considers. "That's actually a good photo. Ice cream at sunrise."
-> 2.2.1: Volunteer to be the ice cream model
-> 2.2.2: Say you'll stick to sunsets

## 2.2.1
"I'll hold the ice cream," you volunteer. Danny grins. "Deal. You hold, I shoot." {He} writes ICE CREAM?? on the list.
!fx love+1

## 2.2.2
"I'll stick to sunsets," you say. Danny shrugs. "Your loss. More sunrise for me." {He} doesn't seem offended.

## 3
"Are you even allowed out that early?"
Danny's eyes flick to the door. "Technically there's no rule. Bailey just... doesn't like it." {He} lowers {his} voice. "I'll be back before breakfast. {bHe}'ll never know."
-> 3.1: Promise to cover for {him} if anyone asks
-> 3.2: Tell {him} to leave a note just in case

## 3.1
"If anyone asks, you were in the bathroom," you say.
Danny grins. "For two hours?" "A very long bath." {He} laughs. "Thank you. I owe you one."
-> 3.1.1: Say {he} can pay you back with a print
-> 3.1.2: Say {he} doesn't owe you anything

## 3.1.1
"Pay me in prints," you say. Danny nods solemnly. "The best one is yours." {He} means it.
!fx love+2

## 3.1.2
"You don't owe me," you say. Danny looks at you for a moment. "I'll still bring you a print," {he} says.
!fx love+1

## 3.2
"Leave a note," you say. "Just in case something happens."
Danny looks touched, then a little sheepish. "I never think of that. Nobody would notice if I didn't come back for ages." {He} says it lightly, but it lands heavy.
-> 3.2.1: Tell {him} you would notice
-> 3.2.2: Help {him} write the note

## 3.2.1
"I'd notice," you say.
Danny goes very still. "Okay," {he} says quietly. "I'll leave a note. For you." {He} writes one there and then and hands it to you: <i>Gone to see the sun. Back by 8. D.</i>
!fx love+3

## 3.2.2
You help {him} write it. Danny draws a little sun in the corner. "Bailey will think I'm weird," {he} says. "But {bhe} already thinks that."
!fx love+1

## 4
"I love the beach," you say. "I swim there sometimes."
Danny's eyes widen. "In the <i>sea</i>? It's so cold!" {He} looks at you with new respect. "I can't really swim. I just paddle."
-> 4.1: Offer to teach {him} sometime, in summer
-> 4.2: Tell {him} paddling is underrated

## 4.1
"I could teach you," you say. "When it's warmer."
Danny hesitates. "I'd be really bad," {he} warns. Then: "But yes. Maybe. In summer." {He} writes SUMMER: SWIMMING?? on the bottom of the tide table, very small.
-> 4.1.1: Promise to be patient
-> 4.1.2: Joke that you'll start {him} with armbands

## 4.1.1
"I'll be patient," you promise. Danny smiles. "You're always patient." {He} sounds like that's a rare thing in {his} life.
!fx love+2

## 4.1.2
"Armbands first," you say. Danny gasps. "I'm not <i>five</i>!" But {he}'s laughing. "Fine. Armbands. But only if nobody else is there."
!fx love+1 stress-

## 4.2
"Paddling is underrated," you say.
"It's the best," Danny agrees. "You can look at the sand under the water. There are tiny crabs." {He} looks dreamy. "I'll photograph the tiny crabs."
-> 4.2.1: Encourage the crab photography
-> 4.2.2: Ask if crabs are as interesting as sunrises

## 4.2.1
"Crab portraits," you say. "Very serious ones." Danny laughs. "Crab passport photos." {He} adds CRABS to the list.
!fx love+1

## 4.2.2
"Crabs or sunrises?" Danny agonises over it. "Sunrise. But only just." {He} looks genuinely torn.
!fx love+1

## 5
"Sounds like a lot of effort for one photo," you say.
Danny's shoulders come up. "I know," {he} says. "Everyone says that." {He} starts folding the timetable away.
!fx love-1
-> 5.1: Say you didn't mean it like that, and ask to hear more
-> 5.2: Shrug and leave it

## 5.1
"I didn't mean it like that," you say. "Tell me why it's worth it."
Danny hesitates, then unfolds the timetable again. "Because when it works, it's... it's like catching something nobody else saw." {He} looks at you. "That's worth getting up at five."
!fx love+1

## 5.2
You shrug. Danny puts the papers away in silence, and changes the subject to something safe.
`,
});

window.DannyTalkData.push({
	id: "hobbies.beetles",
	topic: "hobbies",
	title: "The beetle book",
	src: `
## 0
Danny is lying on {his} stomach on the bed, chin propped on {his} fists, reading a thick library book with a stag beetle on the cover. {He}'s so absorbed {he} doesn't notice you until you're right beside {him}.
{He} jumps. "Oh! Sorry. I was in the book." {He} holds it up. "Did you know some beetles can lift eight hundred times their own weight?"
-> 1: Ask {him} to tell you more
-> 2: Say that's horrifying
-> 3: Ask why {he} likes beetles so much
-> 4: Tell {him} about a beetle you saw in the forest
-> 5: Share a beetle fact of your own ?? $science gte 500

## 1
"Tell me more," you say, and sit on the end of the bed.
Danny lights up like you've switched {him} on. {He} rolls over and sits up, the book balanced on {his} knees. "Okay. So. Stag beetles. The big jaws are only on the boys, and they don't even bite with them. They wrestle. Like antlers."
-> 1.1: Ask what they wrestle about
-> 1.2: Ask if there are stag beetles around here

## 1.1
"What do they wrestle about?"
"Who gets the best tree," Danny says. "And the best rotten log. Logs are very important to beetles." {He} flips pages quickly. "But the best part is they spend most of their lives underground. Like, five years as a grub, eating old wood. And then only a few weeks as a beetle."
-> 1.1.1: Say that seems unfair
-> 1.1.2: Ask what they do in those few weeks

## 1.1.1
"Five years underground and then a few weeks outside? That's unfair."
Danny tilts {his} head. "I thought that too. But the book says they're probably not sad about it. They're just... being a grub. Then being a beetle." {He} traces the beetle on the cover. "I think about that a lot, actually."
-> 1.1.1.1: Ask why {he} thinks about it
-> 1.1.1.2: Say you'd rather be a beetle than a grub

## 1.1.1.1
"Why do you think about it?"
Danny is quiet for a moment, running {his} thumb along the edge of the page. "Because sometimes it feels like I'm still a grub," {he} says. "Underground. Eating old wood. Waiting." {He} laughs a little. "That's weird, sorry."
-> 1.1.1.1.1: Tell {him} it isn't weird
-> 1.1.1.1.2: Ask what {he}'s waiting for

## 1.1.1.1.1
"It's not weird," you say. "I think lots of people feel like that."
Danny looks up. "Do you?"
<<if $trauma gte 2000 or $stress gte 5000>>You think about how heavy everything has felt lately. "Sometimes," you admit. "More than I'd like."<<else>>"Sometimes," you say.<</if>>
{He} nods slowly, like {he}'s filing that away somewhere safe.
-> 1.1.1.1.1.1: Ask what {his} beetle part will look like, when it comes
-> 1.1.1.1.1.2: Tell {him} grubs are important too

## 1.1.1.1.1.1
"When you get to the beetle part," you ask, "what does it look like?"
Danny thinks about it seriously. "A room that's mine. With a lock only I have the key to. A darkroom in the bathroom. A big window." {He} pauses. "People who knock before they come in." {He} glances at the door. "Photos on the wall that I took. Of people who wanted to be photographed."
-> 1.1.1.1.1.1.1: Tell {him} that sounds like a good beetle life
-> 1.1.1.1.1.1.2: Ask if there's a stag beetle on the wall too

## 1.1.1.1.1.1.1
"That sounds like a really good beetle life," you say.
Danny smiles. "It does, doesn't it?" {He} closes the book halfway, keeping {his} place with a finger. "I'm going to have a tank. With a real beetle. A rescued one. I'll call him Sir Reginald."
-> 1.1.1.1.1.1.1.1: Ask why Sir Reginald
-> 1.1.1.1.1.1.1.2: Suggest a different name

## 1.1.1.1.1.1.1.1
"Why Sir Reginald?"
"Because beetles look like knights," Danny says, as if it's obvious. "The shiny armour. The jaws are like lances. And they're very serious." {He} puts on a deep, serious voice. "<i>Sir Reginald does not wish to be disturbed. Sir Reginald is eating his log.</i>"
You laugh. Danny grins, pleased.
!fx love+1 stress-
-> 1.1.1.1.1.1.1.1.1: Ask what Sir Reginald thinks of you
-> 1.1.1.1.1.1.1.1.2: Ask whether Sir Reginald will have a squire

## 1.1.1.1.1.1.1.1.1
"What does Sir Reginald think of me?"
Danny considers you gravely, then lowers {his} voice again. "<i>Sir Reginald approves. Sir Reginald notes that you sat and listened to a whole beetle lecture without leaving. Sir Reginald is impressed.</i>"
{He} drops the voice, cheeks pink. "Most people leave by the bit about the grubs."
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} you could listen to beetle facts all night
-> 1.1.1.1.1.1.1.1.1.2: Thank Sir Reginald formally

## 1.1.1.1.1.1.1.1.1.1
"I could listen to beetle facts all night," you say, and mean it.
Danny looks at you for a long moment. Then {he} opens the book back up and shuffles over on the bed, holding it so you can both see. "Okay," {he} says, a little hoarse. "Then there's a chapter on dung beetles. They navigate by the Milky Way. That's true. That's actually true."
You lean in. {He} reads to you for a while, pointing at the pictures, and the room feels warm and small and safe.
!fx love+3 stress- trauma-

## 1.1.1.1.1.1.1.1.1.2
You bow your head solemnly. "Thank you, Sir Reginald."
Danny makes a noise between a laugh and a squeak. "<i>Sir Reginald accepts your thanks,</i>" {he} manages. "<i>You may go.</i>" {He} flops back on the bed, giggling.
!fx love+2

## 1.1.1.1.1.1.1.1.2
"Will Sir Reginald have a squire?"
Danny's eyes go wide. "A woodlouse," {he} says immediately. "Called Kevin." {He} dissolves into laughter at {his} own idea.
!fx love+2 stress-

## 1.1.1.1.1.1.1.2
"Maybe something less fancy?"
Danny looks scandalised. "He's a <i>knight</i>. He needs a knight name." {He} hugs the book protectively. "Sir Reginald stays."
!fx love+1

## 1.1.1.1.1.1.2
"Is there a stag beetle on the wall too?"
"A photo of one," Danny says. "Life size. Really sharp. Every little hair on its legs." {He} sighs happily. "That's the dream."
!fx love+1

## 1.1.1.1.1.2
"Grubs are important too," you say. "They're getting ready."
Danny considers that. "Getting ready," {he} repeats. "Not just waiting. Getting ready." {He} smiles slowly. "I like that better."
!fx love+2 acceptance+

## 1.1.1.1.2
"What are you waiting for?"
Danny shrugs. "To be older. To leave. To be the kind of person who's allowed to just... be how they are." {He} closes the book. "That's a lot of waiting."
!fx love+1

## 1.1.1.2
"I'd rather be a beetle," you say.
"Everyone says that," Danny says. "But grubs get to eat all day and nobody bothers them." {He} considers. "That's kind of nice, actually."
!fx love+1

## 1.1.2
"What do they do in those few weeks?"
"Fly around at dusk looking for each other," Danny says. "They're really clumsy fliers. They bump into things." {He} smiles. "I saw one once, on a summer night. It flew into a lamppost and fell over and just lay there for a bit, wiggling."
-> 1.1.2.1: Ask if {he} helped it
-> 1.1.2.2: Laugh at the clumsy beetle

## 1.1.2.1
"Did you help it?"
"I turned it over with a leaf," Danny says. "It sat on my hand for ages. I didn't have my camera." {He} still sounds upset about that.
!fx love+1

## 1.1.2.2
You laugh. "Same," Danny says. "It was the funniest thing I've ever seen. I laughed so loud a dog barked."
!fx love+1 stress-

## 1.2
"Are there stag beetles round here?"
"In the forest," Danny says. "Near the old oaks. I've never found one. You have to go at dusk in June." {He} looks wistful.
-> 1.2.1: Offer to look with {him} in summer
-> 1.2.2: Warn {him} the forest isn't safe at dusk

## 1.2.1
"We could look together," you say. "In June." Danny beams. "Really? A beetle hunt?" {He} looks like {he} might start planning it right now.
!fx love+2

## 1.2.2
"The forest isn't safe at dusk," you say. Danny's face falls. "I know," {he} says. "That's why I've never been." {He} looks at the cover. "Maybe from the edge."
!fx love+1

## 2
"Eight hundred times? That's horrifying."
Danny laughs. "It's amazing! If you could do that, you could lift a bus."
-> 2.1: Say you'd use it to carry Bailey out of the orphanage
-> 2.2: Admit beetles freak you out a bit

## 2.1
"I'd carry Bailey out of the orphanage and leave {bhim} on the beach," you say.
Danny snorts so hard the book slides off {his} knees. "Don't!" {he} gasps. "If {bhe} hears you..." But {he}'s laughing too hard to finish.
-> 2.1.1: Keep the joke going
-> 2.1.2: Glance at the door, just in case

## 2.1.1
"Leave {bhim} there with a bucket and spade," you add. Danny is crying with laughter now. "Stop, stop, my stomach hurts."
!fx love+2 stress-

## 2.1.2
You both glance at the door. Nothing. Danny lets out a breath and giggles quietly. "Safe."
!fx love+1

## 2.2
"Beetles freak me out a bit," you admit.
Danny looks sympathetic, not offended. "That's okay. Lots of people. It's the legs, isn't it?" {He} closes the book gently. "We can talk about something else."
-> 2.2.1: Say you'd like to hear why {he} likes them anyway
-> 2.2.2: Take {him} up on the offer

## 2.2.1
"No, tell me why you like them," you say. "Maybe you'll convert me." Danny opens the book again, careful to start with the least leggy pictures. It's thoughtful of {him}.
!fx love+2

## 2.2.2
You talk about something else. Danny tucks the book under {his} pillow, out of sight, without being asked.
!fx love+1

## 3
"Why beetles?"
Danny thinks. "They're small and everyone ignores them. But they're actually really tough. And really old. They've been around longer than dinosaurs." {He} looks at the cover. "And they don't care what anyone thinks."
-> 3.1: Say that sounds like someone you know
-> 3.2: Ask if {he}'s ever photographed one

## 3.1
"Sounds like someone I know," you say.
Danny looks confused, then realises, and goes very red. "I'm not tough," {he} mumbles. "Or old."
-> 3.1.1: Insist {he} is tough
-> 3.1.2: Tease that {he}'s definitely not older than dinosaurs

## 3.1.1
"You are tough," you say. "You just don't show it." Danny doesn't answer, but {he} holds the book against {his} chest like a shield, and smiles into it.
!fx love+2 acceptance+

## 3.1.2
"Definitely not older than the dinosaurs," you agree. Danny laughs. "Thank you. That's very reassuring."
!fx love+1

## 3.2
"Have you photographed one?"
"A ladybird," Danny says. "On the windowsill. It's a beetle too. Most people don't know that." {He} digs in a drawer and shows you a print, perfectly sharp, every spot crisp.
-> 3.2.1: Tell {him} it's amazing
-> 3.2.2: Ask how {he} got so close

## 3.2.1
"That's amazing," you say. Danny tries not to look too pleased and fails. "It took forty minutes. She kept walking off."
!fx love+1

## 3.2.2
"How did you get so close?" "Reversed lens," Danny says. "You hold it backwards and it makes everything huge. Niki taught me." {He} demonstrates. "It's a cheat. A good cheat."
!fx love+1

## 4
You tell {him} about the huge black beetle you saw crawling over a log in the forest, shiny as oil.
Danny sits bolt upright. "How big? What colour were its legs? Did it have horns?" {He} flips frantically through the book.
-> 4.1: Describe it as best you can
-> 4.2: Admit you didn't look that closely

## 4.1
You describe it. Danny finds a picture and holds it up. "This one?" It is. {He} gasps. "That's a rare one! You saw a rare one!"
-> 4.1.1: Offer to show {him} where
-> 4.1.2: Joke that you're a beetle expert now

## 4.1.1
"I could show you where, in daylight," you offer. Danny looks like you've offered {him} treasure. "Would you? Really?"
!fx love+2

## 4.1.2
"I'm basically an expert now," you say. Danny grins. "An expert who doesn't know what colour the legs were." {He} pats your arm. "Beginner expert."
!fx love+1

## 4.2
"I didn't really look," you admit. "I was busy not falling over."
Danny sighs. "Next time, look at the legs. Legs tell you everything." {He} says it like the most important advice in the world.
-> 4.2.1: Promise to look at the legs
-> 4.2.2: Ask why legs

## 4.2.1
"I'll look at the legs," you promise. Danny nods approvingly. "Good. Report back."
!fx love+1

## 4.2.2
"Why legs?" Danny launches into a five-minute explanation about leg segments and hairs. You understand about a third of it. {He} is very happy.
!fx love+1

## 5
You tell {him} that some bombardier beetles can spray boiling chemicals from their back ends to scare off predators.
Danny's mouth falls open. "<i>Boiling?</i>" {He} flips to the index. "Is it in here? How do you know that?"
-> 5.1: Explain how the chemical reaction works
-> 5.2: Say you read it somewhere

## 5.1
You explain it: two chemicals in separate chambers, mixing in a third, with an enzyme that makes it go off like a tiny explosion. Danny listens with total attention, then whispers: "That's chemistry. That's actual chemistry. In a beetle." {He} looks at you with something like awe.
!fx love+2

## 5.2
"Read it somewhere," you say. Danny finds the page and reads it aloud, delighted. "A beetle with a cannon. That's the best thing I've ever heard."
!fx love+1
`,
});

window.DannyTalkData.push({
	id: "hobbies.chess",
	topic: "hobbies",
	title: "The donated chessboard",
	src: `
## 0
There's a chessboard balanced on Danny's knees, the old donated one from the common room with a bottle cap standing in for a missing pawn. {He}'s playing against {himself}, turning the board around after every move and frowning at it from the other side.
"I keep winning," {he} says. "And losing. At the same time. It's very confusing." {He} looks up hopefully. "Do you play?"
-> 1: Offer to play a proper game
-> 2: Admit you don't really know the rules
-> 3: Ask who taught {him}
-> 4: Ask if {he} wants to play something less serious instead
-> 5: Tell {him} you're actually quite good at chess ?? $maths gte 500

## 1
"I'll play you," you say.
Danny resets the board with quick, careful fingers, putting the bottle cap on {his} own side so you get all the real pawns. "You can be white," {he} offers. "White goes first. It's an advantage."
-> 1.1: Accept and make your first move
-> 1.2: Tell {him} to be white instead

## 1.1
You push a pawn forward. Danny studies it as though you've done something devious, then pushes one of {his} own. You trade moves for a while. {He} plays slowly, thinking hard, chin on {his} fist.
-> 1.1.1: Play carefully and see where it goes
-> 1.1.2: Try a bold early attack

## 1.1.1
You play carefully. The game settles into a slow, thoughtful middle. Danny captures one of your knights and immediately looks guilty. "Sorry," {he} says, and holds it in {his} hand for a moment before putting it to one side.
-> 1.1.1.1: Tell {him} not to apologise for good moves
-> 1.1.1.2: Take one of {his} pieces back in revenge

## 1.1.1.1
"Don't apologise for a good move," you say.
Danny blinks. "Oh. Sorry." {He} hears {himself} and groans. "I mean. Not sorry." {He} laughs and rubs {his} face. "I say sorry for everything. Bailey says it's because I'm <i>apologetic by nature</i>. I don't think it was a compliment."
-> 1.1.1.1.1: Ask why {he} thinks {he} does it
-> 1.1.1.1.2: Suggest a rule: every sorry costs {him} a pawn

## 1.1.1.1.1
"Why do you think you do it?"
Danny moves a bishop without really looking at it. "I don't know. It's safer? If you say sorry first, people can't be angry." {He} watches you take {his} bishop. "Or they still are, but less."
<<if dannyLove() gte 40>>{He} says it more easily than {he} would have once, like {he} trusts you with it.<</if>>
-> 1.1.1.1.1.1: Tell {him} {he} doesn't need to be safe with you
-> 1.1.1.1.1.2: Point out {he} just lost a bishop by not looking

## 1.1.1.1.1.1
"You don't need to be safe with me," you say. "I won't be angry because you took my knight."
Danny looks at the board for a long moment. "I know," {he} says quietly. "I think I know. My mouth just doesn't." {He} picks up a pawn and turns it over. "I'll try. Practising."
-> 1.1.1.1.1.1.1: Suggest {he} practises by being ruthless at chess
-> 1.1.1.1.1.1.2: Tell {him} trying is enough

## 1.1.1.1.1.1.1
"Practise by being ruthless," you say. "Take my pieces. No sorry."
Danny's eyes narrow thoughtfully. Then {he} reaches out, very deliberately, and takes your rook with {his} queen. {He} opens {his} mouth. Closes it. Doesn't say sorry.
"Ha," {he} says instead, very quietly. And then, louder: "<i>Ha.</i>"
!fx love+1 control+
-> 1.1.1.1.1.1.1.1: Pretend to be outraged
-> 1.1.1.1.1.1.1.2: Congratulate {him}

## 1.1.1.1.1.1.1.1
You clutch your chest. "My rook! You monster!"
Danny bursts out laughing and nearly knocks the board over. "You told me to!" {he} protests. "This is entrapment!"
The game goes on, louder now. Danny gets bolder with each move, and you can see {him} fighting the urge to apologise every time {he} takes something. {He} doesn't, not once.
-> 1.1.1.1.1.1.1.1.1: Play your best and try to win
-> 1.1.1.1.1.1.1.1.2: Let the game run its course and see who wins

## 1.1.1.1.1.1.1.1.1
You play your best. <<if $maths gte 500>>It's close, closer than you expected, but you see a fork three moves ahead and take it.<<else>>It isn't enough. Danny sees things you don't.<</if>>
At the end, the two of you sit looking at the board, kings and a handful of pawns left. Danny sits back. "That was the best game I've ever had," {he} says. "Even the bits where I was losing."
-> 1.1.1.1.1.1.1.1.1.1: Ask for a rematch tomorrow
-> 1.1.1.1.1.1.1.1.1.2: Tell {him} {he} didn't say sorry once

## 1.1.1.1.1.1.1.1.1.1
"Rematch tomorrow?"
"Yes," Danny says immediately, then catches {himself}. "I mean. If you want. If you're not busy." {He} rolls {his} eyes at {himself}. "Yes. Rematch tomorrow."
{He} packs the pieces into their battered box one by one, the bottle cap last, and puts the box on the shelf where {he} can see it. "I'm going to practise," {he} warns. "Against myself. I'll be terrifying."
!fx love+2 stress-

## 1.1.1.1.1.1.1.1.1.2
"You didn't say sorry once," you point out. "The whole game."
Danny stares at you, then at the board. "I didn't," {he} says, wonderingly. "I didn't, did I?" {He} picks up {his} king and holds it up like a trophy. A slow, real smile spreads across {his} face. "That might be the best thing that happened today."
!fx love+3 control+ acceptance+

## 1.1.1.1.1.1.1.1.2
You let the game play out. It ends in a stalemate, both kings shuffling round each other with nowhere to go. Danny laughs. "Nobody wins. That's very us."
!fx love+1

## 1.1.1.1.1.1.1.2
"Well done," you say. "That was a great move."
Danny glows. "It was, wasn't it?" {He} lines the captured rook up neatly beside the board, like a prize.
!fx love+1 control+

## 1.1.1.1.1.1.2
"Trying's enough," you say. Danny nods slowly. "Trying's enough," {he} repeats, like {he}'s committing it to memory.
!fx love+1

## 1.1.1.1.1.2
"You just lost a bishop by not looking," you point out.
Danny looks down. "Oh no. I did." {He} laughs, a bit relieved to be back on chess. "Okay. Concentrating now."

## 1.1.1.1.2
"New rule," you say. "Every sorry costs you a pawn."
Danny gasps. "That's cruel." Two moves later, {he} says "Sorry" out of habit and has to hand over a pawn. {He} looks at it mournfully. Three moves after that, {he} catches {himself} mid-word. "Sor— I mean. Good move."
!fx love+1 control+

## 1.1.1.2
You take {his} bishop. "Revenge."
Danny gasps. "That was my favourite bishop!" {He} narrows {his} eyes. "Oh, it's <i>on</i> now." {He} plays faster and much more aggressively, and grins every time {he} takes something.
!fx love+1 stress-

## 1.1.2
You charge out with your queen on the third move. Danny stares at the board, then at you. "Are you allowed to do that?" "Yes." {He} frowns. Then {he} traps your queen with two pawns and a knight.
-> 1.1.2.1: Admit defeat gracefully
-> 1.1.2.2: Demand a do-over

## 1.1.2.1
"Fair enough," you say. Danny looks almost apologetic about winning. "You can have the queen back if you want," {he} offers. You refuse. {He} looks relieved.
!fx love+1

## 1.1.2.2
"Do-over," you demand. Danny laughs. "No do-overs in chess!" But {he} lets you have one anyway, because {he}'s Danny.
!fx love+1

## 1.2
"You be white," you say. "I'll be the underdog."
Danny hesitates, then turns the board. "Okay. But I won't go easy," {he} warns, with the air of someone who will absolutely go easy.
-> 1.2.1: Tell {him} not to go easy
-> 1.2.2: Say you're counting on {him} going easy

## 1.2.1
"Don't go easy," you say. Danny nods solemnly, then proceeds to beat you in fifteen moves. "Sorry," {he} says, then catches {himself}. "Not sorry."
!fx love+1

## 1.2.2
"I'm counting on you going easy," you admit. Danny laughs. "Okay. I'll go medium." {He} does, and it's a fun game.
!fx love+1

## 2
"I don't really know the rules," you admit.
Danny brightens. "I can teach you! It's easy. Well. It's not easy. But I can teach the start."
-> 2.1: Let {him} teach you
-> 2.2: Say you'd rather watch {him} play {himself}

## 2.1
Danny sets up the pieces and explains each one, holding them up. "The knight goes in an L. The bishop goes diagonally. The king's slow because he's old." {He}'s a patient teacher.
-> 2.1.1: Ask why the queen is the strongest
-> 2.1.2: Try a practice game

## 2.1.1
"Why is the queen strongest?" Danny thinks. "Because the king needs protecting and somebody has to actually do things." {He} smiles. "That's what Niki says about the studio."
!fx love+1

## 2.1.2
You play a practice game. You lose quickly, but Danny explains every move, and by the end you understand the knight. Mostly.
!fx love+1

## 2.2
"I'd rather watch you play yourself," you say. "It's fascinating."
Danny goes pink. "It's weird." But {he} plays on, explaining each move under {his} breath for your benefit.
-> 2.2.1: Ask which side {he}'s rooting for
-> 2.2.2: Watch quietly

## 2.2.1
"Which side are you rooting for?" Danny considers. "Black. Black's the underdog. I always root for the underdog." {He} turns the board. Black wins. {He} looks smug.
!fx love+1

## 2.2.2
You watch quietly. After a while Danny forgets you're there, and you see {his} lips moving silently with each move.

## 3
"Who taught you?"
Danny's hands go still on the pieces. "One of the older kids. When I first came here. He's gone now. Aged out." {He} straightens a pawn that didn't need straightening. "He was nice. He taught me so I'd have something to do at night."
-> 3.1: Ask what he was like
-> 3.2: Say he'd be proud of how good {he} is

## 3.1
"What was he like?"
"Tall. Quiet. He never let me win." Danny smiles. "But he never laughed when I lost. He'd just say <i>again</i>, and reset the board."
-> 3.1.1: Say <i>again</i> and reset the board
-> 3.1.2: Ask if {he} ever hears from him

## 3.1.1
You reach over and reset the board. "Again," you say. Danny looks at you, and something soft passes over {his} face. "Again," {he} agrees.
!fx love+3

## 3.1.2
"Do you ever hear from him?" Danny shakes {his} head. "People don't really write, once they leave." {He} shrugs, but it isn't a light shrug.
!fx love+1

## 3.2
"He'd be proud of you," you say. Danny ducks {his} head. "Maybe. I hope so."
-> 3.2.1: Ask to see {his} best move
-> 3.2.2: Leave the thought there

## 3.2.1
"Show me your best move," you say. Danny sets up a position and shows you a sneaky checkmate with a knight. {He} grins. "He taught me that one."
!fx love+1

## 3.2.2
You let it sit. Danny moves a pawn, quietly, and seems comforted.

## 4
"Want to play something less serious?"
Danny looks at the board, then at you. "Like what?"
-> 4.1: Suggest draughts on the same board
-> 4.2: Suggest a game where the pieces have voices

## 4.1
You play draughts with the chess pieces, which is confusing and very silly. Danny keeps trying to move the knights in an L. "Habit," {he} says. "They want to be knights."
-> 4.1.1: Let the knights be knights
-> 4.1.2: Insist on proper draughts rules

## 4.1.1
"Let them be knights," you say. The game becomes something entirely new and rule-free. Danny is laughing by the end.
!fx love+1 stress-

## 4.1.2
"Proper rules," you insist. Danny sighs and tells the knights to behave. You win, for once.
!fx love+1

## 4.2
You pick up a pawn and give it a nervous little voice. "<i>Please don't make me go first.</i>" Danny stares, then picks up the bishop. "<i>Courage, young pawn,</i>" {he} says gravely.
-> 4.2.1: Continue the drama
-> 4.2.2: Have the pawn become a queen

## 4.2.1
The game turns into a soap opera. The king is having a crisis. The rooks are in love with the castle. Danny laughs until {he} has to lie down.
!fx love+2 stress-

## 4.2.2
Your pawn marches all the way to the other side. "<i>I'm a queen now,</i>" it announces. Danny claps. "<i>Long live the pawn!</i>"
!fx love+1

## 5
"I'm actually quite good," you say.
Danny's eyes light up with a dangerous gleam. "Prove it."
-> 5.1: Play to win
-> 5.2: Play to teach {him} something

## 5.1
You play hard. Danny is better than you expected, but you win in the end with a tidy checkmate. {He} stares at the board, then at you. "Again," {he} says immediately. "I want to see how you did that."
!fx love+2

## 5.2
You play slowly, explaining your thinking. Danny listens with total focus and asks good questions. At the end {he} says, "I learned more in that game than in a month of playing myself."
!fx love+2 control+
`,
});
