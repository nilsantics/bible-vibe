-- OT→NT Connections table
-- Tracks Quote, Allusion, and Echo relationships between Old and New Testament verses.
-- Direction: always OT verse → NT verse.
-- Lookups work both ways: from an OT verse (find NT fulfillments) and from an NT verse (find OT sources).

CREATE TABLE IF NOT EXISTS ot_nt_connections (
  id          SERIAL PRIMARY KEY,
  ot_book_id  INT  NOT NULL,
  ot_chapter  INT  NOT NULL,
  ot_verse    INT  NOT NULL,
  nt_book_id  INT  NOT NULL,
  nt_chapter  INT  NOT NULL,
  nt_verse    INT  NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('quote', 'allusion', 'echo')),
  note        TEXT
);

CREATE INDEX IF NOT EXISTS ot_nt_connections_ot_idx ON ot_nt_connections (ot_book_id, ot_chapter, ot_verse);
CREATE INDEX IF NOT EXISTS ot_nt_connections_nt_idx ON ot_nt_connections (nt_book_id, nt_chapter, nt_verse);

ALTER TABLE ot_nt_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ot_nt_connections" ON ot_nt_connections FOR SELECT USING (true);

-- ─── Seed Data ───────────────────────────────────────────────────────────────
-- Format: (ot_book_id, ot_ch, ot_v, nt_book_id, nt_ch, nt_v, type, note)
-- Book IDs: Gen=1 Exod=2 Lev=3 Num=4 Deut=5 Josh=6 Judg=7 Ruth=8
--           1Sam=9 2Sam=10 1Kgs=11 2Kgs=12 1Chr=13 2Chr=14 Ezra=15 Neh=16
--           Esth=17 Job=18 Ps=19 Prov=20 Eccl=21 Song=22 Isa=23 Jer=24
--           Lam=25 Ezek=26 Dan=27 Hos=28 Joel=29 Amos=30 Obad=31 Jonah=32
--           Mic=33 Nah=34 Hab=35 Zeph=36 Hag=37 Zech=38 Mal=39
--           Matt=40 Mark=41 Luke=42 John=43 Acts=44 Rom=45 1Cor=46 2Cor=47
--           Gal=48 Eph=49 Phil=50 Col=51 1Th=52 2Th=53 1Tim=54 2Tim=55
--           Tit=56 Phlm=57 Heb=58 Jas=59 1Pet=60 2Pet=61 1Jn=62 2Jn=63
--           3Jn=64 Jude=65 Rev=66

INSERT INTO ot_nt_connections
  (ot_book_id, ot_chapter, ot_verse, nt_book_id, nt_chapter, nt_verse, type, note)
VALUES
-- ── Genesis ──────────────────────────────────────────────────────────────────
(1,  1,  1,  43,  1,  1,  'echo',    'Both open "In the beginning" — John echoes Genesis 1 to present Jesus as the eternal Word present at creation'),
(1,  1, 27,  40, 19,  4,  'quote',   '"Male and female he created them" — Jesus quotes Genesis 1:27 in his teaching on the indissolubility of marriage'),
(1,  2, 24,  40, 19,  5,  'quote',   '"A man shall leave his father and mother" — Jesus quotes this foundation of marriage against divorce'),
(1,  3, 15,  66, 12, 17,  'echo',    'The enmity between the serpent and the woman''s seed — fulfilled in Revelation''s cosmic war against Christ''s followers'),
(1, 12,  3,  48,  3,  8,  'quote',   '"All nations will be blessed through you" — Paul calls this the gospel proclaimed beforehand to Abraham'),
(1, 15,  6,  45,  4,  3,  'quote',   '"Abraham believed God and it was credited to him as righteousness" — Paul''s cornerstone text on justification by faith'),
(1, 22,  2,  58, 11, 17,  'allusion','The binding of Isaac on Moriah — typology of the Father offering his only Son as an atoning sacrifice'),
(1, 22, 18,  48,  3, 16,  'quote',   '"Through your offspring" — Paul notes the singular "seed," pointing the promise to Christ alone'),
(1, 33,  6,  43,  1,  3,  'echo',    '"By the word of the Lord the heavens were made" — echoed in John 1 where the Logos is the agent of all creation'),
(1, 49, 10,  66,  5,  5,  'echo',    '"The scepter will not depart from Judah" — fulfilled in the Lion of the tribe of Judah in Revelation 5'),
-- ── Exodus ───────────────────────────────────────────────────────────────────
(2,  3,  6,  40, 22, 32,  'quote',   '"I am the God of Abraham, Isaac, and Jacob" — Jesus cites this to silence the Sadducees and prove the resurrection'),
(2,  4, 22,  40,  2, 15,  'quote',   '"Out of Egypt I called my son" — Matthew sees Israel''s exodus fulfilled typologically in Jesus''s return from Egypt'),
(2, 12, 46,  43, 19, 36,  'quote',   'No bone of the Passover lamb to be broken — John explicitly cites this as fulfilled when soldiers skip breaking Jesus''s legs'),
(2, 16,  4,  43,  6, 31,  'allusion','The manna from heaven in the wilderness — Jesus identifies himself as the true bread that came down from heaven'),
(2, 19,  6,  60,  2,  9,  'quote',   '"A royal priesthood, a holy nation" — Peter applies this Sinai covenant identity directly to the church'),
(2, 19,  6,  66,  1,  6,  'allusion','"A kingdom of priests" — Revelation applies this Exodus 19 identity to all who are in Christ'),
(2, 20, 12,  40, 15,  4,  'quote',   '"Honor your father and mother" — Jesus quotes this commandment when rebuking the Corban tradition'),
(2, 24,  8,  40, 26, 28,  'allusion','"The blood of the covenant" — Jesus at the Last Supper: "this is my blood of the covenant, poured out for many"'),
(2, 34,  6,  43,  1, 14,  'echo',    'The LORD''s self-description "abounding in love and faithfulness" — echoed in John''s "full of grace and truth"'),
-- ── Leviticus ────────────────────────────────────────────────────────────────
(3, 18,  5,  45, 10,  5,  'quote',   '"The person who does these things will live by them" — Paul cites in Romans 10 when contrasting law-righteousness with faith'),
(3, 18,  5,  48,  3, 12,  'quote',   '"The one who does these things will live by them" — Paul contrasts the law principle with faith-righteousness in Galatians'),
(3, 19, 18,  40, 22, 39,  'quote',   '"Love your neighbor as yourself" — Jesus calls this the second great commandment, summing up the whole law'),
-- ── Numbers ──────────────────────────────────────────────────────────────────
(4, 21,  9,  43,  3, 14,  'allusion','The bronze serpent lifted on a pole in the wilderness — Jesus says "so must the Son of Man be lifted up" for salvation'),
-- ── Deuteronomy ──────────────────────────────────────────────────────────────
(5,  6,  5,  40, 22, 37,  'quote',   '"Love the LORD your God with all your heart" — Jesus calls this the greatest commandment'),
(5,  6, 13,  40,  4, 10,  'quote',   '"Worship the LORD your God and serve him only" — Jesus''s response to Satan''s third temptation'),
(5,  6, 16,  40,  4,  7,  'quote',   '"Do not put the LORD your God to the test" — Jesus''s response to Satan''s second temptation'),
(5,  8,  3,  40,  4,  4,  'quote',   '"Man does not live on bread alone but on every word that comes from God" — Jesus''s first temptation response'),
(5, 18, 15,  44,  3, 22,  'quote',   '"God will raise up for you a prophet like me from among your own people" — Peter applies this to the risen Jesus'),
(5, 19, 15,  40, 18, 16,  'quote',   '"Every matter must be established by the testimony of two or three witnesses" — Jesus cites in church discipline'),
(5, 21, 23,  48,  3, 13,  'quote',   '"Cursed is everyone who is hung on a pole" — Paul applies to Christ''s death, which absorbed the law''s curse'),
(5, 27, 26,  48,  3, 10,  'quote',   '"Cursed is everyone who does not continue to do everything written in the Book of the Law" — Paul in Galatians'),
(5, 30, 12,  45, 10,  6,  'quote',   '"Who will ascend into heaven?" and "Who will descend into the deep?" — Paul applies to show faith-righteousness needs no works'),
-- ── 2 Samuel ─────────────────────────────────────────────────────────────────
(10,  7, 14,  58,  1,  5,  'quote',   '"I will be his father, and he will be my son" — Hebrews applies the Davidic covenant to Christ''s eternal sonship'),
(10,  7, 14,  47,  6, 18,  'quote',   '"I will be a Father to you, and you will be my sons and daughters" — Paul cites the covenant language for the church'),
-- ── Job ──────────────────────────────────────────────────────────────────────
(18,  5, 13,  46,  3, 19,  'quote',   '"He catches the wise in their craftiness" — Paul cites in 1 Corinthians 3 against relying on human wisdom'),
-- ── Psalms ───────────────────────────────────────────────────────────────────
(19,  2,  1,  44,  4, 25,  'quote',   '"Why do the nations rage?" — the early church prays this Psalm after Peter and John''s release from custody'),
(19,  2,  7,  44, 13, 33,  'quote',   '"You are my Son; today I have become your Father" — Paul at Antioch applies this to the resurrection of Jesus'),
(19,  2,  7,  58,  1,  5,  'quote',   '"You are my Son" — Hebrews opens its chain of OT proof texts to establish the Son''s superiority over angels'),
(19,  2,  9,  66,  2, 27,  'quote',   '"You will rule them with an iron scepter" — Revelation applies to the victorious Christ and the overcoming church'),
(19,  4,  4,  49,  4, 26,  'quote',   '"In your anger do not sin" — Paul quotes in his instructions to the Ephesians on righteous anger'),
(19,  8,  2,  40, 21, 16,  'quote',   '"From the lips of children and infants you have ordained praise" — Jesus quotes when children praise him in the temple'),
(19,  8,  4,  58,  2,  6,  'quote',   '"What is man that you are mindful of him, the son of man that you care for him?" — Hebrews applies to Jesus as the true Son of Man'),
(19, 16,  8,  44,  2, 25,  'quote',   '"I have set the LORD always before me" — Peter cites Psalm 16 at Pentecost to prove that David foresaw the resurrection'),
(19, 18, 49,  45, 15,  9,  'quote',   '"Therefore I will praise you among the Gentiles" — Paul''s first link in his chain of OT texts affirming Gentile inclusion'),
(19, 19,  4,  45, 10, 18,  'quote',   '"Their voice has gone out into all the earth" — Paul applies to the universal proclamation of the gospel'),
(19, 22,  1,  40, 27, 46,  'quote',   '"My God, my God, why have you forsaken me?" — Jesus cries from the cross, invoking Psalm 22 over his passion'),
(19, 22,  7,  40, 27, 39,  'allusion','The mockers shaking their heads and hurling insults — fulfilled at Golgotha as crowds taunt the crucified Jesus'),
(19, 22, 16,  43, 20, 25,  'echo',    '"They pierce my hands and my feet" — Thomas''s demand to see the nail marks in Jesus''s hands and feet'),
(19, 22, 18,  43, 19, 24,  'quote',   '"They divide my clothes among them and cast lots for my garment" — John explicitly cites this at the crucifixion'),
(19, 24,  1,  46, 10, 26,  'quote',   '"The earth is the LORD''s, and everything in it" — Paul applies to the question of food offered to idols'),
(19, 31,  5,  42, 23, 46,  'quote',   '"Into your hands I commit my spirit" — Jesus''s very last words in Luke''s Gospel, drawn directly from Psalm 31'),
(19, 32,  1,  45,  4,  7,  'quote',   '"Blessed is the one whose transgressions are forgiven" — Paul''s proof that righteousness apart from works is ancient'),
(19, 34, 20,  43, 19, 36,  'quote',   '"He protects all his bones; not one of them will be broken" — John cites at the crucifixion as fulfilled prophecy'),
(19, 35, 19,  43, 15, 25,  'quote',   '"Those who hate me without reason" — Jesus says the hatred of the world fulfills this Psalm'),
(19, 40,  6,  58, 10,  5,  'quote',   '"Sacrifice and offering you did not desire" — Hebrews places this on Christ''s lips as he enters the world to do God''s will'),
(19, 41,  9,  43, 13, 18,  'quote',   '"He who shares my bread has turned against me" — Jesus applies to Judas''s betrayal, fulfilling Scripture'),
(19, 44, 22,  45,  8, 36,  'quote',   '"For your sake we face death all day long" — Paul quotes in his climax "nothing can separate us from God''s love"'),
(19, 45,  6,  58,  1,  8,  'quote',   '"Your throne, O God, will last forever and ever" — Hebrews applies directly to the Son, affirming his full deity'),
(19, 51,  4,  45,  3,  4,  'quote',   '"So that you may be proved right when you speak" — Paul''s catena on universal sin in Romans 3'),
(19, 62, 12,  45,  2,  6,  'quote',   '"You reward each person according to what they have done" — God''s impartial judgment in Paul''s argument'),
(19, 68, 18,  49,  4,  8,  'quote',   '"When he ascended on high, he took many captives and gave gifts to his people" — Paul applies to Christ''s ascension'),
(19, 69,  4,  43, 15, 25,  'quote',   '"Those who hate me without reason outnumber the hairs of my head" — Jesus applies to his own rejection'),
(19, 69,  9,  43,  2, 17,  'quote',   '"Zeal for your house will consume me" — disciples recall this Psalm when Jesus cleanses the temple'),
(19, 69, 21,  43, 19, 29,  'allusion','The vinegar offered to the sufferer — soldiers offer Jesus wine vinegar on the cross, fulfilling this imagery'),
(19, 78,  2,  40, 13, 35,  'quote',   '"I will open my mouth in parables" — Matthew cites this as fulfilled by Jesus''s parabolic teaching ministry'),
(19, 82,  6,  43, 10, 34,  'quote',   '"You are gods" — Jesus quotes Psalm 82 to show that his claim to be the Son of God is no blasphemy'),
(19, 91, 11,  40,  4,  6,  'quote',   '"He will command his angels concerning you" — Satan misuses this Psalm to tempt Jesus to test God''s protection'),
(19, 94, 11,  46,  3, 20,  'quote',   '"The LORD knows that the thoughts of the wise are futile" — Paul cites in his warning against human boasting'),
(19, 95,  7,  58,  3,  7,  'quote',   '"Today, if you hear his voice, do not harden your hearts" — Hebrews'' urgent and repeated warning against unbelief'),
(19, 97,  7,  58,  1,  6,  'quote',   '"Let all God''s angels worship him" — Hebrews applies to the Son at his entry into the world'),
(19,102, 25,  58,  1, 10,  'quote',   '"In the beginning, Lord, you laid the foundations of the earth" — Hebrews applies to the Son as creator'),
(19,104,  4,  58,  1,  7,  'quote',   '"He makes his angels winds, his servants flames of fire" — Hebrews uses to contrast angels (servants) with the Son (heir)'),
(19,110,  1,  40, 22, 44,  'quote',   '"The LORD said to my Lord: Sit at my right hand" — Jesus poses this riddle to silence Pharisees about the Messiah''s identity'),
(19,110,  1,  44,  2, 34,  'quote',   '"Sit at my right hand until I make your enemies a footstool" — Peter''s climactic proof text at Pentecost for Jesus as Lord'),
(19,110,  4,  58,  5,  6,  'quote',   '"You are a priest forever, in the order of Melchizedek" — Hebrews'' central argument for Christ''s eternal high priesthood'),
(19,112,  9,  47,  9,  9,  'quote',   '"He has scattered abroad his gifts to the poor" — Paul quotes in his appeal for generous financial giving'),
(19,116, 10,  47,  4, 13,  'quote',   '"I believed; therefore I have spoken" — Paul applies the Psalmist''s faith-and-proclamation pattern to his own ministry'),
(19,117,  1,  45, 15, 11,  'quote',   '"Praise the LORD, all you Gentiles" — Paul''s final link in his chain of OT texts affirming Gentile inclusion in God''s people'),
(19,118,  6,  58, 13,  6,  'quote',   '"The LORD is my helper; I will not be afraid" — quoted in Hebrews alongside contentment and freedom from love of money'),
(19,118, 22,  40, 21, 42,  'quote',   '"The stone the builders rejected has become the cornerstone" — Jesus applies to himself after the parable of the tenants'),
(19,118, 22,  60,  2,  7,  'quote',   'The rejected-but-exalted stone — Peter applies to Jesus as the living cornerstone of the new temple'),
(19,118, 26,  40, 21,  9,  'quote',   '"Blessed is he who comes in the name of the LORD" — the Palm Sunday crowd quotes this Psalm as Jesus enters Jerusalem'),
(19,132, 11,  44,  2, 30,  'allusion','God''s oath to David that his descendant would sit on his throne — Peter cites at Pentecost for Jesus''s resurrection and exaltation'),
-- ── Proverbs ─────────────────────────────────────────────────────────────────
(20,  3, 11,  58, 12,  5,  'quote',   '"The Lord disciplines the one he loves" — Hebrews quotes in its call to endure suffering as fatherly discipline'),
(20,  3, 34,  59,  4,  6,  'quote',   '"God opposes the proud but shows favor to the humble" — James quotes verbatim in his call to submit to God'),
(20,  3, 34,  60,  5,  5,  'quote',   '"God opposes the proud but gives grace to the humble" — Peter quotes in calling the church to mutual humility'),
(20, 25, 21,  45, 12, 20,  'quote',   '"Heap burning coals on his head" — Paul quotes in urging the Romans to respond to enemies with kindness'),
-- ── Isaiah ───────────────────────────────────────────────────────────────────
(23,  5,  1,  40, 21, 33,  'allusion','Isaiah''s vineyard song of ungrateful tenants — Jesus echoes it closely in the parable of the wicked tenants'),
(23,  6,  1,  43, 12, 41,  'allusion','"In the year that King Uzziah died I saw the Lord" — John says Isaiah saw Jesus''s glory when he had this vision'),
(23,  6,  9,  40, 13, 14,  'quote',   '"Be ever hearing but never understanding" — Jesus quotes to explain why he speaks in parables to hardened hearts'),
(23,  7, 14,  40,  1, 23,  'quote',   '"The virgin will conceive and give birth to a son, and they will call him Immanuel" — Matthew''s birth narrative citation'),
(23,  8, 14,  45,  9, 33,  'quote',   '"A stone that causes people to stumble and a rock that makes them fall" — Paul applies to Israel''s stumbling over Christ'),
(23,  9,  1,  40,  4, 15,  'quote',   '"Land of Zebulun and land of Naphtali" — Matthew cites as fulfilled when Jesus begins his ministry in Galilee'),
(23, 11,  1,  66,  5,  5,  'allusion','"A shoot from the stump of Jesse" — the Root and Offspring of David in Revelation 5 points back here'),
(23, 11, 10,  45, 15, 12,  'quote',   '"The Root of Jesse will spring up, one who will rise to rule over the Gentiles" — Paul cites for Gentile hope in Christ'),
(23, 26, 20,  58, 10, 37,  'allusion','"In a little while" — Hebrews echoes Isaiah''s "hide yourselves a little while" in its coming-of-the-Lord exhortation'),
(23, 28, 11,  46, 14, 21,  'quote',   '"Through people of strange tongues and through the lips of foreigners" — Paul cites as background to tongue-speech'),
(23, 28, 16,  45,  9, 33,  'quote',   '"See, I lay in Zion a tested stone, a precious cornerstone" — Paul in Romans 9 on Israel stumbling over the Messiah'),
(23, 28, 16,  60,  2,  6,  'quote',   '"A chosen and precious cornerstone" — Peter applies to Jesus in his teaching on the new temple community'),
(23, 29, 13,  40, 15,  8,  'quote',   '"These people honor me with their lips, but their hearts are far from me" — Jesus rebukes the Pharisees'' hypocrisy'),
(23, 40,  3,  40,  3,  3,  'quote',   '"A voice of one calling: In the wilderness prepare the way for the LORD" — Matthew applies to John the Baptist''s ministry'),
(23, 40,  3,  43,  1, 23,  'quote',   '"I am the voice of one calling in the wilderness" — John the Baptist''s own self-identification drawing on Isaiah 40'),
(23, 40,  6,  60,  1, 24,  'quote',   '"All people are like grass... but the word of our God endures forever" — Peter applies to the imperishable gospel word'),
(23, 40, 13,  45, 11, 34,  'quote',   '"Who has known the mind of the LORD?" — Paul closes his Romans 9–11 argument with this doxological rhetorical question'),
(23, 42,  1,  40, 12, 18,  'quote',   '"Here is my servant whom I have chosen" — Matthew''s longest OT citation, applied to Jesus''s quiet, healing ministry'),
(23, 45, 23,  45, 14, 11,  'quote',   '"Every knee will bow before me, every tongue will acknowledge God" — Paul on God''s impartial eschatological judgment'),
(23, 45, 23,  50,  2, 10,  'quote',   '"Every knee should bow... and every tongue acknowledge" — Paul applies to the lordship of Jesus in Philippians 2'),
(23, 49,  6,  44, 13, 47,  'quote',   '"I have made you a light for the Gentiles" — Paul and Barnabas cite when turning from resistant Jews to Gentiles'),
(23, 52,  7,  45, 10, 15,  'quote',   '"How beautiful are the feet of those who bring good news" — Paul on the necessity and glory of gospel proclamation'),
(23, 52, 11,  47,  6, 17,  'quote',   '"Come out from them and be separate" — Paul''s call to holiness in 2 Corinthians 6 draws on Isaiah''s new exodus'),
(23, 52, 15,  45, 15, 21,  'quote',   '"Those who were not told about him will see" — Paul''s ambition to preach only where Christ has not yet been named'),
(23, 53,  1,  43, 12, 38,  'quote',   '"Lord, who has believed our message?" — John cites to explain the tragic unbelief of Israel despite Jesus''s signs'),
(23, 53,  1,  45, 10, 16,  'quote',   '"Lord, who has believed our message?" — Paul cites to show Israel has heard but not obeyed the gospel'),
(23, 53,  4,  40,  8, 17,  'quote',   '"He took up our infirmities and bore our diseases" — Matthew applies to Jesus''s healing ministry as a whole'),
(23, 53,  5,  60,  2, 24,  'quote',   '"By his wounds you have been healed" — Peter applies to Christ''s atoning death for the scattered elect'),
(23, 53,  6,  60,  2, 25,  'allusion','Sheep who have gone astray returned to the Shepherd — Peter applies the Servant''s flock imagery to the readers'' conversion'),
(23, 53,  7,  44,  8, 32,  'quote',   '"He was led like a sheep to the slaughter" — Philip uses this very scroll to explain Jesus to the Ethiopian eunuch'),
(23, 53,  9,  60,  2, 22,  'quote',   '"He committed no sin, and no deceit was found in his mouth" — Peter quotes of the sinless Christ bearing our sins'),
(23, 53, 12,  42, 22, 37,  'quote',   '"He was numbered with the transgressors" — Jesus himself says this Isaiah text must be fulfilled in him'),
(23, 54,  1,  48,  4, 27,  'quote',   '"Be glad, barren woman" — Paul applies to the Jerusalem above as the mother of many children born through promise'),
(23, 54, 13,  43,  6, 45,  'quote',   '"They will all be taught by God" — Jesus cites in teaching that all who come to him have first heard and learned from the Father'),
(23, 56,  7,  40, 21, 13,  'quote',   '"My house will be called a house of prayer for all nations" — Jesus quotes when driving out the temple merchants'),
(23, 59,  7,  45,  3, 15,  'quote',   '"Their feet are swift to shed blood" — one verse in Paul''s catena of OT texts establishing universal human sinfulness'),
(23, 61,  1,  42,  4, 18,  'quote',   '"The Spirit of the Lord is on me, because he has anointed me" — Jesus reads this in Nazareth and announces it is fulfilled today'),
(23, 62, 11,  40, 21,  5,  'allusion','"Say to Daughter Zion, See, your Savior comes" — Matthew''s triumphal entry citation combines this with Zechariah 9:9'),
(23, 65,  1,  45, 10, 20,  'quote',   '"I was found by those who did not seek me" — Paul cites to show that Gentile receptivity to the gospel fulfills Isaiah'),
(23, 65,  2,  45, 10, 21,  'quote',   '"All day long I have held out my hands to a disobedient people" — Paul on Israel''s ongoing rejection of the gospel'),
-- ── Jeremiah ─────────────────────────────────────────────────────────────────
(24,  7, 11,  40, 21, 13,  'quote',   '"You have made it a den of robbers" — Jesus combines Jeremiah 7:11 and Isaiah 56:7 in his temple cleansing'),
(24, 31, 15,  40,  2, 18,  'quote',   '"A voice is heard in Ramah, Rachel weeping for her children" — Matthew cites at the massacre of the infants in Bethlehem'),
(24, 31, 31,  58,  8,  8,  'quote',   '"I will make a new covenant" — the longest OT quotation in the NT, central to Hebrews'' argument for the new priesthood'),
-- ── Ezekiel ──────────────────────────────────────────────────────────────────
(26, 34, 23,  43, 10, 11,  'echo',    'God promises to be the one true Shepherd over his scattered flock — Jesus announces he is that Good Shepherd who lays down his life'),
(26, 36, 26,  43,  3,  5,  'echo',    '"I will give you a new heart and put a new spirit in you" — echoed in Jesus''s teaching on rebirth of water and Spirit'),
(26, 37, 27,  47,  6, 16,  'quote',   '"I will be their God, and they will be my people" — Paul applies the covenant renewal formula to the church as God''s temple'),
-- ── Daniel ───────────────────────────────────────────────────────────────────
(27,  7, 13,  40, 24, 30,  'allusion','"One like a son of man, coming with the clouds of heaven" — Jesus uses this self-designation and image for his return'),
(27,  7, 13,  66,  1, 13,  'allusion','The "one like a son of man" in Daniel''s throne vision — Revelation''s opening vision of the risen Christ among the lampstands'),
(27,  9, 27,  40, 24, 15,  'allusion','"The abomination that causes desolation" standing in the holy place — Jesus explicitly cites Daniel''s prophecy here'),
-- ── Hosea ────────────────────────────────────────────────────────────────────
(28,  6,  2,  46, 15,  4,  'echo',    '"On the third day he will restore us" — a distant echo of resurrection on the third day cited by Paul in 1 Corinthians 15'),
(28, 11,  1,  40,  2, 15,  'quote',   '"Out of Egypt I called my son" — Matthew sees this fulfilled in Jesus''s family''s flight to and return from Egypt'),
-- ── Joel ─────────────────────────────────────────────────────────────────────
(29,  2, 28,  44,  2, 17,  'quote',   '"Your sons and daughters will prophesy" — Peter declares this fulfilled at Pentecost in his address to the crowd'),
(29,  2, 32,  45, 10, 13,  'quote',   '"Everyone who calls on the name of the LORD will be saved" — Paul''s evangelistic key text in Romans 10'),
-- ── Amos ─────────────────────────────────────────────────────────────────────
(30,  9, 11,  44, 15, 16,  'quote',   '"I will rebuild David''s fallen tent" — James cites at the Jerusalem Council to show Gentile inclusion fulfills Amos'),
-- ── Jonah ────────────────────────────────────────────────────────────────────
(32,  1, 17,  40, 12, 40,  'quote',   '"As Jonah was three days and three nights in the belly of the fish" — Jesus gives the sign of Jonah as the only sign he will give'),
-- ── Micah ────────────────────────────────────────────────────────────────────
(33,  5,  2,  40,  2,  6,  'quote',   '"But you, Bethlehem Ephrathah... a ruler over Israel will come from you" — the chief priests cite this to Herod'),
-- ── Habakkuk ─────────────────────────────────────────────────────────────────
(35,  2,  4,  45,  1, 17,  'quote',   '"The righteous will live by faith" — Paul''s thesis for the entire letter to the Romans, drawn from Habakkuk'),
(35,  2,  4,  48,  3, 11,  'quote',   '"The righteous will live by faith" — Paul uses in Galatians as proof that law-keeping is not the way of righteousness'),
(35,  2,  4,  58, 10, 38,  'quote',   '"My righteous one will live by faith" — Hebrews applies to the persevering faith that does not shrink back'),
-- ── Zechariah ────────────────────────────────────────────────────────────────
(38,  9,  9,  40, 21,  5,  'quote',   '"Your king comes to you, gentle and riding on a donkey, on a colt" — Matthew''s triumphal entry citation'),
(38,  9,  9,  43, 12, 15,  'quote',   '"Do not be afraid, Daughter Zion; see, your king is coming" — John''s triumphal entry citation of Zechariah 9:9'),
(38, 11, 12,  40, 27,  9,  'quote',   '"They took the thirty pieces of silver" — Matthew cites this as fulfilled in Judas''s betrayal price and the potter''s field'),
(38, 12, 10,  43, 19, 37,  'quote',   '"They will look on the one they have pierced" — John cites at the piercing of Jesus''s side after his death'),
(38, 12, 10,  66,  1,  7,  'quote',   '"Even those who pierced him" — Revelation opens with this Zechariah text on the universal visibility of Christ''s return'),
(38, 13,  7,  40, 26, 31,  'quote',   '"Strike the shepherd, and the sheep of the flock will be scattered" — Jesus quotes this at Gethsemane about his disciples'),
-- ── Malachi ──────────────────────────────────────────────────────────────────
(39,  3,  1,  40, 11, 10,  'quote',   '"I will send my messenger ahead of you, who will prepare your way" — Jesus identifies John the Baptist as this messenger'),
(39,  4,  5,  40, 11, 14,  'allusion','The prophecy of Elijah''s return — Jesus says John the Baptist is the "Elijah" who was to come'),
(39,  4,  5,  42,  1, 17,  'allusion','John will come in the spirit and power of Elijah — the angel Gabriel announces this to Zechariah at John''s conception');