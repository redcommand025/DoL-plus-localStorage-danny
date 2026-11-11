/* Danny room conversations: School and homework. Format: see talk/engine.js. */
window.DannyTalkData = window.DannyTalkData || [];

window.DannyTalkData.push({
	id: "school.homework",
	topic: "school",
	title: "The science worksheet",
	src: `
## 0
Danny is hunched over {his} desk, a science worksheet pinned flat beneath one elbow. The eraser end of {his} pencil has been chewed flat, and a small drift of rubber shavings has collected beside the page.
{He} glances up as you come closer, then quickly back down, as if the worksheet might have changed while {he} wasn't looking.
"Ch-chemistry," {he} mutters. "Balancing equations. They don't balance. I think they're doing it on purpose."
-> 1: Offer to work through it together
-> 2: Ask what the worksheet is actually about
-> 3: Tease {him} about leaving it until the last minute
-> 4: Suggest {he} takes a break first
-> 5: Glance at the page and point straight at the mistake ?? $science gte 400

## 1
You pull the spare chair over and sit beside {him}. Danny shifts {his} elbow so the worksheet is between you both, and you notice {his} shoulders drop a little.
"Okay," {he} says. "Number four. Methane and oxygen. I keep getting three oxygens on one side and four on the other."
{He} taps the page twice with the chewed pencil, then looks at you expectantly.
-> 1.1: Count the atoms on each side out loud with {him}
-> 1.2: Tell {him} to just copy the answer from the back of the textbook

## 1.1
You go through it slowly. Carbon, one and one. Hydrogen, four and... Danny frowns, writes a small 2 in front of the water, and counts again under {his} breath.
"Four," {he} whispers. "Oh. Four and four." {He} looks up at you, eyes wide. "Wait. Then the oxygens are..."
{He} doesn't finish the sentence. {He}'s already scribbling.
-> 1.1.1: Let {him} work it out on {his} own
-> 1.1.2: Finish the sentence for {him}

## 1.1.1
You keep quiet. Danny's pencil scratches across the page, stops, crosses something out, and starts again. {His} tongue pokes out of the corner of {his} mouth.
Then {he} sits back. "Two oxygens in front. It balances." {He} says it like {he}'s announcing a miracle. "It actually balances."
-> 1.1.1.1: Tell {him} {he} did that on {his} own
-> 1.1.1.2: Point out there are still eleven more questions

## 1.1.1.1
"You did that," you say. "I just counted."
Danny's ears go pink. {He} rubs the back of {his} neck and looks at the worksheet instead of you. "I... I guess I did." A small, crooked smile creeps onto {his} face. "Sirris always does it so fast on the board. I thought I was just stupid at it."
!fx love+1
-> 1.1.1.1.1: Ask why {he} thought that
-> 1.1.1.1.2: Tell {him} Sirris has had years of practice
-> 1.1.1.1.3: Admit you used to think the same about yourself ?? $science lt 300

## 1.1.1.1.1
Danny turns the pencil over and over in {his} fingers. "Everyone else gets it first time. I get it the third time. Or the fifth." {He} shrugs one shoulder. "At the orphanage nobody really... checks. So if I don't get it in class, I just don't get it."
{He} says it plainly, without self-pity, which somehow makes it worse.
-> 1.1.1.1.1.1: Offer to check {his} homework with {him} sometimes
-> 1.1.1.1.1.2: Tell {him} getting it the fifth time still counts

## 1.1.1.1.1.1
Danny blinks at you. "You'd do that?" {He} says it quietly, testing the words. "You don't have to. I know you've got your own stuff. And Bailey's rent, and..."
{He} trails off, fidgeting with the corner of the worksheet until it curls.
-> 1.1.1.1.1.1.1: Tell {him} you'd like to
-> 1.1.1.1.1.1.2: Say it's not a promise, but you'll try

## 1.1.1.1.1.1.1
"I'd like to," you say.
Danny looks at you for a long moment, like {he}'s trying to find the catch. When {he} doesn't, {he} nods, quick and jerky. "Okay. Okay. Then... then I'll actually try on the hard ones. Instead of leaving them blank."
{He} pulls the worksheet closer. "Number five?"
!fx love+2
-> 1.1.1.1.1.1.1.1: Work through number five with {him}
-> 1.1.1.1.1.1.1.2: Suggest {he} tries five alone while you watch

## 1.1.1.1.1.1.1.1
Number five is propane. It's worse. Danny groans and drops {his} forehead onto the desk with a soft thunk, then sits up again, determined.
You go through it together, atom by atom. Halfway through {he} starts explaining it back to you, slowly at first, then faster, the words tumbling over each other.
<<if $science gte 400>>You only have to nudge {him} once, when {he} forgets to double the oxygen on the right.<<else>>You're honestly not sure you'd have got it without {him} talking it through.<</if>>
-> 1.1.1.1.1.1.1.1.1: Tell {him} {he} explains it better than the textbook
-> 1.1.1.1.1.1.1.1.2: Ask if {he} wants to keep going or stop there

## 1.1.1.1.1.1.1.1.1
Danny laughs, a short surprised sound, and covers {his} mouth like {he}'s not sure {he}'s allowed to. "The textbook is really boring," {he} says through {his} fingers. "That's not hard to beat."
But {he} sits up straighter. {He} writes the answer to number five carefully, neatly, and underlines it twice.
"Maybe I could... explain it to you next time. If you get stuck on something. Like, a trade."
-> 1.1.1.1.1.1.1.1.1.1: Agree to the trade
-> 1.1.1.1.1.1.1.1.1.2: Tell {him} you'll hold {him} to that

## 1.1.1.1.1.1.1.1.1.1
"Deal," you say.
Danny holds out {his} hand very formally, the way people shake on things in films. You shake it. {His} palm is warm and a bit smudged with pencil graphite. {He} looks at the grey mark on your hand afterwards and goes red. "S-sorry. Pencil."
{He} turns back to the worksheet, still smiling at it. When you leave {him} to it, {he}'s already on number six and humming tunelessly under {his} breath.
!fx love+2 stress-

## 1.1.1.1.1.1.1.1.1.2
"I'll hold you to that," you say.
"Good," Danny says, and then looks surprised at {himself} for saying it so firmly. {He} ducks {his} head over the worksheet again. "Good. Yeah."
You leave {him} working. The pencil sounds more confident than it did when you came in.
!fx love+1

## 1.1.1.1.1.1.1.1.2
Danny looks at the clock, then at the remaining questions, and pulls a face. "Stop," {he} decides. "My brain's full. If I do any more I'll forget the first ones."
{He} slides the worksheet into a battered folder and pats it, like it's a pet that behaved. "Thanks. Really. It's less scary now."
!fx love+1 stress-

## 1.1.1.1.1.1.1.2
You nod at the page. "Try it. I'll watch."
Danny swallows, then bends over the worksheet. {He} gets it wrong once, catches it {himself}, and gets it right the second time. When {he} looks up {his} face is pink with pride.
"I did it," {he} says. "Without you saying anything." Then, quickly: "Not that you weren't helping. You were. By... sitting there."
!fx love+1 control+

## 1.1.1.1.1.1.2
"I can't promise every night," you say. "But I'll try."
Danny nods slowly. "That's more than most people say." {He} smooths the curled corner of the worksheet flat again. "Trying's good. I'll try too."
!fx love+1

## 1.1.1.1.1.2
"Fifth time still counts," you say. "The answer doesn't know how many tries it took."
Danny thinks about this with {his} whole face. "Huh," {he} says eventually. "That's... actually really true." {He} writes something tiny in the margin of the worksheet. When you lean over, it says <i>5th time still counts</i>.
!fx love+1 stress-

## 1.1.1.1.2
"Sirris has been doing this for years," you say. "A science teacher who couldn't do it fast would be a bad science teacher."
Danny snorts. "I guess." {He} looks back at the page. "I still want to be fast, though. Someday." {He} pulls the worksheet closer and you leave {him} to it.

## 1.1.1.1.3
"I used to think I was rubbish at science too," you admit. "I still kind of do."
Danny looks at you properly for the first time since you sat down. "Really? But you just..." {He} gestures at the page. "You counted." {He} considers. "Maybe we're both just slow at the start." It sounds less like an insult and more like a club you're both members of.
!fx love+2 stress-

## 1.1.1.2
"Only eleven more to go," you say.
Danny's face falls. {He} looks at the worksheet like it has betrayed {him} personally. "Why would you say that," {he} mumbles. But {he} picks the pencil back up, and when you leave, {he}'s frowning at number five instead of staring at nothing.
!fx love-1

## 1.1.2
"The oxygens need a two in front," you say.
Danny's pencil stops. "Oh," {he} says. "Right. Yeah." {He} writes it in. {He} doesn't look upset, exactly, just a bit deflated, as if someone had told {him} the end of a film. "Thanks."
{He} moves on to the next question without asking for help.

## 1.2
"Copy it from the back," you suggest.
Danny shakes {his} head immediately. "Sirris checks working. And writes <i>where did this come from?</i> in red. In front of everyone." {He} shudders. "Besides. I want to actually get it." {He} pulls the worksheet back towards {himself}, a little stiffly.
!fx love-1

## 2
"What's it actually about?" you ask. "Like, why do they need to balance?"
Danny blinks. Nobody seems to have asked {him} that. "Um. Because... you can't make atoms out of nothing? Or lose them. They just get rearranged." {He} looks at the page. "Oh. That's why."
-> 2.1: Say that sounds like a camera, rearranging light
-> 2.2: Ask {him} to explain it like you're five

## 2.1
Danny's head snaps up. "It kind of is," {he} says, suddenly animated. "Film is just chemicals. The light changes the silver, and then the developer changes it more, and nothing goes missing, it just... turns into a picture."
{He} looks at the worksheet with new interest. "So this is darkroom maths. That's way better."
-> 2.1.1: Encourage {him} to think of every equation that way
-> 2.1.2: Ask {him} to show you the darkroom chemicals sometime

## 2.1.1
"Pretend every question is a darkroom problem," you say.
Danny grins. "Methane is a really bad film," {he} says, and laughs at {his} own joke. {He} bends over the worksheet, muttering about silver and developer. You leave {him} to it, and {he} doesn't even notice you go.
!fx love+1 stress-

## 2.1.2
"Will you show me the chemicals sometime?" you ask.
"At Niki's. If Niki says it's okay." Danny nods, then hesitates. "You have to wear gloves. And not touch anything. And not open the door." {He} lists the rules very seriously. "But yes. I'd like that."
!fx love+2

## 2.2
"Explain it like I'm five," you say.
Danny thinks hard. "Okay. You have Lego. You build a house. Then you take it apart and build a car. You still have the same bricks. You can't have more bricks just because you want a bigger car." {He} looks pleased. "Equations are Lego."
-> 2.2.1: Tell {him} that's the best explanation you've heard
-> 2.2.2: Ask what happens if you lose a brick under the sofa

## 2.2.1
"That's genuinely the best explanation I've heard," you say.
Danny goes red to the tips of {his} ears. "It's just Lego," {he} mumbles. But {he} writes <i>LEGO</i> at the top of the worksheet in neat capitals, and underlines it.
!fx love+2

## 2.2.2
"What if you lose a brick under the sofa?"
Danny opens {his} mouth, closes it, and then laughs, properly, so hard {he} has to put the pencil down. "Then Sirris gives you a detention," {he} manages. "For losing atoms."
It takes {him} a minute to calm down. {He} looks lighter afterwards.
!fx love+1 stress-

## 3
"Due tomorrow, is it?" you ask, eyebrow raised.
Danny flinches like {he}'s been caught. "Maybe," {he} says. "I was going to do it on Sunday. Then Niki needed help. Then I was tired. Then it was today."
-> 3.1: Laugh and say you do exactly the same
-> 3.2: Tell {him} {he} should've started earlier

## 3.1
"Same," you say. "Every week."
Danny relaxes. "Really? I thought it was just me." {He} smiles a little. "Okay. Then we're both terrible. That's better than just me being terrible."
-> 3.1.1: Suggest a pact to start earlier next week
-> 3.1.2: Say being terrible together is a tradition now

## 3.1.1
"Next week we start on Sunday," you say. "Both of us."
"Pact," Danny agrees solemnly. {He} writes <i>SUNDAY</i> on {his} hand in pencil. It will probably smudge off by tomorrow, but {he} looks at it like it's binding.
!fx love+1 control+

## 3.1.2
"A tradition," Danny repeats, and giggles. "The Thursday night panic club."
{He} turns back to the worksheet, still smiling, and you leave {him} to it.
!fx love+1

## 3.2
"You should've started earlier," you say.
Danny's smile fades. "I know," {he} says quietly. "I know." {He} pulls {his} sleeves down over {his} hands and stares at the page. The room feels smaller.
-> 3.2.1: Soften it and offer to sit with {him} while {he} works
-> 3.2.2: Leave {him} to get on with it

## 3.2.1
"Sorry," you say. "That came out wrong. Want me to sit here while you do it?"
Danny glances at you, then nods. You sit on the end of the bed while {he} works. {He} doesn't ask you anything, but {his} pencil moves faster with you there.
!fx love+1

## 3.2.2
You leave {him} to it. When you glance back from the doorway, {he}'s still staring at the same question, pencil frozen.
!fx love-1

## 4
"Take a break first," you say. "You've been staring at that so long it's staring back."
Danny laughs weakly. "It is. It's judging me." {He} puts the pencil down and stretches until {his} back cracks. "What do I do on a break? I never know."
-> 4.1: Suggest a walk to the kitchen for a drink
-> 4.2: Suggest {he} shows you the last photo {he} took

## 4.1
You walk down to the orphanage kitchen together. Danny fills two glasses at the tap and hands you one, then drinks {his} in one go.
"Better," {he} says. "My brain was all fuzzy." On the way back up the stairs, {he} talks about nothing much, which seems to be exactly what {he} needed.
-> 4.1.1: Head back so {he} can finish the worksheet
-> 4.1.2: Linger on the stairs a little longer

## 4.1.1
Back in {his} room Danny sits down at the desk with a sigh, but a determined one. "Okay," {he} tells the worksheet. "Round two." {He} picks the pencil up again.
!fx stress-

## 4.1.2
You sit on the stairs for a few minutes, listening to the creak and murmur of the orphanage. Danny leans {his} head against the banister. "It's nice," {he} says, "when it's quiet like this." Then {he} sighs and gets up. "Worksheet."
!fx love+1 stress-

## 4.2
Danny brightens instantly and digs in a drawer for a small stack of prints. The top one is a spider web strung across the orphanage gate, every strand beaded with dew.
"This morning," {he} says. "I nearly missed the bus for it."
-> 4.2.1: Tell {him} it was worth missing the bus for
-> 4.2.2: Ask how {he} got the dew to show up so clearly

## 4.2.1
"Worth it," you say.
Danny smiles down at the print. "Yeah," {he} says softly. "It was." {He} props it against {his} lamp, where {he} can see it while {he} works, and turns back to the worksheet looking calmer.
!fx love+1 stress-

## 4.2.2
"Backlight," Danny says at once. "The sun was behind it. So every drop lights up." {He} demonstrates with {his} hands, one the sun, one the web. Then {he} catches {himself} and laughs. "Sorry. Break over. Probably."
!fx love+1

## 5
You lean over and tap one line. "You've got the water the wrong way round. Two H<sub>2</sub>O, not H<sub>4</sub>O<sub>2</sub>."
Danny stares at the page, then at you, then at the page. "That's... oh my gosh. That's been wrong for twenty minutes." {He} fixes it. Everything after it falls into place.
-> 5.1: Shrug like it was nothing
-> 5.2: Offer to look over the rest of the sheet

## 5.1
You shrug. Danny looks at you with something close to awe. "You just looked at it," {he} says. "You just looked."
!fx love+2

## 5.2
You go through the rest of the sheet together. With the water fixed, Danny gets most of it on {his} own, and only needs a nudge twice. By the end {he}'s sitting up properly instead of hunched.
"I'm going to get a good mark," {he} says, slightly stunned. "I never get a good mark in chemistry."
!fx love+2 stress-
`,
});

window.DannyTalkData.push({
	id: "school.project",
	topic: "school",
	title: "The group project",
	src: `
## 0
Danny is sitting cross-legged on {his} bed with a sheet of paper on {his} knee, staring at it without reading it. When you come in {he} folds it in half quickly, then unfolds it again, as if hiding it was pointless.
"Group project," {he} says. "History. Winter put us in fours." {He} swallows. "I'm with Whitney's friends."
-> 1: Ask how {he} feels about that
-> 2: Ask what the project is on
-> 3: Offer to talk to Winter about switching groups
-> 4: Tell {him} it might not be as bad as {he} thinks

## 1
Danny picks at a loose thread on {his} blanket. "Sick," {he} says honestly. "Like before a test, but all the time. They're not... they don't hit me or anything. They just laugh. And then I can't think."
{He} looks up at you, then away. "That's stupid, right?"
-> 1.1: Tell {him} it isn't stupid at all
-> 1.2: Tell {him} to ignore them

## 1.1
"It's not stupid," you say. "Being laughed at is horrible."
Danny lets out a breath {he} seems to have been holding all day. "Yeah," {he} says. "It is." {He} pulls {his} knees up and wraps {his} arms around them. "I just want to get through it without being the joke."
!fx love+1
-> 1.1.1: Ask what part of the project {he}'d be good at
-> 1.1.2: Ask what usually happens when they laugh

## 1.1.1
Danny thinks. "There's a presentation. And a poster. And someone has to find pictures from the archive." {He} sits up a bit. "I could do the pictures. I'm good at finding old photos. And I could photograph the archive ones so we don't have to borrow them."
It's the first time {he}'s sounded interested.
-> 1.1.1.1: Tell {him} to claim that job first thing tomorrow
-> 1.1.1.2: Warn {him} they might try to give {him} everything

## 1.1.1.1
"Claim it," you say. "First thing. Before anyone else speaks."
Danny looks terrified and thrilled at the same time. "Just... say it? Out loud? <i>I'll do the pictures</i>?" {He} tries the words out under {his} breath. "I'll do the pictures."
-> 1.1.1.1.1: Make {him} practise saying it properly
-> 1.1.1.1.2: Tell {him} even a mumble will do

## 1.1.1.1.1
"Again," you say. "Like you mean it."
"I'll do the pictures," Danny says, slightly louder.
"Again."
"<i>I'll do the pictures.</i>" {He}'s nearly shouting now, and goes red, and starts laughing. "This is so embarrassing."
"Again," you say, and {he} throws a pillow at you.
!fx love+1 stress-
-> 1.1.1.1.1.1: Throw the pillow back
-> 1.1.1.1.1.2: Catch it and make {him} say it one last time

## 1.1.1.1.1.1
You throw the pillow back. It hits Danny square in the face. There's a stunned silence, and then {he} collapses sideways on the bed, laughing so hard {he} can't breathe.
When {he} finally sits up {his} hair is sticking up on one side and {his} eyes are wet. "Okay," {he} gasps. "Okay. I'll do the pictures."
-> 1.1.1.1.1.1.1: Ask what {he}'ll do if Whitney's friends laugh anyway
-> 1.1.1.1.1.1.2: Tell {him} {he} sounded confident that time

## 1.1.1.1.1.1.1
Danny's smile wobbles. "I don't know," {he} admits. "Freeze. Probably. I always freeze."
{He} picks at the pillowcase. "Sometimes I think if I'm quiet enough they'll forget I'm there. It doesn't work. But I keep trying it."
<<if $trauma gte 2000>>You know that feeling better than you'd like to. The trying to take up less room.<</if>>
-> 1.1.1.1.1.1.1.1: Suggest {he} picks one thing to say back, ready in advance
-> 1.1.1.1.1.1.1.2: Tell {him} freezing is okay as long as {he} doesn't give up the job
-> 1.1.1.1.1.1.1.3: Tell {him} you know what it's like to try to disappear ?? $trauma gte 2000 or $stress gte 5000 or dannyTrust() gte 50

## 1.1.1.1.1.1.1.1
"Have one thing ready to say," you suggest. "Just one. So you don't have to think of it."
Danny frowns. "Like what?"
You think about it together. {He} rejects anything mean ("Then they'll be meaner"), anything clever ("I'll forget it"), and anything long. In the end {he} settles on <i>"Okay. Anyway."</i>
"It's boring," {he} says. "That's the point. Boring isn't funny."
-> 1.1.1.1.1.1.1.1.1: Practise it with {him}, playing one of Whitney's friends
-> 1.1.1.1.1.1.1.1.2: Tell {him} it's perfect

## 1.1.1.1.1.1.1.1.1
You do your best sneering voice. "Pictures? What, of your cat?"
Danny's face goes blank for a second, then {he} squares {his} shoulders. "Okay. Anyway." {He} pauses. "The archive has photos of the old harbour from 1890."
You break character and grin. Danny grins back, a bit shaky. "That was okay?"
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} it was more than okay
-> 1.1.1.1.1.1.1.1.1.2: Do one more, a bit harder

## 1.1.1.1.1.1.1.1.1.1
"That was great," you say. "You didn't freeze. You kept going."
Danny looks down at {his} hands like they belong to someone braver. "I kept going," {he} repeats. Then, quietly: "Thank you. I don't think anyone's ever practised with me before. For anything."
{He} folds the project sheet neatly and puts it in {his} bag, ready for tomorrow. {His} hands aren't shaking anymore.
!fx love+3 stress- control+

## 1.1.1.1.1.1.1.1.1.2
You try a harder one, sharper. Danny flinches, and you see the freeze start. Then {he} swallows. "Okay. Anyway," {he} says, very small, but {he} says it.
"Sorry," you say. "That one was mean."
"It's okay," {he} says. "They'll be meaner. Better to practise." {He} rubs {his} arms. "I think I'm done practising for tonight, though."
!fx love+1 control+

## 1.1.1.1.1.1.1.1.2
"It's perfect," you say.
Danny nods slowly, then writes it on the back of the project sheet: <i>Okay. Anyway.</i> {He} looks at it for a long time. "Boring armour," {he} says. "I like it."
!fx love+2 control+

## 1.1.1.1.1.1.1.2
"If you freeze, freeze," you say. "Just don't give up the pictures."
Danny considers that. "Freeze but don't let go," {he} says slowly. "Like a... like a crab." {He} laughs a little at {himself}. "I can be a crab."
!fx love+1 stress-

## 1.1.1.1.1.1.1.3
"I know what it's like," you say quietly. "Trying to be small enough that nobody notices."
Danny goes very still. For a long moment {he} just looks at you, and something in {his} face shifts, recognition, maybe. "Yeah," {he} says. "You do, don't you."
{He} doesn't ask anything else. {He} just shuffles along the bed so there's room for you to sit, and you sit, and neither of you says anything for a while. It's the comfortable kind of quiet.
!fx love+2 trauma- stress-

## 1.1.1.1.1.1.2
"That time you sounded confident," you say.
Danny pats {his} hair down, still breathless. "Pillows help," {he} says. "Maybe I should bring one to school." But {he} looks pleased.
!fx love+1

## 1.1.1.1.1.2
You catch the pillow. "Last time."
Danny takes a breath. "I'll do the pictures." It comes out clear and steady, and {he} looks surprised by {his} own voice. "Oh. That was okay."
!fx love+1 control+

## 1.1.1.1.2
"Even a mumble counts," you say. "As long as you say it first."
Danny nods. "Mumbling I can do. I'm really good at mumbling." {He} smiles a little and tucks the sheet into {his} bag.
!fx love+1

## 1.1.1.2
"Careful," you say. "They might try to give you the whole thing to do."
Danny's face falls. "They will," {he} says. "They did last time. I did the whole poster and Whitney's friend presented it." {He} sighs. "Maybe I'll just do what they say. It's easier."
You don't think it is, but {he} doesn't seem ready to hear that tonight.
!fx stress+

## 1.1.2
Danny shrugs. "I go red. Then they laugh because I'm red. Then I go redder." {He} tries to smile. "It's like a machine. A really stupid machine."
{He} lies back on the bed and stares at the ceiling. "I'll survive it. I always do."
!fx love+1

## 1.2
"Just ignore them," you say.
Danny gives you a look. "That's what everyone says." {He} doesn't say it nastily, just tiredly. "I do ignore them. They don't ignore me."
{He} folds the sheet up small and puts it under {his} pillow.
!fx love-1

## 2
"What's it on?" you ask.
"The town, a hundred years ago," Danny says. "What it looked like. How people lived." {He} perks up a little. "There are old photos in the library archive. Glass plates. Some of them are really beautiful."
-> 2.1: Ask what the most beautiful one {he}'s seen is
-> 2.2: Share something you know about the town's history ?? $history gte 400
-> 2.3: Say it sounds boring

## 2.1
Danny's face goes soft. "There's one of the harbour in fog," {he} says. "All the ship masts are just shadows. And a man on the pier with a dog, looking at the camera like he knows it'll be there in a hundred years."
{He} hugs {his} knees. "I want to take a picture like that one day. One that's still looking at people when I'm gone."
-> 2.1.1: Tell {him} you think {he} will
-> 2.1.2: Ask if {he} can show you the photo at the library

## 2.1.1
"You will," you say.
Danny looks at you as if checking whether you're joking. You aren't. "Okay," {he} says, very quietly. "Maybe."
!fx love+2

## 2.1.2
"If the archivist lets us," Danny says. "We have to wear white gloves." {He} sounds thrilled about the white gloves. "Maybe at the weekend? If you want?"
!fx love+1

## 2.2
You tell {him} about the old smugglers' tunnels under the harbour, and how half the old town was rebuilt after a storm flattened it. Danny listens with {his} mouth slightly open.
"How do you know all that?" {he} says. "That's... that's going on the poster." {He} scrabbles for a pen.
!fx love+1
-> 2.2.1: Tell {him} more while {he} writes
-> 2.2.2: Suggest {he} gets the credit with {his} group

## 2.2.1
You keep going. Danny writes so fast {his} handwriting turns into a scrawl. By the end {he} has two full pages of notes and a look of fierce determination. "They can't laugh at this," {he} says. "This is too good."
!fx love+2 control+

## 2.2.2
"Tell your group you found it," you say. "You'll be the one who knows things."
Danny bites {his} lip. "That feels like lying." {He} thinks. "I'll say a friend told me." {He} says <i>friend</i> carefully, like {he}'s not sure {he}'s allowed to. Then {he} smiles.
!fx love+2

## 2.3
"Sounds boring," you say.
Danny's face closes a little. "Oh," {he} says. "Yeah. Probably." {He} puts the sheet away. The glass plates don't come up again.
!fx love-1
-> 2.3.1: Apologise and ask about the glass plates after all
-> 2.3.2: Change the subject

## 2.3.1
"Sorry," you say. "I didn't mean it. Tell me about the glass plates?"
Danny hesitates, then the words come out in a rush: how they're heavy and fragile, how the archivist keeps them in wooden boxes, how you can see fingerprints of the old photographers in the corners. By the time {he}'s finished {he}'s smiling again.
!fx love+1

## 2.3.2
You talk about something else instead. Danny joins in politely, but {he} keeps glancing at {his} bag where the project sheet is.

## 3
"I could talk to Winter," you say. "Ask for you to be switched."
Danny's eyes go wide with alarm. "No! Please don't. Then they'll know I complained, and it'll be worse." {He} shakes {his} head hard. "Winter would make a whole speech about <i>historical cooperation</i>."
-> 3.1: Promise you won't
-> 3.2: Ask if there's anything else you can do

## 3.1
"Okay," you say. "I won't."
Danny sags with relief. "Thank you. I know you're trying to help. It's just... it's better if I deal with it." {He} pulls a face. "Somehow."
-> 3.1.1: Tell {him} {he} doesn't have to deal with it alone
-> 3.1.2: Leave it there

## 3.1.1
"You don't have to deal with it alone," you say. "You can come and moan to me every night."
Danny huffs a laugh. "Every night? You'll get sick of me." But {he} looks like {he}'s going to take you up on it.
!fx love+2

## 3.1.2
You let it drop. Danny seems grateful not to talk about it anymore, and asks you about your day instead.

## 3.2
"Is there anything else I can do?"
Danny thinks about it seriously. "Maybe... sit near us at lunch? Not with us. Just near. So I know someone's there."
{He} looks embarrassed to have asked.
-> 3.2.1: Agree straight away
-> 3.2.2: Say you'll try if your timetable lets you

## 3.2.1
"Of course," you say.
Danny lets out a breath. "Okay. Thanks. That's... that helps more than you'd think." {He} smiles shyly.
!fx love+2

## 3.2.2
"I'll try," you say. "Depends on my lessons."
Danny nods. "That's fine. Even trying is nice." {He} means it.
!fx love+1

## 4
"Maybe it won't be as bad as you think," you say.
Danny looks doubtful. "Maybe," {he} says. "Last time one of them drew a picture of me on the whiteboard. It wasn't even a bad drawing. That was the worst part."
-> 4.1: Laugh, then apologise
-> 4.2: Ask if anyone in the group is nice

## 4.1
You laugh before you can stop yourself, then wince. "Sorry."
But Danny is smiling too. "No, it's okay. It <i>is</i> kind of funny. It had my hair exactly right." {He} touches {his} fringe. "They're good at art. They're just not nice."
-> 4.1.1: Say maybe {he} can use their art skills for the poster
-> 4.1.2: Tell {him} {his} hair looks fine

## 4.1.1
"Get them to draw the poster," you say. "Then they're busy and not drawing you."
Danny stares at you. "That's evil," {he} says admiringly. "That's actually really clever." {He} writes it down.
!fx love+1 control+

## 4.1.2
"Your hair looks fine," you say.
Danny pats it self-consciously. "It sticks up at the back," {he} says. "Always. Bailey says it's because I sleep weird." But {he} stops touching it.
!fx love+1

## 4.2
Danny thinks. "There's one. Quiet. Sits by the window. Lent me a pen once and didn't want it back." {He} shrugs. "Maybe they're okay."
-> 4.2.1: Suggest {he} sits next to that one
-> 4.2.2: Tell {him} one decent person can change a whole group

## 4.2.1
"Sit next to them," you say. "Two quiet people are a team."
Danny considers this with great seriousness. "A quiet team," {he} says. "Okay. I'll try." {He} looks a little less sick.
!fx love+1 stress-

## 4.2.2
"One decent person can change a whole group," you say.
Danny looks sceptical, then thoughtful. "Maybe," {he} says. "I'll find out tomorrow." {He} puts the sheet away and lies back, looking up at the ceiling, less tense than before.
!fx stress-
`,
});

window.DannyTalkData.push({
	id: "school.exam",
	topic: "school",
	title: "The maths test",
	src: `
## 0
There are flashcards everywhere. On the desk, on the bed, stuck to the wall above the bed with bits of tape. Danny is pacing between them, muttering numbers, a pencil tucked behind each ear.
{He} stops dead when {he} sees you. "M-maths test. Tomorrow. River said it's <i>cumulative</i>." {He} says the word like a diagnosis. "That means everything. Everything since September."
-> 1: Offer to quiz {him} with the flashcards
-> 2: Tell {him} to sit down before {he} wears a hole in the floor
-> 3: Ask which topic scares {him} most
-> 4: Ask how much sleep {he}'s planning to get
-> 5: Tell {him} you've got the same test and you're just as scared ?? $stress gte 4000

## 1
You pick up a stack of flashcards. Danny freezes mid-pace, then comes and sits on the edge of the bed, hands clasped tight between {his} knees.
"Okay," {he} says. "Okay. Go. Don't go easy."
-> 1.1: Start with an easy one to warm {him} up
-> 1.2: Pick the hardest-looking card you can find

## 1.1
"What's seven times eight?"
"Fifty-six," Danny says instantly, then glares at you. "That's not on the test."
"Warming up," you say. {He} rolls {his} eyes, but {his} shoulders come down from around {his} ears.
-> 1.1.1: Move on to fractions
-> 1.1.2: Ask a stupidly easy one to make {him} laugh

## 1.1.1
You go through fractions. Danny gets the first four right, hesitates on the fifth, and gets it right anyway. {He} sits up a bit straighter with each one.
"Simultaneous equations next," {he} says. "Those are the bad ones."
-> 1.1.1.1: Do the simultaneous equations
-> 1.1.1.2: Tell {him} {he}'s already doing great and should stop on a high

## 1.1.1.1
The first simultaneous equation takes {him} three tries. {He} gets frustrated, scrubs at {his} face with both hands, then tries again.
"I hate x," {he} mutters. "Why can't x just say what it is."
-> 1.1.1.1.1: Suggest {he} writes it out step by step on paper
-> 1.1.1.1.2: Laugh and agree x is a menace

## 1.1.1.1.1
You hand {him} a sheet of paper. Danny writes it out slowly, one line at a time, saying each step out loud. Halfway through {he} stops and frowns.
"Oh. I've been subtracting when I should add. Every time." {He} does it again. It works. {He} looks at the paper as if it's personally apologised.
<<if $maths gte 400>>You check {his} working over {his} shoulder. It's right. Neat, even.<</if>>
-> 1.1.1.1.1.1: Give {him} another one to prove it wasn't luck
-> 1.1.1.1.1.2: Tell {him} that mistake was the whole problem

## 1.1.1.1.1.1
You give {him} another. Danny writes it out, adds instead of subtracts, and gets it right first time. Then another. Right again.
"It wasn't luck," {he} says slowly. "I actually know how to do it." {He} sounds shocked.
!fx control+
-> 1.1.1.1.1.1.1: Ask {him} why {he}'s so nervous if {he} knows it
-> 1.1.1.1.1.1.2: Move on to the next topic

## 1.1.1.1.1.1.1
Danny's pencil stops. "Because knowing it here isn't the same as knowing it there," {he} says. "In the hall. With the clock. And River walking up and down. My head goes white."
{He} puts the pencil down very carefully, lining it up with the edge of the paper. "Last test I knew everything and I got a D. I just sat there."
-> 1.1.1.1.1.1.1.1: Ask what it feels like when {his} head goes white
-> 1.1.1.1.1.1.1.2: Tell {him} D isn't the end of the world

## 1.1.1.1.1.1.1.1
"What does it feel like?" you ask. "When it goes white."
Danny thinks. "Like... when you stand up too fast. Everything goes fizzy. And my heart's really loud. And I can't read the questions, I just see the shapes of them." {He} presses {his} hand flat against {his} chest without seeming to notice. "Then the clock's moved and I've done nothing."
<<if $control lte 400>>The way {he} describes it sounds horribly familiar.<</if>>
-> 1.1.1.1.1.1.1.1.1: Teach {him} a breathing trick for when it happens
-> 1.1.1.1.1.1.1.1.2: Suggest {he} starts with the easiest question, not the first one
-> 1.1.1.1.1.1.1.1.3: Tell {him} it happens to you too, sometimes ?? $control lte 400

## 1.1.1.1.1.1.1.1.1
"Try this," you say. "Breathe in for four. Hold for four. Out for four. Hold for four. Like drawing a square."
Danny tries it, eyes on your face, copying. In. Hold. Out. Hold. {He} does it three times. On the fourth {his} hands unclench.
"Huh," {he} says. "My heart's quieter." {He} does it again, just to check.
!fx stress-
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} to do the square before turning the paper over tomorrow
-> 1.1.1.1.1.1.1.1.1.2: Practise it once more, pretending to be in the exam hall

## 1.1.1.1.1.1.1.1.1.1
"Do the square before you turn the paper over," you say. "Every time. Even if you feel fine."
Danny nods. {He} takes a pen and draws a tiny square on the inside of {his} wrist. "So I remember," {he} explains. {He} looks at it, then at you. "Thank you. For all of this. I thought tonight was going to be awful and it's... not."
{He} starts gathering the flashcards off the wall, carefully, one by one, sorting them into a neat pile. "I'm going to sleep," {he} decides. "A whole proper sleep."
!fx love+3 stress- control+

## 1.1.1.1.1.1.1.1.1.2
You set up the chair like an exam desk and pace up and down behind {him} like River. Danny turns over a flashcard, and you see {him} start to stiffen. Then {he} breathes. In, hold, out, hold. {He} reads the card. {He} answers it.
{He} turns around grinning. "I did the square!"
"You did the square," you agree.
!fx love+2 control+

## 1.1.1.1.1.1.1.1.2
"Don't start with question one," you say. "Read them all first. Do the easiest one. Then your brain knows it can do this."
Danny's eyebrows go up. "You're allowed to do that?"
"Nobody says you have to go in order."
{He} looks like you've told {him} a cheat code. "Easiest first," {he} repeats. {He} writes it on a flashcard and tucks it in {his} pencil case.
!fx love+2 control+

## 1.1.1.1.1.1.1.1.3
"It happens to me too," you say. "Not just in tests."
Danny looks at you properly. "Really? You always look so... together." {He} hesitates, then reaches out and squeezes your sleeve, just briefly, before pulling {his} hand back. "That's... I'm sorry. That sucks." A pause. "Maybe we could both do the breathing thing."
!fx love+2 stress-

## 1.1.1.1.1.1.1.2
"A D isn't the end of the world," you say.
"Bailey doesn't think so," Danny says quietly. "{bHe} says the orphanage isn't a charity for people who won't try." {He} looks down. "I <i>do</i> try."
You don't know what to say to that. Danny shakes {himself}. "Sorry. Let's do more cards."
!fx love+1

## 1.1.1.1.1.1.2
You move on to percentages. Danny breezes through them, and you end the session on a run of right answers. {He} looks almost confident by the time you put the cards down.
!fx love+1 control+

## 1.1.1.1.1.2
"That one mistake was the whole problem," you say. "Not you. Just one sign."
Danny stares at the paper. "One sign," {he} says. "Weeks of thinking I was bad at maths. Because of one sign." {He} laughs, a bit hysterically. "I'm going to write it on my hand."
!fx love+1 stress-

## 1.1.1.1.2
"x is a menace," you agree. "Always hiding."
Danny laughs. "It should just tell you. <i>Hi, I'm three.</i> Done." {He} looks at the equation again, calmer. "Okay. Let's make it tell us."
!fx love+1

## 1.1.1.2
"You're doing really well," you say. "Stop on a high."
Danny looks torn, then sets the cards down. "Okay. If I keep going I'll find one I can't do and then I'll panic all night." {He} smiles. "Stopping on a high."
!fx stress-

## 1.1.2
"What colour is a blue whale?"
Danny stares at you, and then {he} snorts so hard {he} has to put {his} hand over {his} nose. "That's not maths!"
"Answer the question."
"<i>Blue</i>," {he} says, laughing. "Probably. Grey, actually." {He}'s much more relaxed when you get to the real questions.
!fx love+1 stress-

## 1.2
You pick the meanest-looking card in the stack. Danny reads it, and you watch the colour drain from {his} face.
"I... I don't know that one. I don't know it. Oh no."
-> 1.2.1: Work through it together slowly
-> 1.2.2: Put it at the bottom of the pile and pick an easier one

## 1.2.1
You go through it line by line. It takes ten minutes. By the end, Danny has done most of it {himself}. "I knew more than I thought," {he} says, shaky but relieved.
!fx love+1 control+

## 1.2.2
You slide it to the bottom of the pile. "That one's for later." The next card is easier, and Danny gets it right. Colour returns to {his} cheeks.
!fx stress-

## 2
"Sit down," you say. "You'll wear a hole in the floor and Bailey will charge you for it."
That startles a laugh out of {him}. {He} sits, abruptly, on the edge of the bed. "{bHe} would," {he} says. "{bHe} absolutely would."
-> 2.1: Sit next to {him} and ask how long {he}'s been pacing
-> 2.2: Hand {him} a glass of water from the side

## 2.1
"How long have you been doing laps?"
Danny checks the clock and winces. "An hour. Maybe more. I wasn't really reading the cards. I was just walking near them."
-> 2.1.1: Suggest walking near them doesn't count as revision
-> 2.1.2: Suggest a proper ten minutes, then bed

## 2.1.1
"Walking near flashcards doesn't count," you say.
"It should," Danny says gloomily. Then {he} grins. "Okay. Fine. Actual reading." {He} picks up a card.
!fx love+1

## 2.1.2
"Ten minutes of actual revision," you say. "Then sleep."
Danny looks at you as if you've suggested something wild and dangerous. "Just ten?" But {he} sets a timer, and when it beeps {he} actually stops.
!fx stress- control+

## 2.2
You hand {him} the glass. Danny drinks the whole thing, then looks at the empty glass in surprise. "I didn't know I was thirsty," {he} says. "I didn't know anything. I was just... cards."
-> 2.2.1: Tell {him} to look after {himself} too
-> 2.2.2: Refill it and sit with {him}

## 2.2.1
"Your brain needs water too," you say. "And food. And sleep."
Danny nods slowly. "Water, food, sleep. Then maths." {He} counts on {his} fingers. "That's four things. Maths is fourth." {He} looks like {he} finds this reassuring.
!fx love+1

## 2.2.2
You refill it and sit beside {him}. Danny sips slowly this time. After a while {he} leans {his} head back against the wall and closes {his} eyes. "Better," {he} murmurs.
!fx love+1 stress-

## 3
"Which part scares you most?"
Danny doesn't even hesitate. "Graphs. Plotting them. I always put the dots in the wrong place and then the line goes all wobbly and River draws a sad face."
-> 3.1: Offer to draw some graphs with {him}
-> 3.2: Point out River draws sad faces on everyone's

## 3.1
You find some squared paper and draw an axis. Danny plots the first few points with {his} tongue between {his} teeth. One is wrong. {He} spots it {himself} and fixes it.
-> 3.1.1: Tell {him} spotting it {himself} is the important bit
-> 3.1.2: Do a few more until the line is straight

## 3.1.1
"You spotted it," you say. "That's the bit that matters."
Danny looks at the dot and smiles. "I did. I spotted it." {He} draws a tiny smiley face next to the line.
!fx love+1 control+

## 3.1.2
You do six more. By the last one {his} lines are perfectly straight. {He} holds the paper up to the lamp like it's a print from the darkroom. "Look how straight."
!fx love+1

## 3.2
"River draws sad faces on everyone's," you say. "I've had loads."
Danny's eyes widen. "Really? I thought it was just me." {He} looks enormously comforted. "How many?"
-> 3.2.1: Exaggerate wildly
-> 3.2.2: Tell the truth

## 3.2.1
"About a thousand," you say. "River has a stamp."
Danny laughs. "River does not have a stamp." A pause. "Does River?" {He}'s still giggling when you leave.
!fx love+1 stress-

## 3.2.2
<<if $maths gte 500>>"Honestly? Only one or two," you admit. "But I had help."<<else>>"Honestly? Loads," you admit. "Maths isn't my thing."<</if>>
Danny nods thoughtfully. "So it's not just me. Okay." {He} seems steadier.
!fx love+1

## 4
"How much sleep are you planning on?"
Danny looks guilty. "I was going to stay up and do everything again."
-> 4.1: Tell {him} sleep is part of revising
-> 4.2: Say {he} can stay up, but only for another half hour

## 4.1
"Sleep is when your brain saves everything," you say. "Like... developing film. If you open the door too soon it's ruined."
Danny stares at you. "That's such a good way to put it." {He} looks at the cards. "I don't want to ruin the film."
-> 4.1.1: Help {him} tidy the cards away
-> 4.1.2: Leave {him} to get ready for bed

## 4.1.1
You help {him} pull the flashcards off the wall. Danny stacks them in order and wraps them in a hair tie. "There," {he} says. "Developing."
!fx love+2 stress-

## 4.1.2
You say goodnight. Danny is already pulling the cards off the wall when you leave, murmuring "developing, developing" under {his} breath.
!fx love+1

## 4.2
"Half an hour," you say. "Then bed. I'll know."
Danny salutes. "Half an hour." {He} sets the timer on {his} watch. You suspect {he}'ll actually stop.
-> 4.2.1: Check in on {him} later
-> 4.2.2: Trust {him} to do it

## 4.2.1
When you pass {his} door later, the light is off. You hear a sleepy, muffled "I stopped!" from inside.
!fx love+1

## 4.2.2
You trust {him}. Danny seems to notice, and stands a bit taller. "I'll stop," {he} says. "Promise."
!fx love+1 control+

## 5
"I've got the same test," you say. "I'm terrified."
Danny's face floods with relief. "Oh thank goodness. I thought I was the only one losing it." {He} sits down heavily. "Do you want to... revise together? Is that a thing people do?"
-> 5.1: Say yes, and pull up a chair
-> 5.2: Say you'd only distract each other

## 5.1
You pull up a chair. Revising with someone else is louder, slower and much more fun. Danny explains graphs to you; you explain fractions to {him}. By the end, you both feel slightly less doomed.
!fx love+2 stress-

## 5.2
"We'd just distract each other," you say.
Danny laughs. "Probably. But being distracted is better than being scared." {He} hands you half the cards anyway.
!fx love+1 stress-
`,
});
