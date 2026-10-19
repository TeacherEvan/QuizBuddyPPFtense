const easyQuestions = [
  {
    sentence: 'I ___ to school every day.',
    options: ['walk', 'walked', 'will walk'],
    correct: 'walk'
  },
  {
    sentence: 'She ___ dinner last night.',
    options: ['cooks', 'cooked', 'will cook'],
    correct: 'cooked'
  },
  {
    sentence: 'They ___ a movie tomorrow.',
    options: ['watch', 'watched', 'will watch'],
    correct: 'will watch'
  },
  {
    sentence: 'He ___ football on Sundays.',
    options: ['plays', 'played', 'will play'],
    correct: 'plays'
  },
  {
    sentence: 'We ___ our homework yesterday.',
    options: ['finish', 'finished', 'will finish'],
    correct: 'finished'
  },
  {
    sentence: 'I ___ my grandma next weekend.',
    options: ['visit', 'visited', 'will visit'],
    correct: 'will visit'
  },
  {
    sentence: 'The cat ___ on the sofa now.',
    options: ['sleeps', 'slept', 'will sleep'],
    correct: 'sleeps'
  },
  {
    sentence: 'My brother ___ late this morning.',
    options: ['arrives', 'arrived', 'will arrive'],
    correct: 'arrived'
  },
  {
    sentence: 'The bus ___ at 8 a.m. tomorrow.',
    options: ['arrives', 'arrived', 'will arrive'],
    correct: 'will arrive'
  },
  {
    sentence: 'You ___ very fast in races.',
    options: ['run', 'ran', 'will run'],
    correct: 'run'
  },
  {
    sentence: 'I ___ my keys last week.',
    options: ['lose', 'lost', 'will lose'],
    correct: 'lost'
  },
  {
    sentence: 'She ___ a new book next month.',
    options: ['buys', 'bought', 'will buy'],
    correct: 'will buy'
  },
  {
    sentence: 'We ___ lunch at noon.',
    options: ['eat', 'ate', 'will eat'],
    correct: 'eat'
  },
  {
    sentence: 'They ___ basketball after class yesterday.',
    options: ['play', 'played', 'will play'],
    correct: 'played'
  },
  {
    sentence: 'He ___ the report tonight.',
    options: ['writes', 'wrote', 'will write'],
    correct: 'will write'
  },
  {
    sentence: 'The sun ___ in the east.',
    options: ['rises', 'rose', 'will rise'],
    correct: 'rises'
  },
  {
    sentence: 'I ___ my friend two days ago.',
    options: ['call', 'called', 'will call'],
    correct: 'called'
  },
  {
    sentence: 'We ___ to the beach next summer.',
    options: ['go', 'went', 'will go'],
    correct: 'will go'
  },
  {
    sentence: 'She ___ tea every morning.',
    options: ['drinks', 'drank', 'will drink'],
    correct: 'drinks'
  },
  {
    sentence: 'They ___ the room before lunch.',
    options: ['clean', 'cleaned', 'will clean'],
    correct: 'cleaned'
  },
  {
    sentence: 'I ___ your message later.',
    options: ['answer', 'answered', 'will answer'],
    correct: 'will answer'
  },
  {
    sentence: 'He ___ his bike to school.',
    options: ['rides', 'rode', 'will ride'],
    correct: 'rides'
  },
  {
    sentence: 'The baby ___ all night yesterday.',
    options: ['cry', 'cried', 'will cry'],
    correct: 'cried'
  },
  {
    sentence: 'You ___ this game again tomorrow.',
    options: ['play', 'played', 'will play'],
    correct: 'will play'
  },
  {
    sentence: 'We ___ English in class.',
    options: ['study', 'studied', 'will study'],
    correct: 'study'
  },
  {
    sentence: 'I ___ early for the meeting yesterday.',
    options: ['arrive', 'arrived', 'will arrive'],
    correct: 'arrived'
  },
  {
    sentence: 'She ___ her cousin next Friday.',
    options: ['meets', 'met', 'will meet'],
    correct: 'will meet'
  },
  {
    sentence: 'They ___ music in the evening.',
    options: ['listen to', 'listened to', 'will listen to'],
    correct: 'listen to'
  },
  {
    sentence: 'He ___ a cake for the party last weekend.',
    options: ['bakes', 'baked', 'will bake'],
    correct: 'baked'
  },
  {
    sentence: 'I ___ the window before it rains.',
    options: ['close', 'closed', 'will close'],
    correct: 'will close'
  },
  {
    sentence: 'The train ___ the station at 9 a.m. every day.',
    options: ['leaves', 'left', 'will leave'],
    correct: 'leaves'
  },
  {
    sentence: 'My sister ___ a beautiful picture yesterday.',
    options: ['paints', 'painted', 'will paint'],
    correct: 'painted'
  },
  {
    sentence: 'We ___ the museum next Tuesday.',
    options: ['tour', 'toured', 'will tour'],
    correct: 'will tour'
  },
  {
    sentence: 'Dogs ___ when strangers knock on the door.',
    options: ['bark', 'barked', 'will bark'],
    correct: 'bark'
  },
  {
    sentence: 'He ___ his jacket at the cinema last night.',
    options: ['forgets', 'forgot', 'will forget'],
    correct: 'forgot'
  },
  {
    sentence: 'I ___ you carry those heavy boxes tomorrow.',
    options: ['help', 'helped', 'will help'],
    correct: 'will help'
  },
  {
    sentence: 'Our teacher ___ clear examples in every lesson.',
    options: ['gives', 'gave', 'will give'],
    correct: 'gives'
  },
  {
    sentence: 'The children ___ a sandcastle on the beach last Sunday.',
    options: ['build', 'built', 'will build'],
    correct: 'built'
  },
  {
    sentence: 'She ___ the piano at the concert next week.',
    options: ['plays', 'played', 'will play'],
    correct: 'will play'
  },
  {
    sentence: 'Water ___ at zero degrees Celsius.',
    options: ['freezes', 'froze', 'will freeze'],
    correct: 'freezes'
  }
];

const mediumQuestions = [
  {
    sentence: 'I ___ my project right now.',
    options: ['am finishing', 'finished', 'will finish'],
    correct: 'am finishing'
  },
  {
    sentence: 'She ___ when I called her.',
    options: ['is cooking', 'was cooking', 'will be cooking'],
    correct: 'was cooking'
  },
  {
    sentence: 'They ___ by this time tomorrow.',
    options: ['have traveled', 'had traveled', 'will be traveling'],
    correct: 'will be traveling'
  },
  {
    sentence: 'We ___ this chapter already.',
    options: ['have read', 'had read', 'will read'],
    correct: 'have read'
  },
  {
    sentence: 'He ___ the email before noon yesterday.',
    options: ['has sent', 'had sent', 'will send'],
    correct: 'had sent'
  },
  {
    sentence: 'I ___ this machine for two years by next June.',
    options: ['have used', 'had used', 'will have used'],
    correct: 'will have used'
  },
  {
    sentence: 'The kids ___ in the yard at the moment.',
    options: ['are playing', 'were playing', 'will play'],
    correct: 'are playing'
  },
  {
    sentence: 'We ___ for the bus when it started raining.',
    options: ['wait', 'were waiting', 'will wait'],
    correct: 'were waiting'
  },
  {
    sentence: 'She ___ her homework before dinner tonight.',
    options: ['has finished', 'had finished', 'will have finished'],
    correct: 'will have finished'
  },
  {
    sentence: 'I ___ this show since January.',
    options: ['have watched', 'watched', 'will watch'],
    correct: 'have watched'
  },
  {
    sentence: 'They ___ by the time we arrived.',
    options: ['have left', 'had left', 'will leave'],
    correct: 'had left'
  },
  {
    sentence: 'At 10 p.m., we ___ to the airport.',
    options: ['drive', 'drove', 'will be driving'],
    correct: 'will be driving'
  },
  {
    sentence: 'He ___ in London for three months now.',
    options: ['has been living', 'had been living', 'will live'],
    correct: 'has been living'
  },
  {
    sentence: 'I ___ all afternoon before the power cut.',
    options: ['have worked', 'had been working', 'will work'],
    correct: 'had been working'
  },
  {
    sentence: 'By next year, they ___ this bridge for a decade.',
    options: ['have built', 'had built', 'will have been building'],
    correct: 'will have been building'
  },
  {
    sentence: 'She ___ to improve her writing recently.',
    options: ['is trying', 'was trying', 'will try'],
    correct: 'is trying'
  },
  {
    sentence: 'The team ___ hard all week before the final.',
    options: ['has practiced', 'had been practicing', 'will practice'],
    correct: 'had been practicing'
  },
  {
    sentence: 'Tomorrow at noon, I ___ with the principal.',
    options: ['meet', 'met', 'will be meeting'],
    correct: 'will be meeting'
  },
  {
    sentence: 'We ___ this app since last semester.',
    options: ['have been using', 'had been using', 'will use'],
    correct: 'have been using'
  },
  {
    sentence: 'Before last Friday, she ___ to that museum twice.',
    options: ['has gone', 'had gone', 'will go'],
    correct: 'had gone'
  },
  {
    sentence: 'Look! The chef ___ the sauce right now.',
    options: ['is tasting', 'was tasting', 'will taste'],
    correct: 'is tasting'
  },
  {
    sentence: 'The lights went out while we ___ dinner.',
    options: ['are eating', 'were eating', 'will be eating'],
    correct: 'were eating'
  },
  {
    sentence: 'This time next week, I ___ on a tropical island.',
    options: ['relax', 'relaxed', 'will be relaxing'],
    correct: 'will be relaxing'
  },
  {
    sentence: 'She ___ three marathons so far this year.',
    options: ['has completed', 'had completed', 'will complete'],
    correct: 'has completed'
  },
  {
    sentence: 'The film ___ before we reached the theater.',
    options: ['has started', 'had started', 'will have started'],
    correct: 'had started'
  },
  {
    sentence: 'By Friday afternoon, the crew ___ the roof.',
    options: ['has repaired', 'had repaired', 'will have repaired'],
    correct: 'will have repaired'
  },
  {
    sentence: 'He ___ the guitar since he was ten years old.',
    options: ['has been playing', 'had been playing', 'will play'],
    correct: 'has been playing'
  },
  {
    sentence: 'The roads were icy because it ___ all night.',
    options: ['has been snowing', 'had been snowing', 'will be snowing'],
    correct: 'had been snowing'
  },
  {
    sentence: 'They ___ the laboratory equipment at the moment.',
    options: ['are testing', 'were testing', 'will test'],
    correct: 'are testing'
  },
  {
    sentence: 'By midnight, the bakery ___ fresh bread for six hours.',
    options: ['has baked', 'had baked', 'will have been baking'],
    correct: 'will have been baking'
  }
];

const advanceQuestions = [
  {
    sentence: 'By 5 p.m., I ___ for six hours.',
    options: ['have been teaching', 'had been teaching', 'will have been teaching'],
    correct: 'will have been teaching'
  },
  {
    sentence: 'She ___ for two hours before the guests arrived.',
    options: ['has been preparing', 'had been preparing', 'will have prepared'],
    correct: 'had been preparing'
  },
  {
    sentence: 'If he studies tonight, he ___ the quiz tomorrow.',
    options: ['passes', 'passed', 'will pass'],
    correct: 'will pass'
  },
  {
    sentence: 'If they had left earlier, they ___ the train.',
    options: ['catch', 'would have caught', 'will catch'],
    correct: 'would have caught'
  },
  {
    sentence: 'I ___ this policy for years, so I can explain it clearly.',
    options: ['have been reviewing', 'had reviewed', 'will review'],
    correct: 'have been reviewing'
  },
  {
    sentence: 'By next winter, we ___ this curriculum for three years.',
    options: ['have used', 'had used', 'will have been using'],
    correct: 'will have been using'
  },
  {
    sentence: 'If she had known the answer, she ___ us immediately.',
    options: ['tells', 'would have told', 'will tell'],
    correct: 'would have told'
  },
  {
    sentence: 'They ___ negotiations since dawn, and they still continue.',
    options: ['have been holding', 'had been holding', 'will hold'],
    correct: 'have been holding'
  },
  {
    sentence: 'If I were leading the team, I ___ a different strategy.',
    options: ['choose', 'chose', 'would choose'],
    correct: 'would choose'
  },
  {
    sentence: 'By the deadline, the scientists ___ data continuously for months.',
    options: ['have collected', 'had collected', 'will have been collecting'],
    correct: 'will have been collecting'
  },
  {
    sentence: 'If you heat ice above zero degrees, it ___ into water.',
    options: ['melts', 'melted', 'would melt'],
    correct: 'melts'
  },
  {
    sentence: 'If I had more free time, I ___ a third language.',
    options: ['learn', 'would learn', 'will learn'],
    correct: 'would learn'
  },
  {
    sentence: 'Had they checked the forecast, they ___ umbrellas.',
    options: ['bring', 'brought', 'would have brought'],
    correct: 'would have brought'
  },
  {
    sentence: 'By the time the train finally arrived, we ___ on the platform for an hour.',
    options: ['have been waiting', 'had been waiting', 'will have been waiting'],
    correct: 'had been waiting'
  },
  {
    sentence: 'By 2030, astronomers ___ that exoplanet for twenty years.',
    options: ['have observed', 'had observed', 'will have been observing'],
    correct: 'will have been observing'
  },
  {
    sentence: 'The orchestra ___ all morning, and the hall still echoes with music.',
    options: ['has been rehearsing', 'had been rehearsing', 'will rehearse'],
    correct: 'has been rehearsing'
  },
  {
    sentence: 'If the flight is delayed tonight, we ___ our connecting train.',
    options: ['miss', 'missed', 'will miss'],
    correct: 'will miss'
  },
  {
    sentence: 'She looked exhausted because she ___ code since sunrise.',
    options: ['has been debugging', 'had been debugging', 'will be debugging'],
    correct: 'had been debugging'
  },
  {
    sentence: 'If he had saved his progress earlier, he ___ his work.',
    options: ['does not lose', 'will not lose', 'would not have lost'],
    correct: 'would not have lost'
  },
  {
    sentence: 'By the end of this shift, the nurses ___ for twelve hours straight.',
    options: ['have worked', 'had been working', 'will have been working'],
    correct: 'will have been working'
  }
];

// Each array already encodes its level; inject it once at export time.
// The dead `id` field has been removed — no consumer reads it.
export const QUESTIONS = [
  ...easyQuestions.map((q) => ({ level: 'easy', ...q })),
  ...mediumQuestions.map((q) => ({ level: 'medium', ...q })),
  ...advanceQuestions.map((q) => ({ level: 'advance', ...q }))
];
