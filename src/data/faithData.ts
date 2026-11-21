import {
  AIPrivacySettings,
  BibleReadingDay,
  BibleReadingPlan,
  BibleVerse,
  CustomReminderMessage,
  DashboardSectionConfig,
  DisciplinePrivacySettings,
  HabitCategory,
  HabitPriority,
  HabitRepeatType,
  NutritionTargets,
  ReminderConfig,
} from '../types';

export const DEFAULT_DASHBOARD_SECTIONS: DashboardSectionConfig[] = [
  { id: 'scripture', enabled: true },
  { id: 'dailyReflection', enabled: true },
  { id: 'dailyProgress', enabled: true },
  { id: 'quickActions', enabled: true },
  { id: 'discipline', enabled: true },
  { id: 'vision', enabled: true },
  { id: 'nutrition', enabled: true },
  { id: 'eveningReflection', enabled: true },
];

export const DEFAULT_AI_PRIVACY: AIPrivacySettings = {
  allowHabits: true,
  allowGoals: true,
  allowVision: true,
  allowWorkouts: true,
  allowNutrition: true,
  allowSleep: true,
  allowJournal: false,
  allowPrayers: false,
  allowDisciplineTracker: false,
};

export const DEFAULT_NUTRITION_TARGETS: NutritionTargets = {
  calories: 2500,
  proteinG: 180,
  carbsG: 260,
  fatG: 75,
};

export const DEFAULT_DISCIPLINE_PRIVACY: DisciplinePrivacySettings = {
  hideFromDashboard: false,
  customTitle: 'Disciplina in čistost',
  personalGoalDays: 365,
  personalReason:
    'Želim živeti čisto, zbrano in predano življenje pred Bogom ter ostati gospodar svojih odločitev.',
};

export function createDefaultReminderConfigs(
  timezone: string = 'Europe/Ljubljana',
  anchorDate: string = new Date().toISOString().slice(0, 10)
): ReminderConfig[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'rem_morning',
      type: 'morning',
      enabled: true,
      localTime: '07:30',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_midday',
      type: 'midday',
      enabled: true,
      localTime: '13:00',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_evening',
      type: 'evening',
      enabled: true,
      localTime: '21:00',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_biweekly_vision',
      type: 'biweekly_vision',
      enabled: true,
      localTime: '19:00',
      timezone,
      recurrence: 'every_14_days',
      anchorDate,
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_morning_prayer',
      type: 'morning_prayer',
      enabled: false,
      localTime: '07:00',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_bible_reading',
      type: 'bible_reading',
      enabled: false,
      localTime: '07:30',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_gratitude',
      type: 'gratitude',
      enabled: false,
      localTime: '20:30',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_fitness',
      type: 'fitness',
      enabled: false,
      localTime: '16:30',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_water',
      type: 'water',
      enabled: false,
      localTime: '11:00',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_study',
      type: 'study',
      enabled: false,
      localTime: '15:00',
      timezone,
      recurrence: 'daily',
      channel: 'in_app',
      updatedAt: nowIso,
    },
    {
      id: 'rem_weekly_review',
      type: 'weekly_review',
      enabled: true,
      localTime: '20:00',
      timezone,
      recurrence: 'weekly',
      channel: 'in_app',
      updatedAt: nowIso,
    },
  ];
}

/**
 * Curated verified Bible verses using public-domain translations:
 * - English: King James Version (KJV 1769)
 * - Slovenian: Anton Chraska (1914)
 * Devotional reflections and practical applications are kept cleanly separate from Scripture text.
 */
export const EXTENDED_BIBLE_VERSES: BibleVerse[] = [
  {
    id: 'verse-rom-12-2',
    referenceEn: 'Romans 12:2',
    referenceSl: 'Rimljanom 12,2',
    textEn:
      'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
    textSl:
      'In ne priličujte se temu svetu, temveč preobrazite se z obnavljanjem svojega uma, da boste razpoznavali, kaj je volja Božja, kaj je dobro in prijetno in popolno.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Prava sprememba se začne v prenovljenem umu pred Bogom, ne v zunanjem pritisku ali popolnih nizih.',
    reflectionEn:
      'True transformation starts with a mind renewed by God, not worldly pressure or outward perfection.',
    applicationSl: 'Danes zavestno zamenjaj eno škodljivo navado s tihim trenutkom molitve.',
    applicationEn: 'Consciously replace one reactive habit today with a quiet moment of prayer.',
    testament: 'NT',
    category: 'faith',
  },
  {
    id: 'verse-matt-6-33',
    referenceEn: 'Matthew 6:33',
    referenceSl: 'Matej 6,33',
    textEn:
      'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    textSl:
      'Iščite pa najprej kraljestva Božjega in njegove pravičnosti, in vse to vam bo navrženo.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Ko je Bog na prvem mestu, dobijo delo, zdravje in ambicije pravi red in mir.',
    reflectionEn:
      'When God comes first, work, health, and ambition fall into their rightful, peaceful order.',
    applicationSl: 'Preden odpreš obvestila ali opravke, izroči današnji dan Kristusu.',
    applicationEn: 'Before opening tasks or messages today, offer this day to Christ first.',
    testament: 'NT',
    category: 'trust',
  },
  {
    id: 'verse-gal-5-22',
    referenceEn: 'Galatians 5:22-23',
    referenceSl: 'Galačanom 5,22-23',
    textEn:
      'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.',
    textSl:
      'Sad Duha pa je ljubezen, radost, mir, potrpežljivost, blagost, dobrotljivost, zvestoba, krotkost, vzdržnost; zoper take ni postave.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Samokontrola in potrpežljivost sta sad Božjega Duha v nas, ne le rezultat gole človeške sile.',
    reflectionEn:
      'Self-control and patience grow as fruit of the Spirit rather than harsh willpower alone.',
    applicationSl: 'V današnjem izzivu izberi krotkost in zbranost namesto impulzivnosti.',
    applicationEn: 'In today’s friction, choose gentleness and self-control over impulse.',
    testament: 'NT',
    category: 'self_control',
  },
  {
    id: 'verse-ps-23-1',
    referenceEn: 'Psalm 23:1',
    referenceSl: 'Psalm 23,1',
    textEn: 'The LORD is my shepherd; I shall not want.',
    textSl: 'GOSPOD je pastir moj, ničesar ne bom pogrešal.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Gospodova bližina prinaša notranjo sigurnost, da nam ob Njem ne manjka pravega vodstva.',
    reflectionEn:
      'Knowing the Lord as Shepherd brings calm assurance that we do not walk alone.',
    applicationSl: 'Opusti nepotrebno tesnobo in se zahvali za to, kar ti je danes že dano.',
    applicationEn: 'Release one worry today and thank God for what He has already provided.',
    testament: 'OT',
    category: 'trust',
  },
  {
    id: 'verse-lam-3-22',
    referenceEn: 'Lamentations 3:22-23',
    referenceSl: 'Žalostinke 3,22-23',
    textEn:
      'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
    textSl:
      'Milosti GOSPODOVE so, da nismo pokončani, zakaj usmiljenje njegovo ne mine: novo je vsako jutro, velika je zvestoba tvoja.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Vsako jutro je znamenje Božje zvestobe in nove priložnosti — ne glede na včerajšnji padec.',
    reflectionEn:
      'Every morning carries new mercy and a fresh start regardless of yesterday’s stumbling.',
    applicationSl: 'Pusti včerajšnje napake v Božjih rokah in začni današnji dan s hvaležnostjo.',
    applicationEn: 'Place yesterday’s failures in God’s hands and begin today with gratitude.',
    testament: 'OT',
    category: 'hope',
  },
  {
    id: 'verse-1cor-10-13',
    referenceEn: '1 Corinthians 10:13',
    referenceSl: '1 Korinčanom 10,13',
    textEn:
      'There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.',
    textSl:
      'Preizkušnja vas še ni zadela, razen človeške; zvest pa je Bog, ki vam ne bo dal biti preizkušanim nad vaše moči, temveč bo s preizkušnjo naredil tudi izhod iz nje, da boste mogli prestati.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Bog v trenutku skušnjave vedno odpre pot za umik in notranjo svobodo.',
    reflectionEn:
      'In every moment of temptation, God provides a faithful way out toward freedom.',
    applicationSl: 'Če začutiš skušnjavo, takoj vstani, odloži telefon in zmolí kratko molitev.',
    applicationEn: 'If tempted today, change rooms immediately, set the phone down, and pray.',
    testament: 'NT',
    category: 'temptation',
  },
  {
    id: 'verse-phil-4-6',
    referenceEn: 'Philippians 4:6-7',
    referenceSl: 'Filipljanom 4,6-7',
    textEn:
      'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
    textSl:
      'Nič ne bodite v skrbeh, temveč v vsem naj se vaše želje z molitvijo in prošnjo ter z zahvaljevanjem oznanjajo Bogu. In mir Božji, ki presega ves razum, bo varoval vaša srca in vaše misli v Kristusu Jezusu.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Molitev s hvaležnostjo preobrazi skrbi v Božji mir, ki varuje srce in misli.',
    reflectionEn:
      'Prayer paired with thanksgiving turns anxious thought into Christ’s guarding peace.',
    applicationSl: 'Zapiši eno skrb v svoj molitveni dnevnik in jo zahvali Bogu vnaprej za vodstvo.',
    applicationEn: 'Write one worry in your prayer journal and thank God for His steady care.',
    testament: 'NT',
    category: 'anxiety',
  },
  {
    id: 'verse-matt-11-28',
    referenceEn: 'Matthew 11:28',
    referenceSl: 'Matej 11,28',
    textEn: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
    textSl: 'Pridite k meni vsi, ki se trudite in ste obteženi, in jaz vam bom dal počitek.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Kristus nas ne kliče v izčrpavajoči perfekcionizem, temveč v iskren odnos in počitek v Njem.',
    reflectionEn:
      'Christ does not demand anxious perfectionism; He invites the weary into genuine rest.',
    applicationSl: 'Zvečer zaključi delo v miru in prepusti nedokončane skrbi Gospodu.',
    applicationEn: 'Close your evening in peace and entrust unfinished burdens to the Lord.',
    testament: 'NT',
    category: 'hope',
  },
  {
    id: 'verse-isa-41-10',
    referenceEn: 'Isaiah 41:10',
    referenceSl: 'Izaija 41,10',
    textEn:
      'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
    textSl:
      'Ne boj se, saj sem jaz s teboj; ne oziraj se plaho, zakaj jaz sem Bog tvoj; okrepil te bom in ti pomagal in podpiral te bom z desnico svoje pravičnosti.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Pogum vernega človeka ne temelji na lastni popolnosti, temveč na obljubi, da je Bog z nami.',
    reflectionEn:
      'Courage rests on God’s presence with us rather than self-sufficiency.',
    applicationSl: 'Stopi v najpomembnejšo nalogo dneva brez strahu.',
    applicationEn: 'Step into your most challenging task today with quiet trust.',
    testament: 'OT',
    category: 'courage',
  },
  {
    id: 'verse-eph-4-32',
    referenceEn: 'Ephesians 4:32',
    referenceSl: 'Efežanom 4,32',
    textEn:
      'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ’s sake hath forgiven you.',
    textSl:
      'Bodite pa drug do drugega prijazni, usmiljeni, odpuščajoči si med seboj, kakor je tudi Bog v Kristusu odpustil vam.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Prava duhovna rast se vedno pokaže v potrpežljivosti, odpuščanju in ljubezni do bližnjih.',
    reflectionEn:
      'Genuine spiritual growth shows up in patience, mercy, and kindness toward others.',
    applicationSl: 'Danes nameni prijazno besedo ali pomoč nekomu iz družine ali okolice.',
    applicationEn: 'Show quiet kindness or patience to someone close to you today.',
    testament: 'NT',
    category: 'forgiveness',
  },
  {
    id: 'verse-ps-46-1',
    referenceEn: 'Psalm 46:1',
    referenceSl: 'Psalm 46,2',
    textEn: 'God is our refuge and strength, a very present help in trouble.',
    textSl: 'Bog nam je pribežališče in moč, pomoč v stiskah, v resnici izkušena.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Ko zmanjka človeške moči, je Bog naše varno zavetje in stalna pomoč.',
    reflectionEn:
      'When human strength runs thin, God remains an ever-present refuge.',
    applicationSl: 'V težkem trenutku poišči najprej Boga, šele nato rešitve.',
    applicationEn: 'Turn to God first in moments of pressure before seeking quick fixes.',
    testament: 'OT',
    category: 'strength',
  },
  {
    id: 'verse-1cor-13-4',
    referenceEn: '1 Corinthians 13:4',
    referenceSl: '1 Korinčanom 13,4',
    textEn:
      'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
    textSl:
      'Ljubezen je potrpežljiva, dobrotljiva je ljubezen, ne zavida, ljubezen se ne ponaša, se ne napihuje.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Disciplina brez ljubezni in ponižnosti postane trda; s Kristusovo ljubeznijo postane dar za druge.',
    reflectionEn:
      'Discipline without humility grows harsh; with Christ’s love it becomes service.',
    applicationSl: 'Vprašaj se, kako lahko danes služiš bližnjemu s ponižnostjo.',
    applicationEn: 'Ask how you can serve someone today with humility.',
    testament: 'NT',
    category: 'love',
  },
  {
    id: 'verse-john-14-6',
    referenceEn: 'John 14:6',
    referenceSl: 'Janez 14,6',
    textEn:
      'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
    textSl:
      'Jezus mu reče: Jaz sem pot in resnica in življenje; nihče ne pride k Očetu razen po meni.',
    translationEn: 'KJV',
    translationSl: 'Chraska (1914)',
    reflectionSl:
      'Jezus Kristus je središče naše vere, smisel naših odločitev in temelj resničnega življenja.',
    reflectionEn:
      'Jesus Christ stands at the center of truth, direction, and eternal life.',
    applicationSl: 'Preberi kratek odlomek iz evangelijev in prisluhni Jezusovim besedam.',
    applicationEn: 'Read a brief Gospel passage today and reflect on Jesus’s words.',
    testament: 'NT',
    category: 'faith',
  },
];

export const DAILY_REFLECTION_QUESTIONS: {
  id: string;
  sl: string;
  en: string;
}[] = [
  {
    id: 'ref-1',
    sl: 'Zakaj si se odločil spremeniti svoje življenje?',
    en: 'Why did you decide to change your life?',
  },
  {
    id: 'ref-2',
    sl: 'Ali so tvoje današnje odločitve v skladu z življenjem, ki si ga želiš?',
    en: 'Are today’s choices aligned with the life you want to build?',
  },
  {
    id: 'ref-3',
    sl: 'Kaj lahko danes narediš, da boš bližje Bogu?',
    en: 'What can you do today to draw closer to God?',
  },
  {
    id: 'ref-4',
    sl: 'Za kaj si danes iskreno hvaležen Gospodu?',
    en: 'What are you genuinely grateful to the Lord for today?',
  },
  {
    id: 'ref-5',
    sl: 'Kje si danes pokazal potrpežljivost, ponižnost ali samokontrolo?',
    en: 'Where can you practice patience, humility, or self-control today?',
  },
  {
    id: 'ref-6',
    sl: 'Če bi danes ravnal z več vere in manj strahu, kaj bi naredil najprej?',
    en: 'If you acted with more faith and less fear today, what would be your first step?',
  },
  {
    id: 'ref-7',
    sl: 'Komu lahko danes prineseš mir, prijaznost ali konkretno pomoč?',
    en: 'Who can you encourage, forgive, or quietly serve today?',
  },
  {
    id: 'ref-8',
    sl: 'Katera navada te ta teden najbolj oblikuje v človeka, kakršen želiš postati?',
    en: 'Which habit this week is shaping you most into the person God calls you to be?',
  },
  {
    id: 'ref-9',
    sl: 'Katere misli ali skrbi moraš danes izročiti Bogu v molitvi?',
    en: 'Which worries or distractions do you need to entrust to God in prayer today?',
  },
  {
    id: 'ref-10',
    sl: 'Kaj si se naučil iz včerajšnjega dne, ne glede na to, ali je bil uspešen ali težak?',
    en: 'What did yesterday teach you about humility and perseverance?',
  },
  {
    id: 'ref-11',
    sl: 'Kako boš danes skrbel za svoje telo kot darilo, ki ti je bilo zaupano?',
    en: 'How will you steward your body and health responsibly today?',
  },
  {
    id: 'ref-12',
    sl: 'Kje tvoja dejanja že odražajo vrednote, za katere moliš?',
    en: 'Where do your daily actions already reflect the values you pray for?',
  },
  {
    id: 'ref-13',
    sl: 'Česa se bo tvoj prihodnji jaz čez eno leto hvaležno spominjal iz današnjega dne?',
    en: 'What will you be grateful for from today one year from now?',
  },
  {
    id: 'ref-14',
    sl: 'Ali danes slediš Božji besedi in svojemu namenu ali trenutnim čustvom?',
    en: 'Are you following God’s Word and your purpose today, or temporary emotions?',
  },
];

function buildSequentialDays(
  entries: [string, string, string, string][]
): BibleReadingDay[] {
  return entries.map(([referenceSl, referenceEn, focusSl, focusEn], index) => ({
    dayNumber: index + 1,
    referenceSl,
    referenceEn,
    focusSl,
    focusEn,
  }));
}

export const BIBLE_READING_PLANS: BibleReadingPlan[] = [
  {
    id: 'gratitude-7',
    titleSl: '7 dni hvaležnosti',
    titleEn: '7 Days of Gratitude',
    descriptionSl: 'Teden prepoznavanja Božjih darov in zahvalnega srca.',
    descriptionEn: 'Seven verified passages on giving thanks in every season.',
    durationDays: 7,
    days: buildSequentialDays([
      ['1 Tesaloničanom 5,16-18', '1 Thessalonians 5:16-18', 'Zahvaljujte se v vsem', 'Give thanks in every circumstance'],
      ['Psalm 100,1-5', 'Psalm 100:1-5', 'Vstopite v njegova vrata z zahvalo', 'Enter His gates with thanksgiving'],
      ['Kološanom 3,15-17', 'Colossians 3:15-17', 'Kristusov mir in hvaležnost', 'Let the peace of Christ rule'],
      ['Psalm 107,1-9', 'Psalm 107:1-9', 'Zahvalite se Gospodu, ker je dober', 'Oh give thanks unto the LORD'],
      ['Jakob 1,17', 'James 1:17', 'Vsak dober dar prihaja od zgoraj', 'Every good gift is from above'],
      ['Filipljanom 4,6-7', 'Philippians 4:6-7', 'Prošnje z zahvaljevanjem', 'Supplication with thanksgiving'],
      ['Žalostinke 3,22-24', 'Lamentations 3:22-24', 'Novo usmiljenje vsako jutro', 'Mercies new every morning'],
    ]),
  },
  {
    id: 'discipline-7',
    titleSl: '7 dni discipline',
    titleEn: '7 Days of Discipline',
    descriptionSl: 'Svetopisemski odlomki o samokontroli, zvestobi in treznosti.',
    descriptionEn: 'Seven days anchored in self-control, stewardship, and diligence.',
    durationDays: 7,
    days: buildSequentialDays([
      ['1 Korinčanom 9,24-27', '1 Corinthians 9:24-27', 'Vztrajen tek z jasnim ciljem', 'Running with self-control'],
      ['2 Timoteju 1,7', '2 Timothy 1:7', 'Duh moči, ljubezni in razumnosti', 'Power, love, and a sound mind'],
      ['Pregovori 25,28', 'Proverbs 25:28', 'Obvladovanje lastnega duha', 'Guarding your spirit with restraint'],
      ['Galačanom 5,22-25', 'Galatians 5:22-25', 'Sad Duha in vzdržnost', 'Self-control as fruit of the Spirit'],
      ['Kološanom 3,23-24', 'Colossians 3:23-24', 'Delo iz srca kakor Gospodu', 'Work heartily as for the Lord'],
      ['Titu 2,11-12', 'Titus 2:11-12', 'Milost vzgaja k treznemu življenju', 'Grace training us to live uprightly'],
      ['Hebrejcem 12,1-2', 'Hebrews 12:1-2', 'Odlaganje bremen s pogledom na Jezusa', 'Looking unto Jesus in perseverance'],
    ]),
  },
  {
    id: 'follow-jesus-14',
    titleSl: '14 dni hoje za Jezusom',
    titleEn: '14 Days Following Jesus',
    descriptionSl: 'Dva tedna z Jezusovimi besedami v evangelijih.',
    descriptionEn: 'Fourteen days walking through key moments of Christ’s teaching.',
    durationDays: 14,
    days: buildSequentialDays([
      ['Janez 1,1-14', 'John 1:1-14', 'Beseda je postala meso', 'The Word became flesh'],
      ['Matej 5,1-16', 'Matthew 5:1-16', 'Blagri in luč sveta', 'The Beatitudes and light of the world'],
      ['Matej 6,5-15', 'Matthew 6:5-15', 'Očenaš in iskrena molitev', 'The Lord’s Prayer in humility'],
      ['Matej 6,25-34', 'Matthew 6:25-34', 'Zaupanje Očetu brez tesnobe', 'Seek first the kingdom of God'],
      ['Matej 7,24-27', 'Matthew 7:24-27', 'Hiša na skali poslušnosti', 'Building your house on the rock'],
      ['Matej 11,28-30', 'Matthew 11:28-30', 'Počitek v Kristusu', 'Come to Me and find rest'],
      ['Janez 8,12', 'John 8:12', 'Jezus, luč sveta', 'Walking in the light of life'],
      ['Janez 10,11-16', 'John 10:11-16', 'Dobri pastir', 'The Good Shepherd knows His own'],
      ['Janez 13,1-17', 'John 13:1-17', 'Ponižno služenje drugim', 'Humble love in service'],
      ['Janez 14,1-6', 'John 14:1-6', 'Pot, resnica in življenje', 'The Way, the Truth, and the Life'],
      ['Janez 15,1-12', 'John 15:1-12', 'Ostanite v meni', 'Abiding in Christ like the vine'],
      ['Luka 15,11-24', 'Luke 15:11-24', 'Očetovo usmiljenje in vrnitev', 'The Father’s forgiving embrace'],
      ['Rimljanom 5,1-8', 'Romans 5:1-8', 'Mir z Bogom po Kristusu', 'Justified by faith and grace'],
      ['Efežanom 2,8-10', 'Ephesians 2:8-10', 'Rešeni po milosti za dobra dela', 'Saved by grace for good works'],
    ]),
  },
  {
    id: 'faith-21',
    titleSl: '21 dni vere in vztrajnosti',
    titleEn: '21 Days of Faith & Perseverance',
    descriptionSl: 'Trije tedni krepitve zaupanja v Boga skozi preizkušnje.',
    descriptionEn: 'Three weeks cultivating steady trust in God through challenges.',
    durationDays: 21,
    days: Array.from({ length: 21 }, (_, idx) => {
      const refs: [string, string, string, string][] = [
        ['Jozue 1,7-9', 'Joshua 1:7-9', 'Pogum ob Gospodovi obljubi', 'Be strong and courageous'],
        ['Psalm 23,1-6', 'Psalm 23:1-6', 'Gospod je moj pastir', 'The Lord walks beside you'],
        ['Pregovori 3,5-6', 'Proverbs 3:5-6', 'Zaupaj z vsem srcem', 'Trust in the Lord with all your heart'],
        ['Izaija 40,28-31', 'Isaiah 40:28-31', 'Nova moč tistih, ki čakajo Gospoda', 'Renewing strength like eagles'],
        ['Izaija 41,10', 'Isaiah 41:10', 'Podpora Božje desnice', 'God’s sustaining presence'],
        ['Psalm 27,1-4', 'Psalm 27:1-4', 'Gospod je moja trdnjava', 'Seeking God’s presence without fear'],
        ['Psalm 46,2-12', 'Psalm 46:1-11', 'Bodite mirni in spoznajte Boga', 'Be still and know He is God'],
        ['Rimljanom 5,3-5', 'Romans 5:3-5', 'Vztrajnost in preizkušeno upanje', 'Patience producing character and hope'],
        ['Rimljanom 8,28-39', 'Romans 8:28-39', 'Nič nas ne more ločiti od Kristusove ljubezni', 'Nothing separates us from Christ’s love'],
        ['Rimljanom 12,1-2', 'Romans 12:1-2', 'Prenova uma in predanost', 'Living worship and renewed mind'],
        ['1 Korinčanom 10,13', '1 Corinthians 10:13', 'Izhod v skušnjavi', 'God always provides a way through'],
        ['2 Korinčanom 4,16-18', '2 Corinthians 4:16-18', 'Notranji človek se obnavlja vsak dan', 'Renewed inward spirit day by day'],
        ['2 Korinčanom 12,9-10', '2 Corinthians 12:9-10', 'Božja milost zadošča v šibkosti', 'His grace is sufficient in weakness'],
        ['Galačanom 6,9-10', 'Galatians 6:9-10', 'Ne omagajmo pri dobrem', 'Do not grow weary in doing good'],
        ['Efežanom 6,10-18', 'Ephesians 6:10-18', 'Duhovna budnost in molitev', 'Standing firm in faith and prayer'],
        ['Filipljanom 3,13-14', 'Philippians 3:13-14', 'Prizadevanje naprej proti cilju', 'Pressing forward in Christ'],
        ['Filipljanom 4,11-13', 'Philippians 4:11-13', 'Zadovoljnost in moč v Kristusu', 'Contentment and strength in Christ'],
        ['Jakob 1,2-6', 'James 1:2-6', 'Prošnja za modrost in stanovitnost', 'Asking God for wisdom'],
        ['1 Petrovo 5,6-10', '1 Peter 5:6-10', 'Ponižnost in izročitev skrbi Bogu', 'Casting anxiety on the One who cares'],
        ['Psalm 121,1-8', 'Psalm 121:1-8', 'Pomoč prihaja od Gospoda', 'Help comes from the Maker of heaven'],
        ['Hebrejcem 13,5-8', 'Hebrews 13:5-8', 'Jezus Kristus je isti včeraj, danes in vekomaj', 'Jesus Christ the same forever'],
      ];
      const item = refs[idx];
      return {
        dayNumber: idx + 1,
        referenceSl: item[0],
        referenceEn: item[1],
        focusSl: item[2],
        focusEn: item[3],
      };
    }),
  },
  {
    id: 'growth-30',
    titleSl: '30 dni duhovne rasti',
    titleEn: '30 Days of Spiritual Growth',
    descriptionSl: 'Mesečna pot poglabljanja vere, značaja in ljubezni do bližnjih.',
    descriptionEn: 'Thirty verified passages nurturing prayer, humility, wisdom, and grace.',
    durationDays: 30,
    days: Array.from({ length: 30 }, (_, idx) => {
      const seedRefs: [string, string, string, string][] = [
        ['Psalm 1,1-3', 'Psalm 1:1-3', 'Drevo ob vodnih potokih', 'Rooted in the Word of God'],
        ['Matej 5,3-10', 'Matthew 5:3-10', 'Srce blagrov', 'Humility, mercy, and purity of heart'],
        ['Miha 6,8', 'Micah 6:8', 'Delati pravično, ljubiti milost, ponižno hoditi z Bogom', 'Act justly, love mercy, walk humbly'],
        ['1 Korinčanom 13,1-13', '1 Corinthians 13:1-13', 'Pot ljubezni', 'Love that endures'],
        ['Efežanom 4,29-32', 'Ephesians 4:29-32', 'Govor, ki gradi in odpušča', 'Words that build up in grace'],
        ['Psalm 51,12-14', 'Psalm 51:10-12', 'Čisto srce in stanovitni duh', 'Create in me a clean heart, O God'],
        ['Pregovori 4,23', 'Proverbs 4:23', 'Varuj svoje srce', 'Guard your heart carefully'],
        ['Rimljanom 12,9-21', 'Romans 12:9-21', 'Iskrena ljubezen v vsakdanu', 'Overcome evil with good'],
        ['Matej 18,21-22', 'Matthew 18:21-22', 'Kultura odpuščanja', 'Practicing genuine forgiveness'],
        ['Kološanom 3,12-17', 'Colossians 3:12-17', 'Oblecite si sočutje in ponižnost', 'Clothed in compassion and peace'],
      ];
      const base = seedRefs[idx % seedRefs.length];
      return {
        dayNumber: idx + 1,
        referenceSl: base[0],
        referenceEn: base[1],
        focusSl: `${base[2]} (Dan ${idx + 1})`,
        focusEn: `${base[3]} (Day ${idx + 1})`,
      };
    }),
  },
];

export const REMINDER_MESSAGE_LIBRARY: CustomReminderMessage[] = [
  {
    id: 'msg-1',
    textEn: 'Why did you decide to change? Remember your purpose.',
    textSl: 'Zakaj si se odločil za spremembo? Spomni se svojega namena.',
    active: true,
  },
  {
    id: 'msg-2',
    textEn: "Follow God's Word, not your temporary emotions.",
    textSl: 'Sledi Božji besedi, ne trenutnim čustvom.',
    active: true,
  },
  {
    id: 'msg-3',
    textEn: 'God gave you another day. Make it meaningful.',
    textSl: 'Bog ti je podaril nov dan. Uporabi ga za nekaj vrednega.',
    active: true,
  },
  {
    id: 'msg-4',
    textEn: "Don't trade your future for temporary comfort.",
    textSl: 'Ne menjaj svoje prihodnosti za trenutek udobja.',
    active: true,
  },
  {
    id: 'msg-5',
    textEn: 'Pray first. Act with purpose.',
    textSl: 'Najprej moli. Nato ravnaj premišljeno in z namenom.',
    active: true,
  },
  {
    id: 'msg-6',
    textEn: 'Discipline is built through daily decisions.',
    textSl: 'Disciplino gradiš z majhnimi odločitvami vsak dan.',
    active: true,
  },
  {
    id: 'msg-7',
    textEn: 'You are not defined by yesterday.',
    textSl: 'Preteklost ne določa tvoje prihodnosti.',
    active: true,
  },
  {
    id: 'msg-8',
    textEn: 'Walk with Christ, even when the road is difficult.',
    textSl: 'Hodi s Kristusom tudi takrat, ko pot ni lahka.',
    active: true,
  },
  {
    id: 'msg-9',
    textEn: 'What are you grateful to God for today?',
    textSl: 'Za kaj si danes iskreno hvaležen Bogu?',
    active: true,
  },
  {
    id: 'msg-10',
    textEn: 'Be faithful in the small things.',
    textSl: 'Bodi zvest v majhnih stvareh.',
    active: true,
  },
  {
    id: 'msg-11',
    textEn: 'Your habits are shaping your future.',
    textSl: 'Tvoje vsakodnevne navade oblikujejo tvojo prihodnost.',
    active: true,
  },
  {
    id: 'msg-12',
    textEn: 'Choose patience over impulse.',
    textSl: 'Izberi potrpežljivost in mir pred impulzom.',
    active: true,
  },
  {
    id: 'msg-13',
    textEn: 'Remember the person you want to become.',
    textSl: 'Spomni se človeka, kakršen želiš postati.',
    active: true,
  },
  {
    id: 'msg-14',
    textEn: 'Another day to grow in faith.',
    textSl: 'Še ena priložnost, da rasteš v veri in značajnosti.',
    active: true,
  },
  {
    id: 'msg-15',
    textEn: 'Let your actions reflect your values.',
    textSl: 'Naj tvoja dejanja odražajo tvoje najgloblje vrednote.',
    active: true,
  },
  {
    id: 'msg-16',
    textEn: 'Renew your mind today rather than conforming to distraction.',
    textSl: 'Prenovi svoje misli in ostani zvest tistemu, kar je res dobro.',
    scriptureRef: 'Romans 12:2 / Rimljanom 12,2',
    active: true,
  },
  {
    id: 'msg-17',
    textEn: 'Strength is found in Christ, not only in your own energy.',
    textSl: 'Tvoja moč je v Kristusu, tudi ko tvoja lastna energija pade.',
    scriptureRef: 'Philippians 4:13 / Filipljanom 4,13',
    active: true,
  },
  {
    id: 'msg-18',
    textEn: 'Step forward with courage; the Lord walks beside you.',
    textSl: 'Bodi pogumen in zbran — Gospod hodi s teboj.',
    scriptureRef: 'Joshua 1:9 / Jozue 1,9',
    active: true,
  },
  {
    id: 'msg-19',
    textEn: 'Put God’s kingdom first before today’s noise.',
    textSl: 'Postavi Boga na prvo mesto pred današnjim hrupom.',
    scriptureRef: 'Matthew 6:33 / Matej 6,33',
    active: true,
  },
  {
    id: 'msg-20',
    textEn: 'Lean on God’s wisdom rather than restless overthinking.',
    textSl: 'Zaupaj Gospodu z vsem srcem in mu izroči svojo pot.',
    scriptureRef: 'Proverbs 3:5–6 / Pregovori 3,5–6',
    active: true,
  },
  {
    id: 'msg-21',
    textEn: 'Self-control and patience grow gently through the Spirit.',
    textSl: 'Mir, potrpežljivost in samokontrola rastejo v povezanosti z Bogom.',
    scriptureRef: 'Galatians 5:22–23 / Galačanom 5,22–23',
    active: true,
  },
  {
    id: 'msg-22',
    textEn: 'Pause and thank God for three concrete blessings today.',
    textSl: 'Ustavi se in se zahvali Bogu za tri konkretne blagoslove tega dne.',
    scriptureRef: '1 Thessalonians 5:18 / 1 Tesaloničanom 5,18',
    active: true,
  },
  {
    id: 'msg-23',
    textEn: 'With the Lord as your Shepherd, you need not live in fear.',
    textSl: 'Gospod je tvoj pastir — hodi mirno in z zaupanjem.',
    scriptureRef: 'Psalm 23:1 / Psalm 23,1',
    active: true,
  },
  {
    id: 'msg-24',
    textEn: 'Endurance in temptation shapes quiet integrity.',
    textSl: 'Ko vztrajaš v skušnjavi, krepiš čistost srca in zvestobo.',
    scriptureRef: 'James 1:12 / Jakob 1,12',
    active: true,
  },
  {
    id: 'msg-25',
    textEn: 'God’s mercy is genuinely new every single morning.',
    textSl: 'Božje usmiljenje je novo vsako jutro — začni z mirom.',
    scriptureRef: 'Lamentations 3:22–23 / Žalostinke 3,22–23',
    active: true,
  },
  {
    id: 'msg-26',
    textEn: 'Steward your body with gratitude, movement, and rest.',
    textSl: 'Skrbi za svoje telo s hvaležnostjo, gibanjem in dovolj počitka.',
    active: true,
  },
  {
    id: 'msg-27',
    textEn: 'One honest setback never erases months of real growth.',
    textSl: 'En padec ne izbriše vsega dobrega dela. Vstani in nadaljuj.',
    scriptureRef: 'Proverbs 24:16 / Pregovori 24,16',
    active: true,
  },
  {
    id: 'msg-28',
    textEn: 'Close the evening with prayer, forgiveness, and peace.',
    textSl: 'Pred spanjem se zahvali Gospodu in oddaj skrbi v molitvi.',
    active: true,
  },
  {
    id: 'msg-29',
    textEn: 'Serve someone silently without expecting applause.',
    textSl: 'Naredi danes nekaj dobrega v tišini brez pričakovanja pohvale.',
    active: true,
  },
  {
    id: 'msg-30',
    textEn: 'Are your daily habits leading toward the life you envisioned?',
    textSl: 'Ali te tvoje današnje navade vodijo k življenju, ki ga gradiš?',
    active: true,
  },
  {
    id: 'msg-31',
    textEn: 'Put down distractions and be fully present where God placed you.',
    textSl: 'Odloži telefon in bodi zbran tam, kamor te je Bog danes postavil.',
    active: true,
  },
  {
    id: 'msg-32',
    textEn: 'Become who God created you to be, step by step.',
    textSl: 'Postajaj to, za kar te je Bog ustvaril — korak za korakom.',
    active: true,
  },
];

export interface HabitTemplate {
  id: string;
  titleSl: string;
  titleEn: string;
  descriptionSl: string;
  descriptionEn: string;
  category: HabitCategory;
  priority: HabitPriority;
  repeatType: HabitRepeatType;
  repeatDays: number[];
  targetValue?: number;
  unit?: string;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'tpl-morning-prayer',
    titleSl: 'Jutranja molitev',
    titleEn: 'Morning Prayer',
    descriptionSl: 'Tiha izročitev dneva Jezusu Kristusu.',
    descriptionEn: 'Quietly entrust the day to Jesus Christ.',
    category: 'faith',
    priority: 'critical',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-bible-reading',
    titleSl: 'Branje Svetega pisma',
    titleEn: 'Bible Reading',
    descriptionSl: '10–15 minut premišljevanja Božje besede.',
    descriptionEn: '10–15 minutes reading and reflecting on Scripture.',
    category: 'faith',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-gratitude',
    titleSl: 'Hvaležnost Gospodu',
    titleEn: 'Gratitude Journal',
    descriptionSl: 'Zapisati vsaj en iskren razlog za hvaležnost Bogu.',
    descriptionEn: 'Record genuine gratitude to God.',
    category: 'mindset',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-fitness',
    titleSl: 'Fitnes / Trening moči',
    titleEn: 'Gym / Strength Training',
    descriptionSl: 'Odgovorna skrb za telo in energijo.',
    descriptionEn: 'Steward your body with strength work.',
    category: 'fitness',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-walk',
    titleSl: 'Sprehod na svežem zraku',
    titleEn: 'Outdoor Walk',
    descriptionSl: 'Vsaj 30 minut hoje brez zaslonov.',
    descriptionEn: '30-minute walk for clarity and health.',
    category: 'fitness',
    priority: 'medium',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    targetValue: 8000,
    unit: 'korakov',
  },
  {
    id: 'tpl-study',
    titleSl: 'Učenje in osebni razvoj',
    titleEn: 'Study & Skill Building',
    descriptionSl: 'Osredotočeno delo na znanju ali projektu.',
    descriptionEn: 'Focused work on learning and calling.',
    category: 'study',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'tpl-sleep',
    titleSl: 'Dovolj spanja (7–8 ur)',
    titleEn: 'Restorative Sleep (7–8h)',
    descriptionSl: 'Odhod v posteljo ob stalni uri brez telefona.',
    descriptionEn: 'Consistent bedtime without screen fatigue.',
    category: 'recovery',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    targetValue: 7.5,
    unit: 'ur',
  },
  {
    id: 'tpl-nutrition',
    titleSl: 'Zdrava in zmerna prehrana',
    titleEn: 'Nourishing Meals',
    descriptionSl: 'Polnovredni obroki brez prenajedanja.',
    descriptionEn: 'Balanced, mindful eating aligned with goals.',
    category: 'nutrition',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-water',
    titleSl: 'Več vode čez dan',
    titleEn: 'Drink Enough Water',
    descriptionSl: 'Vsaj 2,5–3 litre čiste vode.',
    descriptionEn: 'At least 2.5–3 liters of water.',
    category: 'nutrition',
    priority: 'medium',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    targetValue: 2.5,
    unit: 'L',
  },
  {
    id: 'tpl-evening-prayer',
    titleSl: 'Večerna molitev in pregled dneva',
    titleEn: 'Evening Prayer & Examen',
    descriptionSl: 'Zahvala Bogu, kesanje in mir pred spanjem.',
    descriptionEn: 'Evening gratitude, reflection, and prayer.',
    category: 'faith',
    priority: 'critical',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-screen-discipline',
    titleSl: 'Manj nepotrebnega časa na telefonu',
    titleEn: 'Reduced Mindless Screen Time',
    descriptionSl: 'Brez brezciljnega brskanja po omrežjih.',
    descriptionEn: 'Avoid mindless scrolling and digital noise.',
    category: 'discipline',
    priority: 'high',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'tpl-journal',
    titleSl: 'Osebni dnevnik',
    titleEn: 'Personal Reflection Journal',
    descriptionSl: 'Kratek zapis misli, hvaležnosti in naukov dneva.',
    descriptionEn: 'Brief evening thoughts, lessons, and gratitude.',
    category: 'mindset',
    priority: 'medium',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
  },
];
