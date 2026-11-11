/* Danny room conversations: Photography and Niki's studio. Format: see talk/engine.js. */
window.DannyTalkData = window.DannyTalkData || [];

window.DannyTalkData.push({
	id: "photo.contact",
	topic: "photo",
	title: "The contact sheet",
	src: `
## 0
Danny is sitting on the floor with a contact sheet held up to the lamp, squinting through a little plastic magnifying loupe. Rows of tiny pictures, thirty-six of them, each no bigger than a stamp.
"I developed a roll at Niki's today," {he} says without looking up. "I have to choose one to print properly. Niki says only one." {He} sounds personally wounded by this rule.
-> 1: Sit down and help {him} choose
-> 2: Ask why Niki only lets {him} print one
-> 3: Ask what {he} was photographing
-> 4: Pick one at random and say that one

## 1
You sit cross-legged beside {him}. Danny hands you the loupe without a word, and leans so close to see what you're looking at that {his} shoulder bumps yours. {He} doesn't seem to notice.
"Start top left," {he} says. "Tell me which ones are bad first. Then we can cross them out."
-> 1.1: Go through them one by one
-> 1.2: Say they all look good to you

## 1.1
The first row is mostly blurry pigeons. "Bad," Danny says. "Bad. Bad. That one's my thumb." The second row is the park. A bench, a puddle, the same bench from a different angle. "Boring," {he} decides, but {he} lingers on the puddle.
-> 1.1.1: Ask about the puddle
-> 1.1.2: Keep going to the third row

## 1.1.1
"What's in the puddle?" you ask.
Danny takes the loupe back and looks. "The sky," {he} says. "And the church spire upside down. And a leaf. I was lying on the path to get it. A man stepped over me." {He} hands the loupe back. "Look at the leaf."
-> 1.1.1.1: Look at the leaf carefully
-> 1.1.1.2: Laugh about the man stepping over {him}

## 1.1.1.1
You look. The leaf is perfectly sharp, floating on top of the reflection, and the upside-down spire disappears into it as if the leaf were a door.
"It looks like the church is falling into the leaf," you say.
Danny goes completely still. "That's what I thought," {he} whispers. "That's exactly what I thought when I took it."
!fx love+1
-> 1.1.1.1.1: Tell {him} this is the one
-> 1.1.1.1.2: Say you want to see the rest before deciding

## 1.1.1.1.1
"This one," you say. "Definitely."
Danny's face does something complicated. Pleased, and then worried. "But... Niki likes people. Portraits. {nHe} says landscapes are for people who are scared of faces." {He} looks at the floor. "{nHe}'s not wrong. I am a bit scared of faces."
-> 1.1.1.1.1.1: Ask why faces scare {him}
-> 1.1.1.1.1.2: Tell {him} to print what {he} loves, not what Niki likes

## 1.1.1.1.1.1
Danny turns the loupe over in {his} fingers. "Because you have to ask. And they look at you. And then they look at the camera, and they're waiting for you to be good at it." {He} breathes out. "A puddle doesn't wait. A puddle doesn't mind if you take ages."
-> 1.1.1.1.1.1.1: Point out that people might not mind either
-> 1.1.1.1.1.1.2: Tell {him} being careful isn't a bad thing

## 1.1.1.1.1.1.1
"Maybe people don't mind either," you say. "If it's you asking."
Danny snorts softly. "You'd be surprised." But {he} looks at you sideways, considering. "You don't seem to mind me taking ages. At anything."
-> 1.1.1.1.1.1.1.1: Tell {him} you don't
-> 1.1.1.1.1.1.1.2: Joke that you're very patient

## 1.1.1.1.1.1.1.1
"I don't," you say simply.
Danny looks down at the contact sheet for a long moment. "Then maybe... one day I could practise on you. Not now. When I'm braver. Just like, by the window. With a book or something." {He} says it all very fast. "You can say no."
<<if $trauma gte 2000>>The idea of being looked at that closely makes something in your chest tighten. But it's Danny, and {he}'s asking, not taking.<</if>>
-> 1.1.1.1.1.1.1.1.1: Say yes, one day
-> 1.1.1.1.1.1.1.1.2: Say you'd rather {he} photographed your hands, or your shoes, or something
-> 1.1.1.1.1.1.1.1.3: Admit being photographed makes you nervous ?? $trauma gte 2000

## 1.1.1.1.1.1.1.1.1
"One day," you say. "Yes."
Danny breathes out. "Okay," {he} says. "Okay. One day." {He} picks up a pencil and draws a small star on the corner of the puddle photo. "Then this one is the last landscape. Before the faces start."
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} it's a good one to end on
-> 1.1.1.1.1.1.1.1.1.2: Tell {him} {he} doesn't have to stop doing landscapes

## 1.1.1.1.1.1.1.1.1.1
"It's a good one to end on," you say.
Danny smiles, small and private, and holds the contact sheet up to the lamp one last time. The church falling into the leaf. "I'm going to print it big," {he} decides. "As big as Niki lets me. And put it over my bed." {He} looks at you. "So I remember the day I decided to be brave."
{He} slides the contact sheet carefully into a paper sleeve, and writes the date on it in neat pencil.
!fx love+3 stress-

## 1.1.1.1.1.1.1.1.1.2
"You don't have to stop doing puddles," you say. "You can do both."
Danny laughs. "Faces and puddles," {he} says. "That could be my exhibition. When I'm famous." {He} looks pleased with the idea, and writes FACES AND PUDDLES on the back of the sleeve.
!fx love+2

## 1.1.1.1.1.1.1.1.2
"Photograph my hands," you say. "Or my shoes. Start small."
Danny brightens. "Hands are really good, actually. Hands tell you loads." {He} looks at your hands, then quickly away, embarrassed to be caught looking. "Hands. Okay. That's a start."
!fx love+2

## 1.1.1.1.1.1.1.1.3
"Being photographed makes me nervous," you admit. "Being looked at."
Danny's face softens immediately. "Then I won't," {he} says. "Not unless you want. Ever." {He} puts the loupe down. "I'm sorry I asked."
"Don't be sorry. I'm glad you asked."
{He} nods slowly. "Okay. Then... it's yours to decide. Whenever. Or never." {He} goes back to the contact sheet, but {he} shifts a little closer, as if to say {he}'s on your side.
!fx love+2 trauma-

## 1.1.1.1.1.1.1.2
"I'm very patient," you say. "Like a puddle."
Danny bursts out laughing. "You are <i>not</i> like a puddle." {He} shoves your shoulder lightly. "Puddles are much quieter."
!fx love+1

## 1.1.1.1.1.1.2
"Being careful isn't bad," you say. "It's probably why your pictures are good."
Danny thinks about that. "Careful," {he} says. "Not scared. Just careful." {He} tries it out again, nodding. "I like careful better."
!fx love+1 stress-

## 1.1.1.1.1.2
"Print what you love," you say. "Not what Niki likes."
Danny hesitates. "Niki's the one who knows things," {he} says. Then, slowly: "But {nhe} also said <i>a photo you don't love is just paper</i>." {He} circles the puddle in pencil. "Okay. Puddle."
!fx love+1

## 1.1.1.1.2
You go through the rest. There's a cat on a wall, a bus with steamed-up windows, a blurry hand that Danny says is Niki trying to stop {him} wasting film. But you keep coming back to the puddle.
"It's the puddle, isn't it," Danny says. You nod. {He} circles it.
!fx love+1

## 1.1.1.2
You laugh. "A man just stepped over you?"
"He didn't even look down," Danny says, indignant. "I could have been dead. I could have been a dead photographer." {He} grins. "Worth it, though."
!fx love+1

## 1.1.2
The third row is better. A tree with a swing, a kid on the swing, the kid's mum laughing. Danny goes quiet. "I didn't ask them," {he} says. "Niki says you have to ask. I was too scared, so I just... took it."
-> 1.1.2.1: Say maybe that's the one, if {he} asks next time
-> 1.1.2.2: Suggest {he} chooses something else then

## 1.1.2.1
"Next time, ask," you say. "But it's a lovely picture."
Danny nods. "It is. I'll ask next time." {He} doesn't circle it, but {he} doesn't cross it out either.
!fx love+1

## 1.1.2.2
"Pick a different one, then," you say.
Danny looks relieved to be told. {He} crosses out the swing photo very lightly, so lightly it could be rubbed out again.

## 1.2
"They all look good to me," you say.
Danny gives you a flat look. "That one is my thumb."
-> 1.2.1: Insist it's an artistic thumb
-> 1.2.2: Admit you weren't really looking

## 1.2.1
"It's a very artistic thumb," you say.
Danny laughs despite {himself}. "It's not. It's a very normal thumb." But {he}'s smiling as {he} crosses it out.
!fx love+1

## 1.2.2
"Okay, I wasn't really looking," you admit.
Danny sighs, but hands you the loupe again. "Look properly this time." You do, and {he} seems to appreciate it.

## 2
"Why only one?"
"Paper's expensive," Danny says. "And Niki says if you print everything you never learn to choose. Choosing is half of it." {He} frowns at the sheet. "I hate choosing."
-> 2.1: Say Niki sounds wise
-> 2.2: Offer to buy {him} more paper ?? $money gte 2000
-> 2.3: Offer to help {him} choose, so it hurts less

## 2.1
"Niki sounds wise," you say.
"{nHe} is," Danny says, then lowers {his} voice. "Don't tell {nhim} I said that. {nHe}'ll be smug for a week."
-> 2.1.1: Promise to keep it secret
-> 2.1.2: Say you're definitely telling Niki

## 2.1.1
"Your secret's safe," you say. Danny nods gravely. "Thank you. A smug Niki is unbearable." {He} goes back to choosing.
!fx love+1

## 2.1.2
"I'm definitely telling," you say.
Danny gasps in horror. "You wouldn't." {He} throws the loupe's little cap at you. "Traitor."
!fx love+1 stress-

## 2.3
"Choosing's easier with two," you say. "You say why you like each one, I'll say why I don't."
Danny laughs. "You're going to be mean about my pictures?"
"Helpfully mean."
{He} considers, then hands you the sheet. "Okay. Helpfully mean. Go." It takes ten minutes, and a lot of arguing about a cat, but by the end there's one picture circled and Danny looks lighter for not having chosen it alone.
!fx love+1 stress-

## 2.2
"I could get you some more paper," you offer.
Danny looks at you in alarm. "No! It's expensive. And it's not the point. The point is choosing." {He} softens. "But that's really nice of you."
-> 2.2.1: Let it go
-> 2.2.2: Say the offer stands

## 2.2.1
You let it go. Danny seems relieved, and goes back to the contact sheet.
!fx love+1

## 2.2.2
"Offer stands," you say. Danny ducks {his} head, smiling. "Okay. Maybe for my birthday."
!fx love+1

## 3
"What were you shooting?"
"Anything," Danny says. "Niki gave me a roll and said <i>go out and come back with thirty-six things that made you stop</i>." {He} looks at the sheet. "Some of them only made me stop because I tripped."
-> 3.1: Ask which one made {him} stop the longest
-> 3.2: Laugh at the tripping

## 3.1
Danny points to a photo of an old woman's hands, holding a paper bag of breadcrumbs. "Her," {he} says. "I asked. She said yes. Then she told me about her husband for twenty minutes."
-> 3.1.1: Ask what she said
-> 3.1.2: Tell {him} that's a portrait, even if it's only hands

## 3.1.1
"He used to feed the ducks with her," Danny says quietly. "Every Sunday. For fifty years. Now she does it on her own." {He} looks at the photo. "I'm going to give her a print. If I can find her again."
!fx love+1

## 3.1.2
"That's a portrait," you say. "Hands count."
Danny stares at the photo. "Oh," {he} says. "I did a portrait. I didn't even notice." {He} looks absurdly pleased.
!fx love+2

## 3.2
You laugh. Danny glares, then laughs too. "There's a photo of the sky. Just sky. That's when I fell over."
-> 3.2.1: Ask to see the sky one
-> 3.2.2: Ask if {he} hurt {himself}

## 3.2.1
{He} finds it. It's a perfectly blue sky with a single wisp of cloud. "Accidental masterpiece," you say. Danny snorts. "Niki will say it's empty." "It's not empty. It's sky."
!fx love+1

## 3.2.2
Danny shows you a scrape on {his} palm, already healing. "Just this. I protected the camera," {he} says proudly. "Priorities."

## 4
You stab a finger at the sheet. "That one."
Danny peers at where you're pointing. "That's... a bin."
-> 4.1: Defend the bin
-> 4.2: Admit you didn't look

## 4.1
"It's a beautiful bin," you say. "Look at the light on the lid."
Danny looks. Then {he} looks closer. "...The light on the lid is actually quite nice," {he} admits, disturbed. "Oh no. Am I going to print the bin?"
-> 4.1.1: Say yes, print the bin
-> 4.1.2: Say no, you were joking

## 4.1.1
"Print the bin," you say solemnly.
Danny laughs so hard {he} has to lie down on the floor. "Niki will kill me. Thirty-six pictures and I print a bin." {He} wipes {his} eyes. "I'm not printing the bin."
!fx love+1 stress-

## 4.1.2
"I was joking," you say. Danny sits back, relieved. "Thank goodness. For a second I believed you."
!fx love+1

## 4.2
"I didn't actually look," you admit.
Danny sighs dramatically. "Of course you didn't." But {he} hands you the loupe. "Try again. Properly."
-> 4.2.1: Look properly
-> 4.2.2: Hand it back and let {him} choose

## 4.2.1
You look properly. You find the puddle with the leaf in it, and point. Danny's face lights up. "That's the one I wanted," {he} says.
!fx love+2

## 4.2.2
You hand it back. "Your pictures. Your choice." Danny nods slowly, and chooses the puddle without any help at all.
!fx control+
`,
});

window.DannyTalkData.push({
	id: "photo.shift",
	topic: "photo",
	title: "A shift at Niki's",
	src: `
## 0
Danny comes in still wearing {his} coat, and drops onto the bed face first. {He} lies there without moving.
"Mmmf," {he} says into the pillow. Then {he} rolls over. "The Hendersons came in. For a family photo. With the twins."
{He} stares at the ceiling. "They're three."
-> 1: Ask {him} to tell you everything
-> 2: Ask if Niki was okay with how it went
-> 3: Ask if {he} got paid at least
-> 4: Tell {him} to take {his} coat off before {he} melts
-> 5: Ask how Niki is doing, since you know {nhim} a bit ?? npcLove("Niki") gte 10

## 1
Danny sits up, coat still on, and starts counting things off on {his} fingers. "One twin would only sit if the other one was crying. The other one would only stop crying if it could hold the camera. Mrs Henderson wanted everyone to smile. Mr Henderson wanted it to look <i>natural</i>."
{He} flops back down. "Niki just sat and drank tea."
-> 1.1: Ask what Danny did
-> 1.2: Laugh at the image of Niki drinking tea

## 1.1
"So what did you do?"
Danny is quiet for a moment. "Niki said <i>you handle it</i>," {he} says. "And then {nhe} really did just sit there. So I... got down on the floor. With the twins."
-> 1.1.1: Ask what happened on the floor
-> 1.1.2: Ask if {he} was scared

## 1.1.1
"I pulled faces," Danny says, a little embarrassed. "And I made the lens cap talk. Like a puppet. It had a squeaky voice and it was very upset about being a lens cap."
{He} covers {his} face. "One twin laughed so hard she fell over."
-> 1.1.1.1: Ask {him} to do the lens cap voice
-> 1.1.1.2: Ask if the photo turned out well

## 1.1.1.1
"Do the voice," you say.
Danny peeks through {his} fingers. "No."
"Please."
{He} sighs, takes the lens cap off {his} camera, holds it up, and in a tiny, squeaky voice says: "<i>I am trapped on the front of this camera and nobody ever asks how I feel.</i>"
You crack up. Danny tries to keep a straight face and fails completely.
!fx love+1 stress-
-> 1.1.1.1.1: Ask the lens cap how it feels
-> 1.1.1.1.2: Tell Danny {he} should do kids' portraits

## 1.1.1.1.1
"How do you feel, lens cap?" you ask gravely.
"<i>Unappreciated,</i>" squeaks the lens cap. "<i>Danny drops me constantly. Last week I rolled under the radiator.</i>"
"That sounds terrible."
"<i>It was dusty,</i>" says the lens cap. Danny's shoulders are shaking.
-> 1.1.1.1.1.1: Promise the lens cap Danny will be more careful
-> 1.1.1.1.1.2: Ask the lens cap what it thinks of Danny's photos

## 1.1.1.1.1.1
"Danny will be more careful," you tell the lens cap. "I'll make sure."
"<i>Thank you,</i>" the lens cap squeaks. "<i>You are the only person who understands me.</i>" Danny lowers it and wipes {his} eyes. "Okay. The lens cap needs a rest."
!fx love+1

## 1.1.1.1.1.2
"What does the lens cap think of Danny's photos?"
The lens cap is quiet for a second. "<i>I never get to see them,</i>" it squeaks, and then, in a smaller voice, "<i>But Niki says they're getting good. Niki said it today. Out loud.</i>"
Danny lowers the cap. {His} face has gone pink. "{nHe} did, actually. Say that." {He} looks like {he}'s been holding the news in all evening.
-> 1.1.1.1.1.2.1: Ask what exactly Niki said
-> 1.1.1.1.1.2.2: Tell {him} that's huge

## 1.1.1.1.1.2.1
"What did {nhe} say? Exactly?"
Danny closes {his} eyes to remember it properly. "{nHe} looked at the back of the camera, and said <i>hm</i>. And then {nhe} said <i>you made them forget you were there. That's the whole job.</i>" {He} opens {his} eyes. "And then {nhe} gave me a biscuit."
-> 1.1.1.1.1.2.1.1: Point out that the biscuit means {nhe} meant it
-> 1.1.1.1.1.2.1.2: Ask how it felt to hear that

## 1.1.1.1.1.2.1.1
"A biscuit," you say. "That's serious. Niki doesn't hand those out."
"That's what I thought!" Danny sits up, coat finally sliding off one shoulder. "The good biscuits. From the tin. Not the plain ones."
{He} pulls {his} coat off properly and folds it over {his} knees, smoothing it out. "I didn't think I could do it. The faces part. But it wasn't about faces. It was about making them laugh."
-> 1.1.1.1.1.2.1.1.1: Tell {him} that's something {he}'s naturally good at
-> 1.1.1.1.1.2.1.1.2: Joke that {his} career as a lens cap puppeteer is assured

## 1.1.1.1.1.2.1.1.1
"You're good at that," you say. "Making people feel okay. You do it with me."
Danny freezes. Then {he} looks at you, really looks, the way {he} looks at a photo {he}'s not sure about. "I do?"
"You do."
{He} swallows, and nods, and looks down at {his} coat. "I didn't know that," {he} says quietly. "I thought I was just the weird quiet one."
-> 1.1.1.1.1.2.1.1.1.1: Tell {him} {he} can be both
-> 1.1.1.1.1.2.1.1.1.2: Tell {him} quiet people notice the most

## 1.1.1.1.1.2.1.1.1.1
"You can be both," you say. "Weird and quiet and good at making people feel okay."
Danny laughs, a little wet around the edges. "That's a lot of things to be." {He} rubs {his} eyes with the heel of {his} hand. "Okay. I'll be all of them."
{He} picks up the lens cap and clicks it back onto the camera, gently, like tucking something in. "Thanks. I'm going to remember today. The biscuit day."
!fx love+3 stress-

## 1.1.1.1.1.2.1.1.1.2
"Quiet people notice the most," you say. "That's why the twins trusted you."
Danny turns that over for a while. "Maybe," {he} says. "I did notice the crying one wanted to hold something. That's why I gave her the lens cap." {He} smiles slowly. "I noticed."
!fx love+2 control+

## 1.1.1.1.1.2.1.1.2
"Your future as a lens cap puppeteer is assured," you say.
"<i>Finally,</i>" squeaks the lens cap, and Danny dissolves into giggles again. "Niki would hire me for that. Full time. Just the voice."
!fx love+1 stress-

## 1.1.1.1.1.2.1.2
"How did it feel?"
Danny thinks about it. "Like... warm. In my chest. Like when you drink hot chocolate too fast." {He} presses a hand to {his} sternum. "It's still there a bit."
!fx love+2

## 1.1.1.1.1.2.2
"Danny, that's huge," you say.
Danny goes even pinker. "It's just one compliment," {he} says, but {he} can't stop smiling.
!fx love+1

## 1.1.1.1.2
"You should do kids' portraits," you say. "You're clearly a natural."
Danny makes a face. "They're sticky," {he} says. "Everything they touch is sticky." But {he} looks thoughtful. "I'd be good at it, though. Maybe."
!fx love+1

## 1.1.1.2
"Did the photo come out?"
"We don't know yet. It's film. I develop it tomorrow." Danny crosses {his} fingers on both hands. "If even one frame has everyone looking the same way, it's a miracle."
-> 1.1.1.2.1: Cross your fingers too
-> 1.1.1.2.2: Tell {him} you're sure at least one will be good

## 1.1.1.2.1
You cross your fingers too. Danny grins. "Double luck. That should do it."
!fx love+1

## 1.1.1.2.2
"At least one will be good," you say. "I'm sure." Danny nods, wanting to believe you. "One is all you need."

## 1.1.2
"Were you scared?"
"Terrified," Danny admits. "My hands were shaking. But the twins didn't care. They were three. They just wanted the lens cap."
-> 1.1.2.1: Tell {him} it's brave to be scared and do it anyway
-> 1.1.2.2: Ask if {he}'d do it again

## 1.1.2.1
"That's brave," you say. "Scared and doing it anyway."
Danny looks at you uncertainly. "It didn't feel brave. It felt like falling." But {he} sits a bit taller.
!fx love+1 control+

## 1.1.2.2
"Would you do it again?"
Danny considers this for a long time. "Yes," {he} says at last. "But I'd bring a spare lens cap."
!fx love+1

## 1.2
You laugh. "{nHe} just drank tea?"
"The whole time," Danny says. "Two cups. {nHe} even had a biscuit." {He} sounds betrayed. "And then afterwards {nhe} said <i>see, you didn't need me.</i>"
-> 1.2.1: Say maybe that was the point
-> 1.2.2: Agree that's outrageous

## 1.2.1
"Maybe that was the point," you say.
Danny pauses. "Oh," {he} says. "Oh. That's sneaky." {He} smiles slowly. "That's very Niki."
!fx love+1

## 1.2.2
"Outrageous," you agree. "A biscuit, too."
"Exactly!" Danny says, vindicated.
!fx love+1

## 2
"Was Niki okay with how it went?"
Danny pulls {his} coat tighter. "I think so. {nHe} didn't say anything bad. {nHe} doesn't say much. {nHe} just goes <i>hm</i>."
-> 2.1: Ask what kind of hm
-> 2.2: Say no news is good news

## 2.1
"What kind of hm?"
Danny brightens. "There are different kinds! A low <i>hm</i> is bad. A short <i>hm</i> means fine. A long <i>hmmm</i> with eyebrows means good." {He} considers. "Today was a long one. With one eyebrow."
-> 2.1.1: Say one eyebrow sounds promising
-> 2.1.2: Ask what two eyebrows means

## 2.1.1
"One eyebrow sounds promising," you say. Danny nods seriously. "It's the best I've had." {He} looks quietly proud.
!fx love+1

## 2.1.2
"What's two eyebrows?"
"I don't know," Danny says, awed. "I've never seen it. I think it's a myth."
!fx love+1

## 2.2
"No news is good news," you say. Danny nods slowly. "Yeah. If it was bad {nhe}'d say. {nHe}'s honest." {He} relaxes a bit.
-> 2.2.1: Tell {him} {he} worries too much
-> 2.2.2: Ask what Niki's honest about

## 2.2.1
"You worry too much," you say gently. Danny half-smiles. "I know. It's my main hobby." {He} doesn't look offended.
!fx love+1

## 2.2.2
"Last week {nhe} said my framing was <i>timid</i>," Danny says. "{nHe} was right. I keep everything in the middle." {He} frowns. "I'm trying to be less timid."
!fx love+1

## 3
"Did you get paid at least?"
"Some," Danny says. "Niki pays me in cash and pretends {nhe} forgot to count it." {He} smiles a little. "It's always a bit more than it should be."
-> 3.1: Ask what {he}'s saving for
-> 3.2: Say Niki sounds kind

## 3.1
"What are you saving for?"
Danny hesitates. "A proper lens. A fifty millimetre. For portraits." {He} glances at you. "And maybe... a room. Somewhere. When I'm older. That's further away."
-> 3.1.1: Tell {him} both sound like good things to save for
-> 3.1.2: Ask how close {he} is to the lens

## 3.1.1
"Both sound worth saving for," you say. Danny nods. "The lens first. The room later." {He} looks at the ceiling as if {he} can see it already.
!fx love+1

## 3.1.2
"About halfway," Danny says. "If Bailey doesn't put the rent up." {He} says it lightly, but {his} jaw tightens.

## 3.2
"Niki sounds kind," you say.
"{nHe} is," Danny says. "Grumpy. But kind." {He} considers. "Grumpy-kind is my favourite kind of person."
-> 3.2.1: Ask if you count as grumpy-kind
-> 3.2.2: Ask who else is grumpy-kind

## 3.2.1
"Am I grumpy-kind?"
Danny studies you. "No," {he} decides. "You're just kind-kind." {He} goes red and looks away.
!fx love+2

## 3.2.2
"The lady at the library," Danny says. "And the bus driver on the morning route. He always waits for me." {He} smiles. "The world has more of them than you'd think."
!fx love+1

## 4
"Take your coat off before you melt."
Danny looks down at {himself} as if {he}'d forgotten. "Oh." {He} wriggles out of it. "I was so tired I didn't notice."
-> 4.1: Hang it up for {him}
-> 4.2: Tell {him} to lie down for a bit

## 4.1
You hang it on the hook behind the door. Danny watches you. "Thanks," {he} says, surprised. "Nobody does that."
-> 4.1.1: Say it was nothing
-> 4.1.2: Tell {him} people should

## 4.1.1
"It was nothing," you say. Danny nods, but {he} keeps looking at the coat on the hook, smiling a little.
!fx love+1

## 4.1.2
"People should," you say. Danny doesn't answer, but {his} eyes go a bit shiny, and {he} looks away fast.
!fx love+2

## 4.2
"Lie down for a bit," you say. Danny doesn't need telling twice. {He} curls up on top of the covers. "Five minutes," {he} mumbles.
-> 4.2.1: Let {him} rest and leave quietly
-> 4.2.2: Ask one more question before {he} drifts off

## 4.2.1
You leave quietly. By the time you reach the door, Danny's breathing has already slowed.
!fx love+1

## 4.2.2
"Was it a good day?" you ask quietly.
Danny's eyes are closed. "Mm. Yeah. A good tiring day," {he} murmurs, and is asleep before you reach the door.
!fx love+1

## 5
"How's Niki doing?" you ask. "I've met {nhim} a few times."
Danny's eyes widen. "You know Niki? Properly?" {He} sits up. "Did {nhe} ever... say anything about me?"
-> 5.1: Tell {him} Niki mentioned {his} eye for light
-> 5.2: Admit Niki doesn't really talk about other people

## 5.1
"{nHe} said you had a good eye for light," you say. It's close enough to true.
Danny stares at you, then hides {his} face in {his} coat collar. "{nHe} never says that to <i>me</i>," {he} mumbles, delighted.
!fx love+2

## 5.2
"{nHe} doesn't really talk about other people," you admit.
Danny nods. "No. {nHe}'s like that. Private." {He} smiles. "I like that, actually. It means {nhe} doesn't talk about me either."
!fx love+1
`,
});

window.DannyTalkData.push({
	id: "photo.stilllife",
	topic: "photo",
	title: "The still life",
	src: `
## 0
Danny has cleared {his} desk and arranged three things on it: an apple, a chipped teacup, and a battered paperback. {He}'s crouched in front of them with {his} camera, moving the lamp an inch at a time.
"Niki set homework," {he} says. "A still life. <i>Make three boring things interesting.</i>" {He} squints at the apple. "The apple is winning. At being boring."
-> 1: Offer to help with the lighting
-> 2: Suggest swapping one of the objects
-> 3: Ask why Niki sets homework like this
-> 4: Take a bite of the apple

## 1
"Want help with the light?" you ask.
Danny nods gratefully and hands you the lamp. "Hold it. I'll tell you where." {He} crouches back down, one eye shut.
-> 1.1: Hold it exactly where {he} says
-> 1.2: Try a wild angle of your own

## 1.1
"Left. Bit more. Down. No, up. Stop." You freeze. Danny peers through the viewfinder for a long moment.
"Better," {he} says. "The cup has a shadow now. But the apple's still flat."
-> 1.1.1: Ask what would make the apple less flat
-> 1.1.2: Suggest just leaving the apple out

## 1.1.1
Danny chews {his} lip. "Light from the side. Low. So the skin shines on one edge and the other edge goes dark." {He} looks around. "The window. If we turn the lamp off and use the street light..."
-> 1.1.1.1: Turn the lamp off
-> 1.1.1.2: Point out it'll be really dark

## 1.1.1.1
You switch the lamp off. The room goes orange-dim, lit only by the streetlamp outside. Danny moves the apple to the windowsill, then the teacup, then the book.
"Oh," {he} breathes. "Oh, look."
The apple is glowing along one side, the teacup's chip catching the light like a tiny moon.
-> 1.1.1.1.1: Tell {him} it looks like a painting
-> 1.1.1.1.2: Stay quiet and let {him} shoot

## 1.1.1.1.1
"It looks like a painting," you whisper, though there's no reason to whisper.
"Dutch," Danny whispers back. "Old Dutch paintings. Niki showed me a book." {He} lifts the camera. "Stay still. You're casting a shadow."
You hold your breath. Click. Danny winds the film on. Click.
-> 1.1.1.1.1.1: Ask how {he} knows when it's right
-> 1.1.1.1.1.2: Move out of the way so {he} has more light

## 1.1.1.1.1.1
"How do you know when it's right?" you ask.
Danny lowers the camera. {He} thinks about it for a long time, frowning. "It's like... when a song you know comes on. You don't decide to like it. It just goes <i>there</i>." {He} taps {his} chest. "If I have to think about whether it's right, it's not right yet."
-> 1.1.1.1.1.1.1: Tell {him} that's a beautiful way to describe it
-> 1.1.1.1.1.1.2: Ask if it's gone <i>there</i> tonight

## 1.1.1.1.1.1.1
"That's a beautiful way to put it," you say.
Danny ducks {his} head. "I've never said it out loud before. It sounded stupid in my head." {He} looks back at the windowsill. "It sounds less stupid when you say it's not."
-> 1.1.1.1.1.1.1.1: Ask what else {he}'s never said out loud
-> 1.1.1.1.1.1.1.2: Tell {him} nothing {he} says sounds stupid to you

## 1.1.1.1.1.1.1.1
"What else have you never said out loud?" you ask, gently.
Danny is quiet for a long time. The streetlight hums. Then: "That I want to be really good. Not just okay. Really good. Like, people stopping in the street to look." {He} winds the film on without taking a photo, just to have something to do with {his} hands. "That feels like something you're not supposed to want. When you're from... here."
<<if dannyAcceptance() gte 400>>{He} says it steadily, though. Like {he}'s decided {he}'s allowed to want things.<</if>>
-> 1.1.1.1.1.1.1.1.1: Tell {him} {he}'s allowed to want that
-> 1.1.1.1.1.1.1.1.2: Ask what {he} means by <i>here</i>
-> 1.1.1.1.1.1.1.1.3: Tell {him} you feel the same way about things you want ?? $control gte 600 or dannyLove() gte 40

## 1.1.1.1.1.1.1.1.1
"You're allowed to want that," you say. "Wanting it is how you get there."
Danny looks at you in the orange half-light. "You really think so?"
"I really do."
{He} lets out a breath and turns back to the windowsill. {He} takes one more photo, very carefully. Then {he} lowers the camera and smiles at it. "That one went <i>there</i>," {he} says softly.
-> 1.1.1.1.1.1.1.1.1.1: Ask to see it when it's developed
-> 1.1.1.1.1.1.1.1.1.2: Turn the lamp back on

## 1.1.1.1.1.1.1.1.1.1
"Show me when it's developed?"
"You'll be first," Danny says. "Before Niki, even." {He} says it like a promise. Then {he} reaches over and switches the lamp back on, and you both blink in the sudden light, and laugh at each other for blinking.
{He} picks up the apple, turns it over, and takes a big bite. "Payment," {he} explains, mouth full, and offers you the other side.
!fx love+3 stress- acceptance+

## 1.1.1.1.1.1.1.1.1.2
You switch the lamp back on. Danny blinks, then laughs. "It's so ugly in normal light," {he} says, looking at the apple. "It was so beautiful a minute ago." {He} shakes {his} head. "That's the whole thing, isn't it. It's all the light."
!fx love+2

## 1.1.1.1.1.1.1.1.2
"What do you mean, <i>here</i>?"
Danny gestures vaguely at the room, the house, the creaking stairs. "The orphanage. Kids from here don't become... things. We become whatever's left." {He} shrugs. "That's what it feels like, anyway. Bailey says <i>be grateful</i> a lot."
-> 1.1.1.1.1.1.1.1.2.1: Tell {him} where you're from doesn't decide what you become
-> 1.1.1.1.1.1.1.1.2.2: Tell {him} you're from here too, and you're not giving up

## 1.1.1.1.1.1.1.1.2.1
"Where you're from doesn't decide that," you say.
Danny looks at you for a while. "I want that to be true," {he} says. Then, quietly: "Maybe it is if enough people say it."
!fx love+2 acceptance+

## 1.1.1.1.1.1.1.1.2.2
"I'm from here too," you say. "And I'm not settling for whatever's left."
Danny's eyes widen. Then {he} grins, slow and a bit fierce. "Okay. Then neither am I." {He} lifts the camera again with new purpose.
!fx love+2 control+

## 1.1.1.1.1.1.1.1.3
"I feel the same about things I want," you say. "Like I'm not supposed to."
Danny turns to look at you properly. "Really?" You nod. {He} thinks about that. "Then let's both want things anyway," {he} says. "Out loud. At least in here."
!fx love+2 stress-

## 1.1.1.1.1.1.1.2
"Nothing you say sounds stupid to me," you say.
Danny makes a doubtful noise. "I once said <i>bless you</i> to a cat." But {he} smiles. "Thanks."
!fx love+1

## 1.1.1.1.1.1.2
"Has it gone <i>there</i> tonight?"
Danny lifts the camera and looks for a long moment. "Almost," {he} says. "One more." Click. {He} lowers it, grinning. "Now it has."
!fx love+1

## 1.1.1.1.1.2
You step back out of the light. Danny gives you a quick thumbs up without looking away from the viewfinder, and takes three more photos. When {he}'s done, {he} sits back on {his} heels, glowing. "I think I got it," {he} says.
!fx love+1

## 1.1.1.1.2
You stay quiet. Danny shoots, winds, shoots. When {he} finally lowers the camera {he} looks at you, surprised to find you still there. "Sorry. I forgot you were here. That's a compliment, I promise."
!fx love+1

## 1.1.1.2
"It'll be really dark," you say.
"That's the point," Danny says. "Dark is where the shape comes from." {He} switches the lamp off {himself}. The apple glows. "See?"
!fx love+1

## 1.1.2
"Leave the apple out," you suggest.
Danny looks scandalised. "The task is <i>three</i> things. Niki will count." {He} glares at the apple. "It stays. It has to earn its place."
!fx love+1

## 1.2
You hold the lamp right down low, almost on the floor, shining up. Shadows leap up the wall, enormous. The teacup looks like a castle.
Danny gasps. "Don't move."
-> 1.2.1: Hold perfectly still
-> 1.2.2: Wiggle the lamp to make the shadows dance

## 1.2.1
You hold perfectly still. Danny takes four photos in a row, then grins up at you. "That was an accident and it's the best one."
!fx love+2

## 1.2.2
You wiggle the lamp. The shadow-castle dances. Danny laughs and nearly drops the camera. "Stop! I'll get a blurry ghost castle." {He} gets one anyway, and likes it.
!fx love+1 stress-

## 2
"Swap the apple for something else," you say. "Something with a story."
Danny looks interested. "Like what?"
-> 2.1: Suggest {his} old camera strap
-> 2.2: Suggest something of yours

## 2.1
Danny touches the worn strap round {his} neck. "This?" {He} lifts it off and coils it next to the teacup. Suddenly the arrangement looks like someone's life rather than a shop window.
-> 2.1.1: Tell {him} that's the one
-> 2.1.2: Ask where the strap came from

## 2.1.1
"That's it," you say. Danny nods slowly. "Niki said <i>interesting</i>. Not pretty. This is interesting." {He} starts shooting.
!fx love+1

## 2.1.2
"Where's it from?"
"Second-hand shop," Danny says. "It was on a camera that didn't work. I bought the camera for the strap." {He} smiles. "The camera's still in a drawer."
!fx love+1

## 2.2
You fish in your pocket and put something small on the desk. Danny looks at it, then at you. "Can I? Really?"
-> 2.2.1: Say yes, of course
-> 2.2.2: Say only if {he} gives it back

## 2.2.1
"Of course," you say. Danny arranges it with great care, as if it were made of glass, and takes a photo. "That's my favourite of the three now," {he} admits.
!fx love+2

## 2.2.2
"Only if I get it back," you tease. Danny clutches it dramatically. "I'll guard it with my life." {He} returns it after exactly one photo.
!fx love+1

## 3
"Why does Niki set homework like this?"
"{nHe} says anyone can make a sunset look good," Danny says. "But if you can make an apple look good, you can make anything look good." {He} sighs. "I think {nhe} just likes watching me suffer."
-> 3.1: Agree that's probably it
-> 3.2: Say it's actually a clever idea

## 3.1
"Definitely suffering," you agree.
"I knew it," Danny says darkly, and then laughs. "No. {nHe}'s right. I hate that {nhe}'s right."
-> 3.1.1: Encourage {him} to prove {nhim} right
-> 3.1.2: Suggest {he} makes the apple look sinister instead

## 3.1.1
"Prove {nhim} right, then," you say. Danny squares up to the apple. "Fine. Apple. You're going to look amazing whether you like it or not."
!fx love+1 control+

## 3.1.2
"Make it look sinister," you suggest. Danny's eyes light up. {He} moves the lamp underneath. The apple looks deeply evil. "Niki said <i>interesting</i>," {he} says innocently.
!fx love+1 stress-

## 3.2
"It's actually clever," you say. "Like practising scales on a piano."
Danny blinks. "That's... yeah. Boring scales so you can play the good stuff." {He} looks at the apple with more respect.
-> 3.2.1: Ask if {he} plays any instruments
-> 3.2.2: Let {him} get back to shooting

## 3.2.1
"Do you play anything?" Danny shakes {his} head. "There's a piano downstairs with three keys missing. I can play the start of one song. Badly." {He} grins. "Very badly."
!fx love+1

## 3.2.2
You let {him} get back to it. Danny works in comfortable silence, and you watch the lamp move by tiny degrees.

## 4
You pick up the apple and take a big bite.
Danny stares at you, horrified. "That was my <i>subject</i>."
-> 4.1: Put it back, bite side facing the camera
-> 4.2: Apologise and offer to find another

## 4.1
You put it back with the bite facing the lens. Danny opens {his} mouth to protest, then stops. Then {he} looks through the viewfinder. "...Oh no," {he} says. "It's better. It's actually better. It has a story now."
-> 4.1.1: Look smug
-> 4.1.2: Say you were just hungry

## 4.1.1
You look smug. Danny glares at you over the camera. "Don't. Don't look like that." But {he}'s laughing, and {he} takes the photo.
!fx love+2

## 4.1.2
"I was just hungry," you say. Danny shakes {his} head. "Accidental genius," {he} mutters, and starts shooting.
!fx love+1

## 4.2
"Sorry," you say. "I'll find another." Danny sighs, then shrugs. "It's fine. Bailey won't notice one more apple gone." {He} looks at the bitten one thoughtfully. "Actually... leave it."
-> 4.2.1: Leave it
-> 4.2.2: Insist on finding another

## 4.2.1
You leave it. Danny photographs the bitten apple with great seriousness. "Title: <i>Evidence</i>," {he} says.
!fx love+1

## 4.2.2
You go to the kitchen and come back with another apple. Danny laughs. "Now I have two subjects. A before and after." {He} sets them side by side.
!fx love+1
`,
});
