/* Danny room conversations: Family and home. Format: see talk/engine.js. */
window.DannyTalkData = window.DannyTalkData || [];

window.DannyTalkData.push({
	id: "family.littleones",
	topic: "family",
	title: "The little ones",
	src: `
## 0
Danny looks tired. There are shadows under {his} eyes, and {he}'s sitting on the floor with {his} back against the bed, a picture book from the common room open on {his} lap.
"One of the little ones had a nightmare," {he} says. "Last night. She was crying in the corridor. Bailey didn't come." {He} turns a page of the picture book without looking at it. "So I did."
-> 1: Sit down beside {him} and ask what happened
-> 2: Ask if {he} got any sleep at all
-> 3: Ask why Bailey didn't come
-> 4: Tell {him} that was kind of {him}
-> 5: Mention that Robin sometimes looks after the little ones too ?? npcLove("Robin") gte 20

## 1
You sit down on the floor next to {him}, your shoulders not quite touching. Danny shifts a little so there's room.
"She's six," {he} says. "New. She came last month. She didn't know where the toilet was in the dark and she got lost and then she got scared and then she couldn't stop crying." {He} rubs {his} eyes. "I know what that's like. The first weeks."
-> 1.1: Ask what {he} did for her
-> 1.2: Ask what {his} first weeks were like

## 1.1
"What did you do?"
"Showed her where the toilet was. Then she didn't want to go back to her room on her own, so I sat outside her door." Danny holds up the picture book. "I read her this. Through the door. Three times."
-> 1.1.1: Ask what the book is about
-> 1.1.2: Ask how long {he} stayed

## 1.1.1
Danny turns it so you can see. A badger in a scarf, standing outside a burrow. "It's about a badger who's scared of the dark. So his friends bring him lights. A firefly, a glow-worm, the moon." {He} smiles faintly. "In the end he's still scared, but he has lots of lights. So it's okay."
-> 1.1.1.1: Say that's a good ending
-> 1.1.1.2: Ask if it worked on her

## 1.1.1.1
"That's a good ending," you say. "Still scared, but okay."
Danny looks at the badger for a long time. "It's the only kind of ending that's true," {he} says. "Nobody stops being scared. They just get more lights." {He} glances at you, then back at the book. "That's what the book's actually about. I think."
-> 1.1.1.1.1: Ask what {his} lights are
-> 1.1.1.1.2: Tell {him} {he} was her light last night

## 1.1.1.1.1
"What are your lights?" you ask.
Danny thinks. "My camera. The darkroom at Niki's. The library when it's empty." {He} picks at the corner of the page. "Mornings at the beach." A pause, and then, quieter: "This. Talking. When someone actually listens."
<<if dannyLove() gte 40>>{He} doesn't look at you when {he} says it, but {his} shoulder leans against yours, just slightly.<</if>>
-> 1.1.1.1.1.1: Tell {him} {he}'s one of yours
-> 1.1.1.1.1.2: Ask when {he} started needing lights

## 1.1.1.1.1.1
"You're one of mine," you say. "A light."
Danny goes very still. Then {he} breathes out, slow and shaky. "Really?"
"Really."
{He} closes the picture book and holds it against {his} chest. "Nobody's ever said that. That I'm... that I help." {He} swallows. "I always feel like the one who needs things. Not the one who gives them."
-> 1.1.1.1.1.1.1: Point out {he} gave a scared six-year-old a whole night
-> 1.1.1.1.1.1.2: Tell {him} people can be both

## 1.1.1.1.1.1.1
"You gave a scared six-year-old a whole night," you say. "You read to her through a door. That's giving."
Danny stares at the badger on the cover. "I didn't think of it like that," {he} says slowly. "I just... didn't want her to feel how I felt." {He} rubs {his} nose with the back of {his} wrist. "When I came here nobody sat outside my door."
-> 1.1.1.1.1.1.1.1: Ask {him} gently about that
-> 1.1.1.1.1.1.1.2: Tell {him} somebody's sitting with {him} now

## 1.1.1.1.1.1.1.1
"What was it like?" you ask gently. "When you came."
Danny is quiet so long you think {he} won't answer. Then: "Big. Loud. Everyone already had friends. I didn't know the rules. I got in trouble for things I didn't know were wrong." {He} turns the book over in {his} hands. "I used to make myself really small. In the corner of the common room. I'd count the floorboards."
<<if $trauma gte 2000>>You know that kind of small. You've made yourself that small too.<</if>>
-> 1.1.1.1.1.1.1.1.1: Tell {him} you're glad {he} isn't in the corner anymore
-> 1.1.1.1.1.1.1.1.2: Ask how many floorboards there are
-> 1.1.1.1.1.1.1.1.3: Tell {him} you used to make yourself small too ?? $trauma gte 2000 or dannyAcceptance() gte 400

## 1.1.1.1.1.1.1.1.1
"I'm glad you're not in the corner anymore," you say.
Danny looks at you. "I'm sort of still in the corner," {he} says. "Just a bigger one. With a camera." But {he} smiles a little as {he} says it.
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} it's a good corner, and you'll visit
-> 1.1.1.1.1.1.1.1.1.2: Tell {him} the little girl will remember what {he} did

## 1.1.1.1.1.1.1.1.1.1
"It's a good corner," you say. "I'll keep visiting."
Danny laughs, a small, surprised sound, and wipes {his} eyes quickly as if {he} hopes you didn't see. "Okay," {he} says. "Good. Visit the corner."
{He} gets up, a bit stiff from sitting on the floor, and slides the picture book onto {his} shelf, next to {his} beetle book and {his} camera manuals. "I'm going to give it back to the common room tomorrow," {he} says. "But I want to keep it tonight. In case she knocks again."
!fx love+3 trauma- stress-

## 1.1.1.1.1.1.1.1.1.2
"She'll remember," you say. "That someone came."
Danny nods slowly. "I'll make sure someone always does," {he} says. "Even if it's just me." {He} sounds, for once, completely sure of something.
!fx love+2 acceptance+

## 1.1.1.1.1.1.1.1.2
"How many floorboards are there?" you ask.
"Forty-three," Danny says instantly. Then {he} laughs, startled at {himself}. "I can't believe I still know that." {He} shakes {his} head, smiling. "Forty-three. And one creaky one by the door."
!fx love+1 stress-

## 1.1.1.1.1.1.1.1.3
"I used to make myself small too," you say quietly. "Sometimes I still do."
Danny turns to look at you properly. Neither of you says anything for a moment. Then {he} reaches over and puts the picture book in your lap, open to the page where the badger's friends bring him the moon. "You can borrow the lights," {he} says. "If you want."
!fx love+2 trauma- stress-

## 1.1.1.1.1.1.1.2
"Someone's sitting with you now," you say.
Danny doesn't answer. {He} just tips {his} head back against the bed and closes {his} eyes, and the two of you sit there for a while. It's enough.
!fx love+2 stress-

## 1.1.1.1.1.1.2
"People can be both," you say. "Needing things and giving them."
Danny thinks about it. "Both," {he} says. "Okay. I can be both." {He} smiles at the badger.
!fx love+1 acceptance+

## 1.1.1.1.1.2
"When did you start needing lights?"
Danny shrugs. "Always, I think. Before here, too. I don't remember a time I wasn't a bit scared." {He} says it without drama. "But the camera helps most. When I'm looking through it, I'm not the one being looked at."
!fx love+1

## 1.1.1.1.2
"You were her light last night," you say.
Danny looks startled. Then {his} face goes soft. "I hadn't thought of it like that," {he} says. "A glow-worm. I was a glow-worm." {He} smiles, tired but real.
!fx love+2

## 1.1.1.2
"Did it work on her?"
"She fell asleep on the third time," Danny says. "I heard her snoring through the door." {He} smiles. "Really loud snoring. For a really small person."
!fx love+1

## 1.1.2
"How long did you stay?"
Danny looks at the floor. "Until it got light. In case she woke up again." {He} yawns hugely, as if remembering. "I'm really tired."
-> 1.1.2.1: Tell {him} to have a nap now
-> 1.1.2.2: Tell {him} that was above and beyond

## 1.1.2.1
"Have a nap," you say. "Right now. I'll go." Danny is already climbing onto the bed. "Just twenty minutes," {he} mumbles. "Wake me if she cries."
!fx love+1

## 1.1.2.2
"That was above and beyond," you say. Danny shrugs. "Someone had to," {he} says. But {he} looks pleased you noticed.
!fx love+1

## 1.2
"What were your first weeks like?"
Danny's mouth tightens. "Loud. Lonely. I cried every night and tried to do it really quietly so nobody would hear." {He} shrugs. "Everybody heard anyway."
-> 1.2.1: Tell {him} you're sorry nobody came
-> 1.2.2: Ask what helped, in the end

## 1.2.1
"I'm sorry nobody came," you say. Danny nods, not trusting {his} voice. After a while {he} says, "It's okay. I came for her. That makes it a bit better."
!fx love+2

## 1.2.2
"What helped?" "The camera," Danny says. "Someone left a broken one in the donations box. I took it apart and put it back together. Over and over. It gave my hands something to do."
!fx love+1

## 2
"Did you get any sleep?"
"Some," Danny says. "Maybe two hours. Sitting up against her door." {He} rubs {his} neck. "My neck hurts."
-> 2.1: Offer to get {him} some tea
-> 2.2: Tell {him} to sleep early tonight

## 2.1
You go down to the kitchen and bring {him} a cup of tea, milky and sweet. Danny wraps both hands around it gratefully. "You're the best," {he} says, without thinking, and then goes slightly pink.
-> 2.1.1: Sit with {him} while {he} drinks it
-> 2.1.2: Leave {him} to rest

## 2.1.1
You sit together while {he} drinks it. Danny gets sleepier and sleepier, until {his} head is nodding over the mug. You take it from {him} gently before {he} spills it.
!fx love+2 stress-

## 2.1.2
You leave {him} to rest. When you glance back, {he}'s holding the tea under {his} chin, eyes closed, breathing in the steam.
!fx love+1

## 2.2
"Sleep early tonight," you say. Danny nods. "If nobody cries," {he} says. "If someone cries, I'll go again." {He} says it simply, like it isn't a choice.
-> 2.2.1: Offer to take a turn if it happens again
-> 2.2.2: Tell {him} {he} can't look after everyone

## 2.2.1
"Wake me if it happens again," you say. "I'll take a turn." Danny looks at you, surprised, then grateful. "Okay. We can take turns." {He} seems lighter.
!fx love+2

## 2.2.2
"You can't look after everyone," you say. Danny looks down. "I know," {he} says. "But I can look after one." {He} doesn't argue further.
!fx love+1

## 3
"Why didn't Bailey come?"
Danny's face closes off. "{bHe} doesn't. At night. {bHe} says the little ones need to <i>learn to settle</i>." {He} looks at the door. "Please don't say anything to {bhim}. It'll just make {bhim} angry."
-> 3.1: Promise you won't
-> 3.2: Tell {him} it isn't right

## 3.1
"I won't," you say. Danny relaxes a little. "Thanks. It's easier if we just... handle it ourselves."
-> 3.1.1: Say then we'll handle it together
-> 3.1.2: Let it go

## 3.1.1
"Then we'll handle it together," you say. Danny looks at you for a long moment, then nods. "Together," {he} repeats, like it's a word {he} doesn't get to use much.
!fx love+2

## 3.1.2
You let it go. Danny seems grateful, and turns another page of the picture book.

## 3.2
"That isn't right," you say.
"I know," Danny says quietly. "But it's how it is." {He} hugs {his} knees. "Saying it isn't right doesn't change it. It just makes you angry."
-> 3.2.1: Say being angry about it is okay
-> 3.2.2: Agree it's exhausting to be angry

## 3.2.1
"It's okay to be angry about it," you say. Danny thinks about that. "I'm not very good at being angry," {he} says. "I just get sad instead." {He} shrugs. "Maybe I'll practise."
!fx love+1

## 3.2.2
"Being angry is exhausting," you agree. Danny nods. "Exactly. I'd rather just read the badger book." {He} smiles faintly.
!fx stress-

## 4
"That was really kind of you," you say.
Danny shrugs, embarrassed. "Anyone would have."
-> 4.1: Point out that Bailey didn't
-> 4.2: Tell {him} not everyone would have

## 4.1
"Bailey didn't," you say.
Danny's mouth twitches. "Bailey isn't anyone. Bailey is Bailey." {He} almost laughs.
-> 4.1.1: Laugh with {him}
-> 4.1.2: Bring it back to {his} kindness

## 4.1.1
You both laugh, quietly, glancing at the door. It feels good, the shared joke.
!fx love+1 stress-

## 4.1.2
"Bailey aside, you did something good," you say. Danny ducks {his} head. "Okay. I did something good." {He} sounds like {he}'s trying the words out.
!fx love+1 acceptance+

## 4.2
"Not everyone would have," you say. "Most people would've stayed in bed."
Danny considers. "Maybe," {he} says. "But I couldn't. I could hear her." {He} looks at you. "Would you have gone?"
-> 4.2.1: Say yes
-> 4.2.2: Say honestly you're not sure

## 4.2.1
"Yes," you say. Danny smiles. "I knew you would." {He} seems to find this comforting.
!fx love+1

## 4.2.2
"I'm not sure," you admit. Danny nods. "That's honest. I like honest." {He} doesn't seem to think less of you.
!fx love+1

## 5
"Robin sometimes sits up with the little ones too," you say.
Danny's face brightens. "Robin's nice. Robin gave me a sweet once, on my first day. I still have the wrapper." {He} goes pink. "That's weird. Don't tell Robin."
-> 5.1: Promise not to tell
-> 5.2: Suggest the three of you could take turns at night

## 5.1
"Your wrapper secret is safe," you say. Danny laughs. "Thank you. It's a very important wrapper." {He} looks happier.
!fx love+1

## 5.2
"We could all take turns," you suggest. "You, me, Robin." Danny's eyes light up. "Like a rota. A night rota." {He} looks like {he}'s already drawing up a timetable in {his} head.
!fx love+2
`,
});

window.DannyTalkData.push({
	id: "family.camera",
	topic: "family",
	title: "Before the orphanage",
	src: `
## 0
Danny is cleaning {his} camera with a soft cloth, slowly, the way you'd polish something precious. It's old, older than {him}, the leather on the body cracked and soft with handling.
{He} notices you watching. "This was my gran's," {he} says. "Before. It's the only thing I brought with me."
-> 1: Ask about {his} gran
-> 2: Ask how old the camera is
-> 3: Ask if {he} remembers much from before
-> 4: Tell {him} it's beautiful
-> 5: Ask if {he}'d ever show you the photos she took ?? dannyLove() gte 60 or dannyTrust() gte 50

## 1
"Tell me about your gran?"
Danny's hands slow on the cloth. "She took pictures of everything. Birds. Bus stops. Me, mostly. Thousands of me." {He} smiles faintly. "I hated it. I used to hide behind the sofa. She'd just wait. She was really patient."
-> 1.1: Ask what she was like apart from the photos
-> 1.2: Say that's where {he} gets {his} patience from

## 1.1
"What was she like? Apart from the photos?"
Danny thinks. "She smelled like mints and darkroom chemicals. She sang really badly. She let me stay up late if it was raining, because she said rain was for talking." {He} turns the camera over. "She called me <i>little owl</i>. Because I was always awake."
-> 1.1.1: Tell {him} that's a lovely name
-> 1.1.2: Ask what they used to talk about

## 1.1.1
"Little owl," you repeat. "That's lovely."
Danny's ears go red. "Don't tell anyone." {He} looks at the camera. "Nobody's called me that since."
-> 1.1.1.1: Promise you won't
-> 1.1.1.2: Ask how long it's been

## 1.1.1.1
"I won't," you say. "It's yours."
Danny nods, grateful. {He} keeps polishing. "She taught me to load film," {he} says after a while. "In the dark. In a bag. By feel. She said a real photographer can do it with their eyes shut."
-> 1.1.1.1.1: Ask {him} to show you
-> 1.1.1.1.2: Say that sounds hard

## 1.1.1.1.1
"Show me?"
Danny hesitates, then gets a spare roll of film from the drawer. "Close your eyes too," {he} says. "It's better that way. You can hear it." {He} closes {his} own eyes. You hear the camera back click open, the soft scrape of the film leader, the tiny teeth catching. It takes {him} less than a minute.
"Done," {he} says, and opens {his} eyes. "She'd have been faster."
-> 1.1.1.1.1.1: Tell {him} {he}'s fast too
-> 1.1.1.1.1.2: Ask {him} to teach you

## 1.1.1.1.1.1
"You're fast," you say. "That was amazing."
Danny smiles down at the camera. "She'd say <i>not bad, little owl</i>." {He} goes quiet. "I miss her saying things."
-> 1.1.1.1.1.1.1: Ask what happened to her, if {he}'s okay talking about it
-> 1.1.1.1.1.1.2: Tell {him} it's okay to miss her

## 1.1.1.1.1.1.1
"What happened?" you ask carefully. "You don't have to say."
Danny is still for a long moment. "She got ill. When I was nine. It took a long time and then it didn't." {He} turns the camera over in {his} hands. "There wasn't anyone else. So they brought me here. With a bag and this."
{He} says it all very evenly, like something {he}'s practised so it doesn't hurt. It still sounds like it hurts.
-> 1.1.1.1.1.1.1.1: Say you're sorry
-> 1.1.1.1.1.1.1.2: Just stay quiet and sit with {him}

## 1.1.1.1.1.1.1.1
"I'm sorry," you say.
"Thanks." Danny wipes the lens one more time, even though it's spotless. "People always say that and then look away. Like it's catching." {He} glances at you. "You didn't look away."
-> 1.1.1.1.1.1.1.1.1: Tell {him} you're not going to
-> 1.1.1.1.1.1.1.1.2: Ask if {he} has any of her photos

## 1.1.1.1.1.1.1.1.1
"I'm not going to," you say.
Danny looks at you, and {his} face crumples for just a second before {he} gets it back. {He} laughs, a little wet. "Okay. Sorry. It's been a while since I talked about her." {He} sniffs. "It's nice, actually. Talking about her. She feels less far away."
-> 1.1.1.1.1.1.1.1.1.1: Tell {him} {he} can talk about her whenever {he} wants
-> 1.1.1.1.1.1.1.1.1.2: Ask {him} to tell you one more thing about her

## 1.1.1.1.1.1.1.1.1.1
"Talk about her whenever you want," you say. "I'd like to know her."
Danny holds the camera against {his} chest for a moment, both hands around it. "Okay," {he} says softly. "I'd like that." {He} lifts the camera, turns, and points it at the window, at the evening light coming through. Click. "That one's for her," {he} says. "She liked this time of day. She said it was the honest light."
{He} puts the camera down gently on the desk. "Thank you, for not looking away."
!fx love+3 stress- acceptance+

## 1.1.1.1.1.1.1.1.1.2
"Tell me one more thing about her?"
Danny smiles. "She cheated at cards. Every time. Really badly. She'd hide aces in her sleeve and they'd fall out when she reached for her tea." {He} laughs properly now. "And she'd say <i>well, would you look at that</i> like it was a miracle."
!fx love+2 stress-

## 1.1.1.1.1.1.1.1.2
"Do you have any of her photos?"
Danny nods, and pulls a battered envelope from under {his} mattress. Inside are a dozen prints, curling at the edges. A small, scowling child behind a sofa. The same child asleep on a bus. The child holding a camera far too big for {him}.
"That's me," Danny says. "All of them. She really did take thousands."
!fx love+2

## 1.1.1.1.1.1.1.2
You stay quiet. Danny keeps cleaning the camera, slower and slower, until {he}'s just holding it. After a while {he} leans {his} head against your shoulder, very briefly, and then straightens up again. "Thanks," {he} says. "For not saying anything."
!fx love+2 stress-

## 1.1.1.1.1.1.2
"It's okay to miss her," you say. Danny nods slowly. "I know," {he} says. "I just don't always know where to put it." {He} pats the camera. "Here, mostly."
!fx love+1

## 1.1.1.1.1.2
"Teach me?"
Danny brightens. {He} hands you the spare roll and puts {his} hands over yours, guiding. "Feel for the teeth. There. Now pull. Gently." It takes you three tries. Danny is patient with every one. "Not bad," {he} says at the end. "For a beginner owl."
!fx love+2

## 1.1.1.1.2
"That sounds hard," you say. "Not for her," Danny says. "She did it in her sleep. Probably literally." {He} smiles. "I'm still practising."
!fx love+1

## 1.1.1.2
"How long has it been?"
"Seven years," Danny says. "Almost." {He} keeps polishing. "Sometimes it feels like ages. Sometimes it feels like last week."
!fx love+1

## 1.1.2
"What did you talk about? In the rain?"
"Everything," Danny says. "What clouds were made of. Why the sky's blue. Whether owls get lonely." {He} smiles. "She always had an answer. Even when she made it up."
-> 1.1.2.1: Ask whether owls get lonely
-> 1.1.2.2: Say that sounds like a good gran

## 1.1.2.1
"Do owls get lonely?" Danny thinks. "She said no. She said owls just like the quiet, and that's different from lonely." {He} pauses. "I think about that a lot."
!fx love+1

## 1.1.2.2
"She sounds like a good gran," you say. Danny nods. "The best," {he} says simply.
!fx love+1

## 1.2
"That's where you get your patience from," you say.
Danny looks surprised, then pleased. "You think I'm patient?"
-> 1.2.1: Say you've seen {him} wait forty minutes for a ladybird
-> 1.2.2: Say {he}'s patient with people

## 1.2.1
"You waited forty minutes for a ladybird," you say. Danny laughs. "That's true. She'd be proud of the ladybird." {He} smiles at the camera.
!fx love+1

## 1.2.2
"You're patient with people," you say. "With me." Danny looks away, smiling. "That's because you're worth it."
!fx love+2

## 2
"How old is it?"
"Older than me," Danny says. "1970-something. She bought it second-hand. It's all mechanical. No batteries." {He} holds it up to {his} ear and clicks the shutter. "Listen. It sounds like a heartbeat."
-> 2.1: Listen to the shutter
-> 2.2: Ask if it ever breaks

## 2.1
You lean in. Danny clicks it again. It does sound like a heartbeat, a soft mechanical <i>tck</i>. "She used to say the camera was alive," {he} says. "I sort of believe her."
-> 2.1.1: Say you believe her too
-> 2.1.2: Ask if it has a name

## 2.1.1
"I believe her too," you say. Danny smiles. "Good. Then it's two against everyone." {He} clicks it once more, gently.
!fx love+1

## 2.1.2
"Does it have a name?" Danny looks embarrassed. "Margaret," {he} admits. "After her." {He} pats it.
!fx love+2

## 2.2
"Does it ever break?"
"Once," Danny says. "The shutter stuck. I thought I'd lost it. Niki fixed it for free." {He} looks fond. "That's when I asked for a job."
-> 2.2.1: Say that was brave
-> 2.2.2: Say Niki seems to like {him}

## 2.2.1
"That was brave," you say. Danny shrugs. "I was desperate. Brave and desperate look the same from outside."
!fx love+1

## 2.2.2
"Niki likes you," you say. Danny goes pink. "Niki tolerates me," {he} says. But {he}'s smiling.
!fx love+1

## 3
"Do you remember much from before?"
Danny looks at the camera. "Bits. Her kitchen. A garden with a broken swing. The smell of the darkroom in her cupboard under the stairs." {He} shrugs. "It gets fuzzier every year. That's why I take so many pictures now. So I don't forget anything else."
-> 3.1: Tell {him} that makes a lot of sense
-> 3.2: Ask what {he}'s most scared of forgetting

## 3.1
"That makes sense," you say. "Photos as remembering."
Danny nods. "Every photo is like saying <i>this happened, I was here</i>." {He} looks at you. "Sometimes I take pictures of really boring things. Just so I have proof of normal days."
-> 3.1.1: Say normal days are worth keeping
-> 3.1.2: Ask if {he}'s taken any of this room

## 3.1.1
"Normal days are worth keeping," you say. Danny smiles. "That's what she used to say."
!fx love+2

## 3.1.2
"Any of this room?" Danny laughs. "Hundreds. It's very boring. I'll show you sometime." {He} sounds like {he} means it.
!fx love+1

## 3.2
"What are you most scared of forgetting?"
Danny is quiet. "Her voice," {he} says finally. "I can still hear it. But it's getting quieter."
-> 3.2.1: Ask {him} to describe it
-> 3.2.2: Just nod, and let it be

## 3.2.1
"What did she sound like?"
Danny closes {his} eyes. "Low. Crackly. Like an old radio. She laughed at the end of sentences even when they weren't funny." {He} opens {his} eyes. "There. Now you know too. So it's in two places."
!fx love+2

## 3.2.2
You nod. Danny seems grateful you didn't try to fix it. {He} goes back to polishing the camera, slowly.
!fx love+1

## 4
"It's beautiful," you say.
Danny looks up, surprised and pleased. "Most people say it's old."
-> 4.1: Say it's both
-> 4.2: Ask if you can hold it

## 4.1
"It's both," you say. Danny smiles. "Old and beautiful. Like her." {He} says it quietly, and then doesn't explain.
-> 4.1.1: Ask who <i>her</i> is
-> 4.1.2: Leave it

## 4.1.1
"Who?" Danny tells you about {his} gran, briefly, haltingly. When {he}'s done {he} looks lighter, as if {he}'d set something down.
!fx love+2

## 4.1.2
You leave it. Danny goes back to polishing, humming something under {his} breath that sounds like an old song.

## 4.2
"Can I hold it?"
Danny hesitates for only a second before placing it in your hands, very carefully. "Strap round your wrist," {he} says. "Always."
-> 4.2.1: Hold it carefully and hand it back
-> 4.2.2: Look through the viewfinder at Danny

## 4.2.1
You hold it like it's made of glass, then hand it back. Danny looks relieved and touched in equal measure. "You held it right," {he} says. "Not everyone does."
!fx love+2

## 5
"Would you ever show me her photos?" you ask. "Only if you want."
Danny's hands go still on the camera. For a moment you think you've overstepped. Then {he} reaches under {his} mattress and pulls out a soft, worn envelope, and holds it in both hands without opening it. "I've never shown anyone," {he} says. "Not even Niki."
-> 5.1: Tell {him} you'll wait until {he}'s ready
-> 5.2: Sit beside {him} while {he} decides

## 5.1
"I can wait," you say. "Today, or another day, or never."
Danny looks at you for a long moment, then opens the envelope and slides out a single print: a small, scowling child behind a sofa, one eye peeking out. "That's me," {he} says. "She waited forty minutes for that." {He} puts it back carefully. "The rest another day. But... thank you for waiting."
!fx love+2 acceptance+

## 5.2
You sit beside {him} and say nothing. After a while Danny opens the envelope and shows you the prints one by one, telling you where each was taken. By the last one {his} voice is steady and {he}'s smiling. "She'd have liked you," {he} says. "You're patient. Like her."
!fx love+3

## 4.2.2
You lift it and look through the viewfinder. Danny is framed in it, looking startled. {He} laughs and covers {his} face. "Don't! I'm the one who takes pictures!" You hand it back, smiling.
!fx love+1 stress-
`,
});

window.DannyTalkData.push({
	id: "family.someday",
	topic: "family",
	title: "Someday flat",
	src: `
## 0
Danny is lying on {his} bed with a property section from an old newspaper held above {his} face. {He}'s circled things in pencil. Tiny flats, mostly, with words like <i>cosy</i> and <i>compact</i> and <i>would suit student</i>.
"I'm not looking to move," {he} says quickly, when {he} sees you. "I'm just... looking. For someday."
-> 1: Lie down next to the paper and look with {him}
-> 2: Ask what {his} dream place would be like
-> 3: Ask how far off someday is
-> 4: Say you'd rather not think about leaving
-> 5: Offer some tips on keeping a place nice ?? $housekeeping gte 300

## 1
You sit on the edge of the bed and lean over the newspaper. Danny tilts it so you can both see.
"This one," {he} says, tapping a circle. "Above a bakery. One room and a kitchen the size of a cupboard. But it says <i>north-facing window</i>." {He} sounds reverent. "North light is the best light for photos. It's soft all day."
-> 1.1: Say it sounds perfect for {him}
-> 1.2: Point out living above a bakery means smelling bread all day

## 1.1
"Sounds perfect for you," you say.
Danny smiles at the little advert. "I'd put my desk under the window. And a corkboard for prints. And I'd make the bathroom a darkroom. You just need a red bulb and to block the door with a towel."
-> 1.1.1: Ask what else would be in it
-> 1.1.2: Ask where {he}'d have a shower if the bathroom's a darkroom

## 1.1.1
"What else?"
Danny thinks, eyes on the ceiling. "A plant. Something that won't die. And a real kettle, not the one in the kitchen here that trips the fuse." {He} smiles. "And a lock. With one key. That's mine."
-> 1.1.1.1: Tell {him} that sounds like a home
-> 1.1.1.2: Suggest a plant that's hard to kill ?? $tending gte 200
-> 1.1.1.3: Ask what kind of plant

## 1.1.1.1
"That sounds like a home," you say.
Danny's smile goes a bit wobbly. "Yeah," {he} says. "That's the word, isn't it." {He} looks at the paper. "I've never really had one. Not since Gran. This is just... a room I'm allowed to be in."
-> 1.1.1.1.1: Ask what makes a place a home, for {him}
-> 1.1.1.1.2: Tell {him} {he}'ll get one

## 1.1.1.1.1
"What makes somewhere a home?" you ask.
Danny lowers the newspaper onto {his} chest and thinks about it properly. "Knowing nobody's going to come in without knocking. Being able to leave your things out and they'll still be there. Having a kettle you trust." {He} turns {his} head to look at you. "Somebody visiting. Because they want to. Not because they have to."
<<if dannyLove() gte 40>>{His} eyes rest on you for a moment after {he} says it.<</if>>
-> 1.1.1.1.1.1: Promise to visit, when {he} has a place
-> 1.1.1.1.1.2: Point out you visit now because you want to

## 1.1.1.1.1.1
"When you've got your flat," you say, "I'll visit. Because I want to."
Danny lets out a little laugh, half disbelieving. "You'd come all the way above a bakery?"
"Especially above a bakery."
{He} grins. "Okay. Then I'll get two mugs. Not one." {He} picks up the pencil and writes <i>2 MUGS</i> in the margin of the newspaper.
-> 1.1.1.1.1.1.1: Ask what you'd do when you visited
-> 1.1.1.1.1.1.2: Insist on a third mug for Niki

## 1.1.1.1.1.1.1
"What would we do?"
Danny thinks about it, clearly delighted to be asked. "Tea. Obviously. Then I'd show you my prints. Then we'd eat bread from downstairs, still warm." {He} pauses. "And then maybe just sit. With the window open. And not have to be quiet because of Bailey."
-> 1.1.1.1.1.1.1.1: Say that sounds like a perfect afternoon
-> 1.1.1.1.1.1.1.2: Ask if you're allowed to be loud

## 1.1.1.1.1.1.1.1
"That sounds perfect," you say.
"It does, doesn't it." Danny stares up at the ceiling, smiling. "I've never planned anything nice before. Only how to avoid things." {He} turns the pencil over in {his} fingers. "It feels weird. Like wearing someone else's shoes."
<<if $stress gte 5000>>You know that feeling. Hope is strange when you're used to bracing.<</if>>
-> 1.1.1.1.1.1.1.1.1: Tell {him} {he}'s allowed to plan nice things
-> 1.1.1.1.1.1.1.1.2: Tell {him} the shoes will fit eventually

## 1.1.1.1.1.1.1.1.1
"You're allowed to plan nice things," you say. "You don't have to earn them first."
Danny looks at you sideways. "Bailey would say I do."
"Bailey's wrong."
{He} laughs, surprised and a bit breathless. "You keep saying that."
"Because {bhe} keeps being wrong."
-> 1.1.1.1.1.1.1.1.1.1: Help {him} plan the flat properly
-> 1.1.1.1.1.1.1.1.1.2: Tell {him} to keep the newspaper somewhere safe

## 1.1.1.1.1.1.1.1.1.1
You spend the next half hour planning the flat in detail. Where the bed goes, where the darkroom towel hangs, which wall gets the prints. Danny draws it on the back of the newspaper, a careful little floor plan with a window and two mugs and a kettle drawn so large it takes up half the kitchen.
"Priorities," {he} says, when you point at the kettle.
When you're done {he} folds it up small and tucks it into the back of {his} gran's camera case. "So I don't lose it," {he} says. Then, quieter: "Thanks. For making it feel real."
!fx love+3 stress- acceptance+

## 1.1.1.1.1.1.1.1.1.2
"Keep the newspaper somewhere safe," you say. "So you remember."
Danny nods, and slides it carefully between the pages of {his} beetle book. "Next to Sir Reginald," {he} says. "He'll guard it."
!fx love+2

## 1.1.1.1.1.1.1.1.2
"The shoes will fit eventually," you say. "You just have to walk around in them."
Danny considers. "Walk around in hope," {he} says slowly. "That's a weird sentence." But {he} smiles.
!fx love+1 acceptance+

## 1.1.1.1.1.1.1.2
"Am I allowed to be loud?"
"<i>So</i> loud," Danny says. "As loud as you want. We'll sing. Badly." {He} laughs. "Like my gran."
!fx love+2

## 1.1.1.1.1.1.2
"And one for Niki," you say. "{nHe}'ll want to inspect your darkroom."
Danny groans. "{nHe} absolutely will. {nHe}'ll say the towel's in the wrong place." {He} writes <i>3 MUGS</i>, then crosses out the 2.
!fx love+1

## 1.1.1.1.1.2
"I visit now because I want to," you point out.
Danny goes still. Then, very quietly: "Yeah. You do." {He} looks at the ceiling for a while. "So this room is a little bit a home. Sometimes."
!fx love+2 acceptance+

## 1.1.1.1.2
"You'll get one," you say.
Danny looks at you. "You sound very sure."
"I am."
{He} smiles slowly. "Okay. Then I'll be sure too."
!fx love+1

## 1.1.1.3
"What kind of plant?"
Danny thinks hard. "One with big leaves. So it looks good in photos." {He} pauses. "And one that forgives you if you forget to water it for a week." {He} writes FORGIVING PLANT on the margin, and laughs at {himself}.
!fx love+1

## 1.1.1.2
"Get a spider plant," you say. "They're impossible to kill. And they make babies you can give away."
Danny's eyes light up. "Plant babies? I could give them to the little ones. They could each have one." {He} writes SPIDER PLANT on the newspaper and underlines it.
!fx love+2

## 1.1.2
"Where would you shower?"
Danny opens {his} mouth, then closes it. "...I hadn't thought of that." {He} frowns. "The darkroom would have to be a part-time darkroom." {He} laughs at {himself}. "Photography is very inconvenient."
!fx love+1

## 1.2
"You'd smell bread all day," you say. "You'd never stop being hungry."
Danny's eyes go wide with longing. "That's not a downside," {he} says. "That's the <i>reason</i>."
-> 1.2.1: Agree it's a selling point
-> 1.2.2: Ask what {his} dream place would really be like

## 1.2.1
"Fair point," you say. Danny circles the bakery flat twice more. "Decision made. Bread flat."
!fx love+1

## 1.2.2
"Bread flat aside," you say, "what's the actual dream?"
Danny thinks. "Big windows. Near the sea. An old cat nobody else wanted." {He} smiles at the ceiling. "Bread flat first, though. Dream later."
!fx love+1

## 2
"What would your dream place be?"
Danny sets the newspaper down. "Not big. Just... light. Big windows. Quiet. Near the sea, maybe, so I could go at sunrise without a bus." {He} looks at the ceiling. "And a cat. An old one, that nobody else wanted."
-> 2.1: Ask why an old cat
-> 2.2: Say it sounds peaceful

## 2.1
"Why an old one?"
"Because everyone wants kittens," Danny says. "The old ones sit in the shelter forever. They just want somewhere warm." {He} pauses. "I know what that's like." {He} says it lightly, but it isn't light.
-> 2.1.1: Tell {him} {he}'ll give some old cat a very good home
-> 2.1.2: Ask what {he}'d name it

## 2.1.1
"Some old cat is going to be very lucky," you say. Danny smiles. "Really lucky. I'll buy the expensive food." {He} sounds determined.
!fx love+2

## 2.1.2
"Name?" "Biscuit," Danny says immediately. "Old cats should be called something comforting." {He} grins.
!fx love+1

## 2.2
"It sounds peaceful," you say. Danny nods. "Peaceful is all I want. Nobody shouting. Nobody slamming doors." {He} glances at the door of {his} room. "Just quiet."
-> 2.2.1: Say {he} deserves that
-> 2.2.2: Tease that {he}'d get bored

## 2.2.1
"You deserve quiet," you say. Danny looks at you, then away. "Thanks," {he} says softly.
!fx love+1 acceptance+

## 2.2.2
"You'd get bored," you tease. Danny laughs. "Never. I'd have the cat. And the sea. And you'd visit." {He} catches {himself}, pink. "If you wanted."
!fx love+1

## 3
"How far off is someday?"
Danny counts on {his} fingers. "Two years till I age out. Then I need a deposit. And a job that pays more than Niki can." {He} sighs. "So... a long time."
-> 3.1: Say two years isn't that long
-> 3.2: Ask if {he}'s scared of aging out

## 3.1
"Two years isn't that long," you say. "It'll go fast."
Danny tilts {his} head. "It doesn't feel fast. It feels like forever." {He} folds the paper. "But you're probably right. Last year went fast."
-> 3.1.1: Suggest {he} saves a little each week
-> 3.1.2: Say you'll both be out of here eventually

## 3.1.1
"A little each week adds up," you say. Danny nods. "I've got a jar. It has eleven pounds in it." {He} laughs. "Only a few thousand to go."
!fx love+1

## 3.1.2
"We'll both be out of here eventually," you say. Danny looks at you. "Both," {he} repeats. {He} seems to like the sound of that.
!fx love+1

## 3.2
"Are you scared? Of aging out?"
Danny is quiet for a bit. "Yes," {he} admits. "Of being on my own. Of something going wrong and nobody being there." {He} fiddles with the newspaper. "But also excited. Is that weird?"
-> 3.2.1: Say both feelings make sense
-> 3.2.2: Tell {him} {he} won't be completely on {his} own

## 3.2.1
"Both make sense," you say. Danny nods slowly. "Scared-excited. Like before a sunrise shoot." {He} smiles.
!fx love+1 stress-

## 3.2.2
"You won't be completely on your own," you say. Danny looks at you. "No?" "No." {He} doesn't say anything else, but {he} looks a little less scared.
!fx love+2

## 4
"I'd rather not think about leaving," you say.
Danny lowers the paper. "Oh. Sorry." {He} folds it up. "I didn't mean to make it weird."
-> 4.1: Say it's not weird, just a lot
-> 4.2: Ask {him} to tell you about the flats anyway

## 4.1
"It's not weird," you say. "It's just a lot."
Danny nods. "It is a lot." {He} tucks the paper under {his} pillow. "We can think about now instead."
-> 4.1.1: Agree
-> 4.1.2: Ask what's good about now

## 4.1.1
"Now is good," you say. Danny smiles. "Now is okay." {He} lies back. It's a comfortable quiet.
!fx stress-

## 4.1.2
"What's good about now?" Danny thinks. "Niki. The darkroom. The beach." {He} glances at you. "This." {He} goes pink.
!fx love+1

## 4.2
"Tell me about the flats anyway," you say. Danny hesitates, then unfolds the paper. "Okay. But only the nice ones."
-> 4.2.1: Listen to {him} describe them
-> 4.2.2: Pick your favourite

## 4.2.1
{He} reads them out in a ridiculous estate agent voice. "<i>Bijou. Characterful. Would suit a person who does not need to turn around.</i>" You're both laughing by the end.
!fx love+1 stress-

## 4.2.2
You pick the bakery one. Danny gasps. "That's my favourite too!" {He} looks delighted.
!fx love+1

## 5
"Want some tips on keeping a place nice?" you offer. "I've had a lot of practice."
Danny props {himself} up on {his} elbows, interested. "Yes. I'm terrible. My socks end up everywhere."
-> 5.1: Teach {him} the one-minute rule
-> 5.2: Tell {him} to start with one tidy corner

## 5.1
"If it takes less than a minute, do it now," you say. Danny repeats it under {his} breath, then gets up and puts three socks in the laundry basket. "That's three minutes," {he} says proudly. "I did three."
!fx love+1 control+

## 5.2
"Start with one tidy corner," you say. "Just one." Danny looks at {his} desk, which is a mess of film canisters. "I'll start there." {He} makes a small, determined start, and it looks better already.
!fx love+1
`,
});
