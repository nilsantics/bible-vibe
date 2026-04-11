/**
 * Seed Church Fathers writings natively via Claude.
 * Run once: node scripts/seed-patristic.mjs
 *
 * For each writing, Claude generates structured section-by-section content
 * based on the actual public-domain text (ANF/NPNF series).
 *
 * Requires: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// All writings to seed — ordered by era
const WRITINGS = [
  {
    slug: 'didache',
    father_name: 'Unknown (Apostolic)',
    title: 'The Didache',
    era: 'c. 50–120 AD',
    tradition: 'Apostolic Father',
    description: 'The oldest surviving Christian catechism. "The Teaching of the Twelve Apostles" covers ethics, liturgy, baptism, fasting, the Eucharist, and church order.',
    sections: [
      { number: 1, title: 'The Two Ways — Love and Life', prompt: 'Write chapter 1 of the Didache: the Two Ways teaching. "There are two ways, one of life and one of death, but a great difference between the two ways." Include the love commandments, the Golden Rule in its negative form, and giving to all who ask.' },
      { number: 2, title: 'The Way of Life — What Not to Do', prompt: 'Write chapter 2 of the Didache: prohibitions against murder, adultery, corrupting youth, fornication, theft, magic, sorcery, abortion, and false witness. Stay close to the actual text.' },
      { number: 3, title: 'Flee Vice, Embrace Virtue', prompt: 'Write chapter 3 of the Didache: flee anger as it leads to murder; flee lust as it leads to fornication; flee omens and astrology. Embrace humility, patience, and goodness.' },
      { number: 4, title: 'Community Life and Conduct', prompt: 'Write chapter 4 of the Didache: honor teachers, seek out the saints daily, do not cause divisions, confess transgressions, do not pray with an evil conscience. Instructions on slaves and masters.' },
      { number: 5, title: 'The Way of Death', prompt: 'Write chapter 5 of the Didache: the way of death — murders, adulteries, lusts, fornications, thefts, idolatries, corruption, advocates of the rich. Keep well away from this way.' },
      { number: 6, title: 'Food and Fasting Rules', prompt: 'Write chapter 6 of the Didache: take up the full yoke of the Lord. On food offered to idols: bear what you can. Avoid meat offered to idols.' },
      { number: 7, title: 'Baptism', prompt: 'Write chapter 7 of the Didache: baptism instructions. Baptize in living (running) water in the name of the Father, Son, and Holy Spirit. If no running water, use still water; if cold not available, use warm. Pour water on the head three times. The baptizer and the baptized must fast beforehand.' },
      { number: 8, title: 'Fasting and the Lord\'s Prayer', prompt: 'Write chapter 8 of the Didache: do not fast on Monday and Thursday like the hypocrites — fast Wednesday and Friday. Do not pray like the hypocrites. Pray the Lord\'s Prayer (full text, closely following Matthew\'s version) three times daily.' },
      { number: 9, title: 'The Eucharist', prompt: 'Write chapter 9 of the Didache: the Eucharist prayers. The cup: "We thank Thee, our Father, for the holy vine of David Thy servant..." The broken bread: "We thank Thee, our Father, for the life and knowledge which Thou madest known to us..." As this broken bread was scattered over the mountains and gathered together to become one, so let Thy Church be gathered from the ends of the earth.' },
      { number: 10, title: 'Prayer After the Eucharist', prompt: 'Write chapter 10 of the Didache: the thanksgiving after the meal. "We thank Thee, holy Father, for Thy holy name which Thou didst cause to tabernacle in our hearts..." Let grace come and let this world pass away. Hosanna to the God of David. Maranatha. Amen.' },
      { number: 11, title: 'Apostles and Prophets', prompt: 'Write chapter 11 of the Didache: rules for receiving apostles and prophets. A visiting apostle should stay no more than two days; if three, he is a false prophet. A prophet who asks for money is a false prophet. Test prophets by their ways.' },
      { number: 12, title: 'Receiving Travelers', prompt: 'Write chapter 12 of the Didache: receiving travelers in the name of the Lord. Give hospitality for two or three days. If a traveler wants to settle with you, he must work. If he has a trade, let him work. If not, use your judgment. Do not live idle among you as a Christian.' },
      { number: 13, title: 'Support for Prophets and Teachers', prompt: 'Write chapter 13 of the Didache: every first-fruit of wine, corn, cattle, and sheep should be given to the prophets, for they are your high priests. A true prophet who desires to settle among you is worthy of his food.' },
      { number: 14, title: 'The Lord\'s Day Assembly', prompt: 'Write chapter 14 of the Didache: on the Lord\'s day gather, break bread, and give thanks — having confessed your transgressions. Let no one who has a quarrel with a fellow come until they are reconciled, that the sacrifice may not be defiled.' },
      { number: 15, title: 'Appointing Bishops and Deacons', prompt: 'Write chapter 15 of the Didache: appoint bishops and deacons worthy of the Lord, meek and not money-lovers, truthful and proved. Do not despise them — they are honored along with the prophets and teachers. Reprove one another according to the Gospel.' },
      { number: 16, title: 'Watchfulness and the End', prompt: 'Write chapter 16 of the Didache: watch over your life. Let your lamps not go out. Be ready — for you know not the hour. The world-deceiver will appear as the Son of God. Then the signs of the truth: the sign of an opening in the heaven, the sign of the trumpet\'s sound, and the third, the resurrection of the dead. The Lord shall come and all His saints with Him.' },
    ],
  },
  {
    slug: 'polycarp-philippians',
    father_name: 'Polycarp of Smyrna',
    title: 'Epistle to the Philippians',
    era: 'c. 110–140 AD',
    tradition: 'Apostolic Father',
    description: 'A letter from the bishop of Smyrna to the church at Philippi, addressing Christian conduct, the dangers of heresy, and the faithfulness of Ignatius of Antioch.',
    sections: [
      { number: 1,  title: 'Greeting and Joy at Their Faith', prompt: 'Write chapter 1 of Polycarp\'s Epistle to the Philippians: Polycarp and the elders greet the church at Philippi. He rejoices that many among them have received the marks of true faith and that the roots of faith — announced of old — abide among them. Grace and peace from God and Christ.' },
      { number: 2,  title: 'Submit to God and Walk in Truth', prompt: 'Write chapter 2: put on the armor of righteousness; keep your loins girded with truth. Follow the example of the Lord — steadfast in faith, grave in conduct, temperate in all things. Polycarp quotes Christ and the apostles on mercy, judgment, and prayer for enemies.' },
      { number: 3,  title: 'The Commands of the Lord and Paul\'s Letters', prompt: 'Write chapter 3: Polycarp says he writes not of his own accord but because they asked him. He commends Paul\'s letters — Paul who was among them face to face and wrote to them epistles. By these letters they can be built up in faith.' },
      { number: 4,  title: 'Duties of Wives, Widows, and Deacons', prompt: 'Write chapter 4: wives should walk in the faith given to them; widows should be sober in prayer; deacons should be blameless before righteousness as the ministers of God. The love of money is the root of all evil. Keep yourselves free from covetousness.' },
      { number: 5,  title: 'Duties of Young Men and Virgins', prompt: 'Write chapter 5: young men should be blameless in all things. Virgins must walk with a pure and spotless conscience. Elders must be compassionate, merciful to all, turning back those who have wandered. Do not be hasty in judgment.' },
      { number: 6,  title: 'Duties of Elders and Avoiding Evil', prompt: 'Write chapter 6: elders should be compassionate. Avoid all evil. Abstain from the love of money and false witness. Restore the wandering. Visit the sick. Stand fast in what you have received.' },
      { number: 7,  title: 'Warning Against Heresy — The Spirit of Antichrist', prompt: 'Write chapter 7: everyone who does not confess that Jesus Christ has come in the flesh is an antichrist. Whoever does not confess the testimony of the cross is of the devil. Whoever perverts the oracles of the Lord to his own lusts is the firstborn of Satan. Leave the foolishness of the many and their false teachings.' },
      { number: 8,  title: 'Exhortation to Steadfast Faith', prompt: 'Write chapter 8: let us return to the word handed down to us. Let us also return to the example of patient endurance — not only in the blessed Ignatius and Zosimus and Rufus, but also in others among you, and in Paul himself and the rest of the apostles.' },
      { number: 9,  title: 'The Example of Ignatius and the Martyrs', prompt: 'Write chapter 9: Polycarp urges them to follow the example of Ignatius, Zosimus, and Rufus, who did not love the present world but Christ who died and rose. They are now in the place they deserved. Exhort all to obedience.' },
      { number: 10, title: 'Stand Firm — Press Forward Together', prompt: 'Write chapter 10: stand fast in these things. Press forward in the hope of things to come. Do good to all — both to believers and unbelievers. Pray for kings and those in authority. Pray for your enemies. Pray for the persecution of the cross.' },
      { number: 11, title: 'The Case of Valens — Warning Against Avarice', prompt: 'Write chapter 11: Polycarp is grieved about Valens, once a presbyter, and his wife, who turned away from the truth through love of money. Do not treat them as enemies but restore them. Do not be overcome by this evil. Do not despise those who fall — but restore them.' },
      { number: 12, title: 'Prayer for the Church and All People', prompt: 'Write chapter 12: pray for all the saints, for kings, for those in authority, for those who persecute and hate you, for the enemies of the cross. Write to us about the state of those in Philippi.' },
      { number: 13, title: 'The Letters of Ignatius', prompt: 'Write chapter 13: the letters of Ignatius that Polycarp sends. He has gathered all he could find of the letters Ignatius wrote. They will be of great advantage to those who want to be edified in faith and virtue. Include the greeting.' },
      { number: 14, title: 'Closing and Greetings', prompt: 'Write chapter 14 (the closing): Polycarp sends greetings from himself and the elders. Greet all the saints. Crescens and his sister also send greetings. The grace of the Lord Jesus Christ be with all.' },
    ],
  },
  {
    slug: 'ignatius-romans',
    father_name: 'Ignatius of Antioch',
    title: 'Epistle to the Romans',
    era: 'c. 108 AD',
    tradition: 'Apostolic Father',
    description: 'Written en route to his martyrdom in Rome, Ignatius pleads with the Roman church not to intercede for his release. His desire to die for Christ is one of the most moving documents of early Christianity.',
    sections: [
      { number: 1, title: 'Greeting to the Church at Rome', prompt: 'Write chapter 1 of Ignatius\'s Epistle to the Romans: the greeting. Ignatius addresses the church in Rome which presides in the place of the district of the Romans, worthy of God, worthy of honour, worthy of blessing, worthy of praise, worthy of success, worthy of holiness. He who is bound in Christ Jesus writes.' },
      { number: 2, title: 'Do Not Try to Save Me', prompt: 'Write chapter 2: Ignatius prays only that they will leave him to be an offering to God while the altar is ready. He says "For me, to live is Christ." Let the beasts be eager to come at me. I am God\'s wheat and will be ground by the teeth of wild beasts that I may be found pure bread of Christ.' },
      { number: 3, title: 'Intercede Not for Me', prompt: 'Write chapter 3: Ignatius is afraid their love will do him wrong. It is easy for them to have their own will; but it is difficult for me to attain to God if they spare me. Do not give me to the world. Let me receive the pure light. When I arrive there, I shall be a human being.' },
      { number: 4, title: 'I Will Be a Real Disciple Only When I Die', prompt: 'Write chapter 4: I am corresponding with all the churches and giving them all the assurance that I am ready to die for God. Let me be given to the wild beasts; through them I can attain to God. I am God\'s wheat, ground fine by the lion\'s teeth, to be made purest bread for Christ.' },
      { number: 5, title: 'The Wild Beasts Are My Teacher', prompt: 'Write chapter 5: Ignatius speaks of fire, the cross, packs of wild beasts, lacerations of body and bone, mangling of limbs — let all these come upon him if only he may reach Jesus Christ. The pangs of birth are upon me. Bear with me, brethren. There is no fire of material longing within me.' },
      { number: 6, title: 'The Prince of This World Will Try to Corrupt Me', prompt: 'Write chapter 6: the prince of this age would fain carry me away and corrupt my godly mind. Do not help him. Be on my side — that is, on God\'s side. Do not have Jesus Christ on your lips and the world in your hearts. Be not led astray.' },
      { number: 7, title: 'My Earthly Desire Is Crucified', prompt: 'Write chapter 7: the earthly yearnings have been crucified and there is in him no fire of love for material things, but only living water that says inside him "Come to the Father." Ignatius cannot take delight in food of corruption nor in pleasures of this life.' },
      { number: 8, title: 'Remember Me in Prayer', prompt: 'Write chapter 8: Ignatius does not want to die by a death unworthy of God. He who calls himself a bishop while setting aside God\'s commands is counted as nothing. The prince of this age will seek to intercept and carry him away. Remember the church of Syria in your prayers.' },
      { number: 9, title: 'Final Greetings and Farewell', prompt: 'Write chapter 9: I am writing this from Smyrna by the hand of the Ephesians who deserve every blessing. Of carnal things Demas and Crocus are worthy; give them my greetings. Farewell in God our Father and Jesus Christ our common hope.' },
    ],
  },
  {
    slug: 'on-the-incarnation',
    father_name: 'Athanasius of Alexandria',
    title: 'On the Incarnation',
    era: 'c. 318 AD',
    tradition: 'Nicene Father',
    description: 'Athanasius\'s masterwork explaining why the eternal Son of God became human. C.S. Lewis called it one of the greatest theological books ever written and wrote the introduction to a modern edition.',
    sections: [
      { number: 1,  title: 'Preface — Against the Pagans', prompt: 'Write the preface of Athanasius\'s On the Incarnation: the purpose of the work is to show how the divine Word of God who dwells in all things took upon himself a body and became man. He has already written Against the Pagans; now he writes to complete the account by treating of the Incarnation of the Word.' },
      { number: 2,  title: 'Creation and the Fall', prompt: 'Write section 2-3: God created all things out of nothing through his Word. He made human beings in his own image. He gave them a special grace — if they kept the commandment they would remain immortal. But they fell. The transgression introduced corruption. Death had power over them.' },
      { number: 3,  title: 'The Divine Dilemma', prompt: 'Write sections 6-7: God faced a dilemma. He had threatened death if they transgressed. Repentance alone was insufficient — it did not satisfy God\'s truthfulness. But leaving humans to corruption was unworthy of his goodness. Only the Word who had made humanity could restore it.' },
      { number: 4,  title: 'Why the Word Took a Body', prompt: 'Write sections 8-9: why did the Word take a body rather than some other means? The body was required so that death could be dealt with once for all. He bore our death in his body, offered it to the Father. Thus what was required of all was accomplished in the one who acted for all.' },
      { number: 5,  title: 'The Resurrection — Victory Over Death', prompt: 'Write sections 26-27: the chief proof of the Resurrection is that death has no power over those who believe in Christ. Before Christ, death was terrible and everyone feared it. Now, believers scorn death and endure martyrdom joyfully. This is the proof: Christ has destroyed death.' },
      { number: 6,  title: 'Against the Jews — Prophecies Fulfilled', prompt: 'Write sections 33-34: Athanasius addresses the Jews. The prophets foretold both the humanity of Christ and his divinity. Isaiah 7:14 — "a virgin shall conceive." Micah 5:2 — born in Bethlehem. Daniel 9:24 — seventy weeks until Christ. The time has come; all nations have abandoned idols.' },
      { number: 7,  title: 'Against the Pagans — The Wisdom of the Cross', prompt: 'Write sections 43-45: against the pagans who consider the cross foolish. Why did he die by crucifixion? Because the cross is the sign of life and the symbol of conquest. He stretched out his arms on the cross to gather both Jews and Gentiles. The resurrection on the third day was to refute those who said he never rose.' },
      { number: 8,  title: 'The Evidence of the Incarnation Today', prompt: 'Write sections 46-47: the evidence for the Incarnation is visible now. The demons are driven out in the name of Christ. Men and women scorn death. Former licentious people become chaste. Former cowards become brave. This would not happen unless Christ were God, and unless his death and resurrection were real.' },
      { number: 9,  title: 'Conclusion — Knowing God Through the Word', prompt: 'Write sections 54-57 (conclusion): the Word was made manifest so that we might know God. Human souls, clouded by corruption, could no longer see God directly. So the Word became flesh — what is visible and tangible — so that humans might know the Father through him. Through the Incarnation, in short, we know God.' },
    ],
  },
  {
    slug: 'augustine-confessions',
    father_name: 'Augustine of Hippo',
    title: 'Confessions',
    era: 'c. 397–400 AD',
    tradition: 'Latin Father',
    description: 'The first autobiography in Western literature and one of the greatest spiritual classics. Augustine traces his sinful youth, his intellectual journey through Manichaeism and Neo-Platonism, and his eventual conversion to Christianity.',
    sections: [
      { number: 1,  title: 'Book I — Infancy and Childhood', prompt: 'Write a summary of Book I of Augustine\'s Confessions: the famous opening "Thou madest us for Thyself, and our heart is restless until it repose in Thee." Augustine on how God is in all things and all things are in God. His infancy — he learned to speak, to lie, to be proud. His school years — he hated learning yet learned. His early sins were signs of the will\'s corruption.' },
      { number: 2,  title: 'Book II — The Pear Tree and Adolescent Sin', prompt: 'Write a summary of Book II: Augustine in his sixteenth year, consumed by lust. His father saw only his growing manhood; his mother Monica was afraid for him. The famous pear-tree incident — he and companions stole pears not from hunger but from the love of mischief itself. Augustine meditates on what he loved in that theft: the fellowship of sin.' },
      { number: 3,  title: 'Book III — Carthage and Manichaeism', prompt: 'Write a summary of Book III: Augustine at Carthage — "a cauldron of unholy loves." He takes a concubine. He reads Cicero\'s Hortensius and it awakens his desire for wisdom. He turns to Scripture but finds it too humble for his pride. He falls into the Manichaean sect, which promised rational solutions to the problem of evil.' },
      { number: 4,  title: 'Book IV — Teaching Rhetoric, Loss of a Friend', prompt: 'Write a summary of Book IV: Augustine teaching rhetoric, living with his concubine. His closest friend falls dangerously ill, is baptized while unconscious, and dies. Augustine is devastated — he had loved his friend as an extension of himself, not in God. His grief teaches him that loving temporal things apart from God leads to sorrow.' },
      { number: 5,  title: 'Book V — Faustus the Manichaean; Rome and Milan', prompt: 'Write a summary of Book V: Augustine meets Faustus, the famous Manichaean bishop, and is disappointed — eloquent but shallow. His faith in Manichaeism begins to crumble. He travels to Rome, then Milan, where he hears Ambrose preach. He is captivated by the preaching, though not yet converted.' },
      { number: 6,  title: 'Book VI — Ambrose, Monica, and Alypius', prompt: 'Write a summary of Book VI: Monica arrives in Milan. Augustine is moved by Ambrose but cannot get private access to him. He begins to see the Catholic faith as intellectually defensible. His friend Alypius is enslaved by gladiatorial games — a portrait of addiction. Augustine still delays conversion, still bound by lust, dismisses his concubine.' },
      { number: 7,  title: 'Book VII — Neo-Platonism and the Vision of God', prompt: 'Write a summary of Book VII: Augustine reads the Platonists (likely Plotinus) — they showed him that God is immaterial, that evil is a privation rather than a substance. He sees God in a flash of trembling vision — but cannot sustain it. He lacks the strength. Then he reads Paul, and finds what Platonism could not give: the grace of Christ.' },
      { number: 8,  title: 'Book VIII — Conversion in the Garden', prompt: 'Write a summary of Book VIII: Augustine hears of the conversion of Victorinus, the great rhetorician. He hears of Antony and the monks. He is tormented — two wills at war. Then in the garden in Milan, he hears a child\'s voice: "take up and read." He opens Paul\'s letters to Romans 13:13-14. Light of certainty floods his heart. The crisis is over.' },
      { number: 9,  title: 'Book IX — Baptism and Monica\'s Death', prompt: 'Write a summary of Book IX: Augustine resigns his professorship. He, Alypius, and his son Adeodatus are baptized by Ambrose at Easter. The hymn-singing of Milan. Monica\'s death at Ostia — the famous vision they share at the window: "What is to come in the eternal life of the saints." Augustine weeps for her and is not ashamed.' },
      { number: 10, title: 'Book X — Memory and the Present', prompt: 'Write a summary of Book X: a philosophical meditation on memory as the place where we encounter God. "Late have I loved Thee, O Beauty ever ancient, ever new." Augustine examines how the three temptations — lust of the flesh, lust of the eyes, and pride — still trouble him. Christ is the only mediator between the wretchedness of humanity and the blessedness of God.' },
      { number: 11, title: 'Book XI — Time and Eternity', prompt: 'Write a summary of Book XI: Augustine addresses God with the question "What wast Thou doing before Thou madest heaven and earth?" His famous answer: time itself was created with creation. Past, present, and future are present to the soul — memory, attention, and expectation. God is eternal; time is a distension of the soul.' },
      { number: 12, title: 'Book XII — Heaven, Earth, and Scripture', prompt: 'Write a summary of Book XII: Augustine meditates on "In the beginning God created heaven and earth" — the formless matter, the heaven of heavens, the intellectual creation. A meditation on how many interpretations of Scripture can all be true. Charity is the measure: if an interpretation builds up love of God and neighbor, receive it.' },
      { number: 13, title: 'Book XIII — The Days of Creation and the Church', prompt: 'Write a summary of Book XIII: the six days of creation as an allegory for the new creation in Christ and the life of the Church. The Spirit hovering over the waters — your good Spirit upon your good people. The seventh day has no evening — it is the eternal Sabbath, the rest in God for which we were made. The Confessions ends in adoration.' },
    ],
  },
  {
    slug: 'justin-first-apology',
    father_name: 'Justin Martyr',
    title: 'First Apology',
    era: 'c. 155 AD',
    tradition: 'Apologist',
    description: 'Addressed to Emperor Antoninus Pius, Justin defends Christians against slander, explains Christian theology and worship, and argues that the truth of Christianity is demonstrated by Old Testament prophecy.',
    sections: [
      { number: 1,  title: 'Address to the Emperor — We Ask for Justice', prompt: 'Write chapters 1-3 of Justin\'s First Apology: addressed to the Emperor Antoninus Pius and his sons. Justin asks only for reason and investigation — not favor. Christians are condemned for the name alone, not for proven crimes. The mere name cannot be a crime; only actual wickedness deserves punishment.' },
      { number: 2,  title: 'Christians Are Not Atheists', prompt: 'Write chapters 6-13: Justin defends Christians against the charge of atheism. They refuse to worship the Roman gods — but they worship the true God, the Father of righteousness. They honor the Son and the prophetic Spirit. They worship in spirit and truth. They believe in resurrection and judgment — which is why they live moral lives.' },
      { number: 3,  title: 'Christian Morality — The Sermon on the Mount', prompt: 'Write chapters 14-20: Justin summarizes Christ\'s moral teaching — chastity, love of enemies, truth-telling, non-resistance. He cites the Sermon on the Mount. Christians obey these commands from conviction, not fear of punishment. Compare Christian morality to the immorality of the pagan myths.' },
      { number: 4,  title: 'The Logos — Reason Incarnate', prompt: 'Write chapters 46-47: the doctrine of the Logos (Word/Reason). Socrates and Heraclitus, who lived according to Reason, were in a sense Christians before Christ. The divine Reason (Logos) who was partially known by philosophers has now appeared in full as Jesus Christ. Whatever is true among the pagans belongs to us Christians.' },
      { number: 5,  title: 'Prophecy Fulfilled — The Evidence', prompt: 'Write chapters 30-35: argument from fulfilled prophecy. Moses wrote 1,500 years before Christ; Isaiah 700 years before. They predicted: born of a virgin, in Bethlehem, that he would heal the sick and raise the dead, that he would be betrayed, crucified, rise on the third day. These prophecies are fulfilled; you can verify them.' },
      { number: 6,  title: 'The Christian Liturgy — Baptism and Eucharist', prompt: 'Write chapters 61-67: the famous description of Christian worship. Baptism: those who are persuaded are brought to the water and baptized in the name of the Father, Son, and Holy Spirit. The Eucharist: bread and wine-and-water are brought, the president offers prayers and thanksgiving, all say Amen, and the deacons distribute. This food is called the Eucharist. The Memoirs of the Apostles (Gospels) and writings of the prophets are read. Then the president preaches. Then the collection for the poor.' },
    ],
  },
  {
    slug: 'irenaeus-against-heresies-1',
    father_name: 'Irenaeus of Lyon',
    title: 'Against Heresies — Book I',
    era: 'c. 180 AD',
    tradition: 'Apologist',
    description: 'The first systematic refutation of Gnosticism. Book I exposes the Valentinian Gnostic system in detail — its elaborate mythology of Aeons, the Demiurge, and multiple classes of human beings — before Irenaeus tears it apart in subsequent books.',
    sections: [
      { number: 1, title: 'Preface — Why This Work Is Necessary', prompt: 'Write the preface of Irenaeus\' Against Heresies Book I: false teachers have arisen and are deceiving the simple with plausible-sounding arguments. Irenaeus has been among these people and knows their system. He writes to expose and refute them, so that the faithful may recognize and avoid their snares.' },
      { number: 2, title: 'The Valentinian System — The Pleroma', prompt: 'Write chapters 1-3: the Valentinian cosmology. In the beginning was the perfect Pre-existent One called Fore-father or Bythus (Depth), dwelling in invisible heights. With him was Thought (Ennoia). Together they produced Mind (Nous) and Truth — forming the first tetrad. From these came further Aeons until thirty were complete — this is the Pleroma (Fullness).' },
      { number: 3, title: 'Sophia\'s Fall and the Creation of Matter', prompt: 'Write chapters 4-5: Sophia (Wisdom), the last of the thirty Aeons, desired to know the Father — an impossible desire. She fell into passion and formlessness. Her formless product is matter. The Christ and Holy Spirit stabilize the Pleroma. The Demiurge (inferior god) fashions the material world, ignorant of the higher spiritual realm.' },
      { number: 4, title: 'Three Classes of Human Beings', prompt: 'Write chapters 6-7: the Valentinians distinguish three kinds of men — spiritual (pneumatic), who are saved by nature; psychic, who can be saved through works; and material (hylic/choic), who are lost by nature. They identify themselves as the spiritual ones who will return to the Pleroma. The church\'s people are merely psychic.' },
      { number: 5, title: 'Their Abuse of Scripture', prompt: 'Write chapters 8-9: Irenaeus shows how the Valentinians distort Scripture, taking passages out of context and weaving them into their own mythology — like rearranging Homer\'s lines to tell a new story. He uses the image of a beautiful king\'s mosaic being rearranged into a fox. The words are Scripture\'s; the sense is their own invention.' },
      { number: 6, title: 'The True Rule of Faith', prompt: 'Write chapters 10-11: the Rule of Faith (Regula Fidei). The Church, scattered throughout the whole world, has received from the apostles the one faith: one God the Father Almighty, and one Christ Jesus the Son of God, incarnate for our salvation, and the Holy Spirit who proclaimed through the prophets. This is the one faith, held unanimously everywhere.' },
    ],
  },
]

async function generateSection(writing, section) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [
      {
        role: 'user',
        content: `You are generating content for a Bible study app's Church Fathers section.

Writing: "${writing.title}" by ${writing.father_name} (${writing.era})
Section ${section.number}: "${section.title}"

Task: ${section.prompt}

Write this as clean, flowing prose — 300–500 words. Stay faithful to the actual content of the text. Use the public domain translation style (Roberts-Donaldson or Schaff for ANF texts, Pine-Coffin or Chadwick for Augustine). Include direct quotations where they are famous or important.

Format: plain text, no markdown headers. Paragraph breaks are fine. Start directly with the content, not with the title.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}

async function main() {
  console.log('Seeding patristic writings...\n')

  for (const writing of WRITINGS) {
    console.log(`\n── ${writing.title} (${writing.father_name}) ──`)

    // Check if writing already exists
    const { data: existing } = await supabase
      .from('patristic_writings')
      .select('id')
      .eq('slug', writing.slug)
      .single()

    let writingId = existing?.id

    if (!writingId) {
      const { data: inserted, error } = await supabase
        .from('patristic_writings')
        .insert({
          slug:            writing.slug,
          father_name:     writing.father_name,
          title:           writing.title,
          era:             writing.era,
          tradition:       writing.tradition,
          description:     writing.description,
          total_sections:  writing.sections.length,
        })
        .select('id')
        .single()

      if (error) { console.error(`  ✗ Failed to insert writing: ${error.message}`); continue }
      writingId = inserted.id
      console.log(`  Created writing record`)
    } else {
      console.log(`  Writing already exists, checking sections...`)
    }

    // Check which sections already exist
    const { data: existingSections } = await supabase
      .from('patristic_sections')
      .select('section_number')
      .eq('writing_id', writingId)

    const seededNums = new Set((existingSections ?? []).map((s) => s.section_number))

    for (const section of writing.sections) {
      if (seededNums.has(section.number)) {
        process.stdout.write(`  [${section.number}] already seeded\n`)
        continue
      }

      process.stdout.write(`  [${section.number}] ${section.title}... `)

      try {
        const content = await generateSection(writing, section)

        const { error } = await supabase
          .from('patristic_sections')
          .insert({
            writing_id:     writingId,
            section_number: section.number,
            title:          section.title,
            content,
          })

        if (error) throw error
        console.log('✓')

        // Respect rate limits
        await new Promise((r) => setTimeout(r, 600))
      } catch (err) {
        console.log(`✗ ${err.message}`)
      }
    }
  }

  console.log('\n\nDone! All patristic writings seeded.')
}

main().catch(console.error)
