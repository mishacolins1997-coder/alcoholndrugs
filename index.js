/* Alcohol n Drugs — расширение для SillyTavern
 * Отслеживает употребление в ролевой, развивает зависимость, ломку, лечение,
 * последствия, рынок/дилеров/долги. Всё — игровая механика, без реальных инструкций.
 */
import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types, setExtensionPrompt } from '../../../../script.js';

const MOD = 'alcohol_n_drugs';
const KEY = 'alcohol_n_drugs_prompt';
const DEFAULTS = {
    enabled: true, autoDetect: true, events: true, toasts: true, autoPay: true,
    difficulty: 1, depth: 1, ticks: 1, currency: '$', startMoney: 500, minorSafe: true,
    lang: (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en',
};

/* ───────────────────────── Локализация / Localization ───────────────────────── */
const I18N = {
    ru: {
        tab_chars: '👤 Персонажи', tab_market: '🛒 Рынок', tab_treat: '🏥 Лечение', tab_log: '📜 Журнал',
        new_char: 'Новый персонаж', health: '❤ Здоровье', heat: '🚔 Розыск', debt: 'Долг', repay: 'Погасить',
        dependence: 'Зависимость', tolerance: 'Толерантность',
        tag_high: '🌀 под действием', tag_wd: '🤒 ломка: {l}', tag_treat: '🏥 лечение {p}%', tag_remit: '✨ ремиссия', tag_stock: '🎒 запас: {n}',
        wd_mild: 'слабая', wd_moderate: 'средняя', wd_severe: 'сильная',
        use: 'Употребить', use_stock: 'Употребить (из запаса)',
        prices: 'Цены сегодня', sellers: 'Продавцы', dealer_stats: 'риск {r}% · надёжность {q}%', per_unit: '/ед.', credit: 'В долг', del: 'Удалить',
        sell_h: 'Продажа ({n} — дилер)', no_stock: 'Нет запасов для продажи. Сначала купите товар.', stock_opt: 'запас {n}', sell: 'Продать',
        rep_note: 'Репутация дилера: {r}. Продажа запрещённого повышает розыск.',
        add_dealer: 'Добавить дилера', d_name: 'Имя / прозвище', d_desc: 'Описание', d_markup: 'Наценка ×', d_risk: 'Риск %', add: 'Добавить',
        danger_note: '⚠ Резкий отказ опасен для здоровья без врачей.', progress: 'Прогресс', stop: 'Прервать лечение', free: 'бесплатно', turns: 'ходов', start: 'Начать',
        no_need: 'У {n} пока нет зависимости, требующей лечения.', log_empty: 'Журнал пуст.',
        w_nomoney: 'Нет денег', w_notenough: 'Не хватает денег', w_scam: '{d} обманул(а): получено {g} из {q}', w_need: 'Нужны имя и хотя бы одно вещество', w_nostock: 'Недостаточно запаса',
        reset_confirm: 'Сбросить все данные Alcohol n Drugs в этом чате?', reset_done: 'Данные чата сброшены',
        auto: ' (из текста)',
        l_credit: '{n} взял(а) {s} в долг ({p}{c}).',
        l_use: '{n}: {i} {s} ×{u}{a} → зависимость {d}% ({st}).',
        l_relapse: '{n}: СРЫВ во время лечения ({s}), курс затянулся.',
        l_od: '{n}: ПЕРЕДОЗИРОВКА ({s})!',
        l_finish: '{n}: курс «{t}» завершён. Остаточная зависимость: {d}%.',
        l_trouble: '{n}: проблемы из-за {s} (опоздание, прогул).', l_argument: '{n}: ссора из-за зависимости.', l_waste: '{n}: потрачено лишнее ({m}{c}).',
        l_blackout: '{n}: провал в памяти.', l_interv: '{n}: близкие предлагают лечение.', l_ill: '{n}: плохое самочувствие.',
        l_market: 'Рынок: дефицит {s}, цены выросли.',
        l_seizure: '{n}: судорожный приступ при резком отказе ({s}).',
        l_raid: '{n}: облава/задержание! Штраф {f}{c}, изъято {k} ед.',
        l_debt: '{n}: {cr} требует вернуть долг ({d}{c}).',
        l_paid: '{n}: погасил долг на {p}{c}.',
        l_scam: '{n}: {d} недодал(а) товар (получено {g} из {q}).',
        l_bought: '{n}: купил {g}× {s} у «{d}» за {t}{c}{cr}.', l_credit_sfx: ' (в долг)',
        l_sold: '{n}: продал {q}× {s} за {i}{c}.',
        l_tstart: '{n}: начал лечение «{t}» ({s}).', l_tstop: '{n}: прервал лечение ({s}).',
        s_enabled: 'Включено', s_auto: 'Автоопределение употребления в тексте', s_events: 'Случайные события (срывы, облавы, долги…)',
        s_autopay: 'Автоматически списывать деньги за употребление', s_toasts: 'Уведомления', s_minor: 'Запретить сцены употребления несовершеннолетними',
        s_diff: 'Сложность (скорость зависимости)', d_easy: 'Лёгкая ×0.5', d_norm: 'Обычная ×1', d_hard: 'Жёсткая ×1.5', d_brutal: 'Беспощадная ×2',
        s_depth: 'Глубина вставки промпта', s_ticks: 'Ходов за сообщение', s_cur: 'Валюта', s_start: 'Стартовые деньги',
        s_lang: 'Язык интерфейса / Interface language', s_open: 'Открыть панель', s_reset: 'Сбросить данные чата',
    },
    en: {
        tab_chars: '👤 Characters', tab_market: '🛒 Market', tab_treat: '🏥 Treatment', tab_log: '📜 Log',
        new_char: 'New character', health: '❤ Health', heat: '🚔 Wanted', debt: 'Debt', repay: 'Repay',
        dependence: 'Dependence', tolerance: 'Tolerance',
        tag_high: '🌀 under the influence', tag_wd: '🤒 withdrawal: {l}', tag_treat: '🏥 treatment {p}%', tag_remit: '✨ remission', tag_stock: '🎒 stock: {n}',
        wd_mild: 'mild', wd_moderate: 'moderate', wd_severe: 'severe',
        use: 'Use', use_stock: 'Use (from stock)',
        prices: "Today's prices", sellers: 'Sellers', dealer_stats: 'risk {r}% · reliability {q}%', per_unit: '/unit', credit: 'On credit', del: 'Delete',
        sell_h: 'Selling ({n} as dealer)', no_stock: 'Nothing to sell. Buy some stock first.', stock_opt: 'stock {n}', sell: 'Sell',
        rep_note: 'Dealer reputation: {r}. Selling illegal goods raises your wanted level.',
        add_dealer: 'Add dealer', d_name: 'Name / alias', d_desc: 'Description', d_markup: 'Markup ×', d_risk: 'Risk %', add: 'Add',
        danger_note: '⚠ Quitting abruptly is dangerous without medical supervision.', progress: 'Progress', stop: 'Stop treatment', free: 'free', turns: 'turns', start: 'Start',
        no_need: '{n} has no dependence that needs treatment yet.', log_empty: 'The log is empty.',
        w_nomoney: 'No money', w_notenough: 'Not enough money', w_scam: '{d} cheated you: received {g} of {q}', w_need: 'A name and at least one substance are required', w_nostock: 'Not enough stock',
        reset_confirm: 'Reset all Alcohol n Drugs data in this chat?', reset_done: 'Chat data has been reset',
        auto: ' (from text)',
        l_credit: '{n} took {s} on credit ({p}{c}).',
        l_use: '{n}: {i} {s} ×{u}{a} → dependence {d}% ({st}).',
        l_relapse: '{n}: RELAPSE during treatment ({s}); the course was extended.',
        l_od: '{n}: OVERDOSE ({s})!',
        l_finish: '{n}: finished "{t}". Remaining dependence: {d}%.',
        l_trouble: '{n}: trouble caused by {s} (late, skipped duties).', l_argument: '{n}: argument over the dependence.', l_waste: '{n}: wasted extra money ({m}{c}).',
        l_blackout: '{n}: memory blackout.', l_interv: '{n}: loved ones suggest treatment.', l_ill: '{n}: feeling physically ill.',
        l_market: 'Market: shortage of {s}, prices went up.',
        l_seizure: '{n}: seizure from abrupt withdrawal ({s}).',
        l_raid: '{n}: raid/arrest! Fine {f}{c}, {k} unit(s) confiscated.',
        l_debt: '{n}: {cr} demands repayment ({d}{c}).',
        l_paid: '{n}: repaid {p}{c} of debt.',
        l_scam: '{n}: {d} shorted the order (received {g} of {q}).',
        l_bought: '{n}: bought {g}× {s} from "{d}" for {t}{c}{cr}.', l_credit_sfx: ' (on credit)',
        l_sold: '{n}: sold {q}× {s} for {i}{c}.',
        l_tstart: '{n}: started "{t}" ({s}).', l_tstop: '{n}: stopped treatment ({s}).',
        s_enabled: 'Enabled', s_auto: 'Auto-detect substance use in messages', s_events: 'Random events (relapses, raids, debts…)',
        s_autopay: 'Automatically charge money for use', s_toasts: 'Notifications', s_minor: 'Forbid substance-use scenes with minors',
        s_diff: 'Difficulty (addiction speed)', d_easy: 'Easy ×0.5', d_norm: 'Normal ×1', d_hard: 'Hard ×1.5', d_brutal: 'Brutal ×2',
        s_depth: 'Prompt insertion depth', s_ticks: 'Turns per message', s_cur: 'Currency', s_start: 'Starting money',
        s_lang: 'Язык интерфейса / Interface language', s_open: 'Open panel', s_reset: 'Reset chat data',
    },
};
const lang = () => (I18N[cfg().lang] ? cfg().lang : 'en');
const t = (k, p = {}) => String(I18N[lang()][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => (p[x] ?? ''));

/* ───────────────────────── Каталог веществ ───────────────────────── */
const SUBS = {
    nicotine: {
        name: 'Никотин (курение)', short: 'Курение', icon: '🚬', legal: true, price: 8,
        addict: 6, tol: 2, dur: 3, grace: 6, wdLen: 20, wdSev: 0.5, decay: 0.25, health: 0.04, od: 0, danger: false,
        high: 'лёгкая расслабленность, запах табака',
        wd: 'раздражительность, тяга закурить, тревога, трудно сосредоточиться',
        cons: [
            'курит всё чаще, привязан к перекурам, появился кашель, запах табака на одежде',
            'закуривает в стрессе и после еды, срывается без сигареты, тратит на это деньги, утренний кашель',
            'курит почти постоянно, одышка, хриплый кашель, нервничает и злится без сигарет, здоровье страдает',
        ],
        treat: ['self', 'nrt', 'therapy', 'group'],
        kw: ['lit\\s+(?:a|his|her|another)\\s+(?:cigarette|cig|smoke)', 'cigarettes?\\b', 'vap(?:e|es|ed|ing)\\b', 'nicotine', 'tobacco',
            'smokes\\b', 'smoking\\b', 'smoked\\b', 'drags?\\s+on', 'закур', 'курит', 'курил', 'курю', 'куришь', 'сигарет', 'вейп', 'затянул', 'затяжк', 'табак'],
    },
    alcohol: {
        name: 'Алкоголь', short: 'Алкоголь', icon: '🍺', legal: true, price: 12,
        addict: 4, tol: 2.5, dur: 5, grace: 8, wdLen: 30, wdSev: 0.9, decay: 0.2, health: 0.06, od: 0.015, danger: true,
        high: 'заплетающийся язык, сниженные тормоза, эйфория или агрессия, нарушена координация',
        wd: 'дрожь в руках, потливость, тошнота, тревога, бессонница, сильная тяга выпить',
        cons: [
            'пьёт «для расслабления» всё чаще, похмелья, оправдывает каждую выпивку',
            'пьёт по утрам и в одиночку, прогулы, прячет бутылки, провалы в памяти, ссоры с близкими',
            'не функционирует без алкоголя, тремор, проблемы с печенью, потеря работы и отношений, риск судорог при резком отказе',
        ],
        treat: ['self', 'detox', 'meds', 'group', 'rehab'],
        kw: ['drinks?\\s+(?:a\\s+|the\\s+|some\\s+|another\\s+)?(?:whisk(?:e)?y|beer|wine|vodka|alcohol|shot|glass|bottle)', 'drank\\b', 'drunk\\b', 'whisk(?:e)?y', 'vodka', 'beers?\\b', 'wine\\b', 'tequila',
            'rum\\b', 'gin\\b', 'cognac', 'brandy', 'champagne', 'shots?\\s+of', 'booze', 'alcohol', 'hangover', 'tipsy', 'downed',
            'пьёт', 'пьет', 'пью', 'пьют', 'пил', 'выпил', 'выпить', 'выпьем', 'алкогол', 'водк', 'виски', 'пиво', 'пива(?![а-яё])', 'вино(?![а-яё])', 'коньяк', 'текил', 'шампанск', 'самогон', 'рюмк', 'стопк', 'пьян', 'напил', 'похмел'],
    },
    cannabis: {
        name: 'Каннабис', short: 'Каннабис', icon: '🌿', legal: false, price: 20,
        addict: 3, tol: 1.5, dur: 5, grace: 10, wdLen: 20, wdSev: 0.3, decay: 0.15, health: 0.02, od: 0, danger: false,
        high: 'расслабленность, замедленная реакция, красные глаза, голод, смешливость или паранойя',
        wd: 'раздражительность, плохой сон, пониженный аппетит, скука и тяга',
        cons: [
            'курит почти каждые выходные, вялость, забывчивость',
            'курит ежедневно, мотивация падает, проблемы с учёбой/работой, замыкается в себе',
            'не может расслабиться или уснуть без травки, апатия, тревожность, паранойя',
        ],
        treat: ['self', 'therapy', 'group', 'rehab'],
        kw: ['weed\\b', 'marijuana', 'cannabis', 'bongs?\\b', '(?:smokes?|rolls?|lights?)\\s+(?:a\\s+|the\\s+)?joint', 'a\\s+joint', 'edibles?\\b', 'косяк', 'джойнт', 'марихуан', 'каннабис', 'бонг', 'гашиш', 'травку', 'траву\\s+(?:курит|кури)'],
    },
    stimulants: {
        name: 'Стимуляторы', short: 'Стимуляторы', icon: '⚡', legal: false, price: 60,
        addict: 9, tol: 4, dur: 6, grace: 6, wdLen: 25, wdSev: 0.8, decay: 0.15, health: 0.09, od: 0.04, danger: false,
        high: 'прилив энергии, ускоренная речь, расширенные зрачки, бессонница, самоуверенность, нервозность',
        wd: 'сильная усталость, подавленность, апатия, тревога, жадная тяга, нарушенный сон',
        cons: [
            'принимает «для бодрости», срывы настроения, плохой сон и аппетит',
            'тратит большие суммы, параноидален, худеет, перепады «эйфория — упадок», врёт близким',
            'навязчивая тяга, психозоподобные состояния, проблемы с сердцем, долги, изоляция, высокий риск передозировки',
        ],
        treat: ['self', 'therapy', 'group', 'rehab'],
        kw: ['cocaine', 'coke\\b', 'snort(?:s|ed)?\\s+(?:a\\s+)?(?:line|coke|some)', 'lines?\\s+of\\s+(?:coke|cocaine)', 'amphetamine', 'meth\\b', 'methamphetamine', 'adderall', 'stimulants?\\b',
            'кокаин', 'кокс(?![а-яё])', 'нюхнул', 'нюхает', 'амфетамин', 'метамфетамин', 'мет(?![а-яё])', 'стимулятор', 'аддерал'],
    },
    opioids: {
        name: 'Опиоиды', short: 'Опиоиды', icon: '💉', legal: false, price: 70,
        addict: 12, tol: 5, dur: 8, grace: 6, wdLen: 35, wdSev: 1, decay: 0.1, health: 0.08, od: 0.08, danger: false,
        high: 'сонливость, «ватное» блаженство, суженные зрачки, замедленная речь, клюёт носом',
        wd: 'ломота в теле, озноб и пот, тошнота, мучительная тяга, бессонница, паника',
        cons: [
            'принимает «чтобы заглушить боль», сонливость, постоянные запоры',
            'доза растёт, живёт от дозы до дозы, обманывает близких, деньги уходят на вещество',
            'вся жизнь крутится вокруг вещества, тяжёлая ломка без дозы, высокий риск передозировки, долги и криминал',
        ],
        treat: ['self', 'detox', 'subst', 'group', 'rehab'],
        kw: ['heroin', 'opioids?\\b', 'opiates?\\b', 'fentanyl', 'morphine', 'oxycodone', 'shoots?\\s+up', 'shot\\s+up', 'героин', 'опиат', 'опиоид', 'фентанил', 'морфин', 'оксикодон', 'уколол', 'вколол', 'вмазал', 'подсел на'],
    },
    sedatives: {
        name: 'Седативные / бензо', short: 'Седативные', icon: '💊', legal: false, price: 30,
        addict: 6, tol: 3, dur: 6, grace: 10, wdLen: 30, wdSev: 0.9, decay: 0.1, health: 0.04, od: 0.03, danger: true,
        high: 'заторможенность, спутанная речь, сонливость, притупленные эмоции',
        wd: 'сильная тревога, паника, дрожь, бессонница, риск судорог',
        cons: [
            'пьёт таблетки «чтобы уснуть/успокоиться» всё чаще',
            'без таблеток тревога и бессонница, повышает дозу, провалы в памяти, вялость',
            'не может жить без препарата, спутанность, падения, опасная ломка при резком отказе, риск передозировки в сочетании с алкоголем',
        ],
        treat: ['taper', 'therapy', 'group', 'rehab', 'self'],
        kw: ['xanax', 'benzos?\\b', 'valium', 'diazepam', 'sedatives?\\b', 'sleeping\\s+pills?', 'tranquili[sz]ers?', 'ксанакс', 'бензо', 'диазепам', 'транквилизатор', 'снотворн', 'феназепам', 'седатив'],
    },
    psychedelics: {
        name: 'Психоделики', short: 'Психоделики', icon: '🍄', legal: false, price: 40,
        addict: 1.5, tol: 3, dur: 12, grace: 0, wdLen: 0, wdSev: 0, decay: 0.5, health: 0.01, od: 0.01, danger: false,
        high: 'изменённое восприятие, галлюцинации, сильные эмоции, искажённое чувство времени',
        wd: 'нет выраженной физической ломки',
        cons: [
            'ищет «трипы» как способ сбежать от реальности',
            'дереализация, тревога после трипов, трудно возвращаться к обычной жизни',
            'устойчивые нарушения восприятия, паранойя, трудно отличать реальность от видений',
        ],
        treat: ['therapy', 'self'],
        kw: ['lsd\\b', 'acid\\s+trip', 'magic\\s+mushrooms?', 'shrooms?\\b', 'psilocybin', 'ayahuasca', 'mdma', 'ecstasy', 'molly\\b', 'лсд', 'псилоцибин', 'мдма', 'экстази', 'аяуаска', 'волшебные грибы', 'грибочки'],
    },
};
const IDS = Object.keys(SUBS);
for (const id of IDS) {
    const s = SUBS[id];
    const body = s.kw.join('|');
    s.re = new RegExp('(?<![a-zа-яё])(?:' + body + ')', 'i');
    s.reG = new RegExp('(?<![a-zа-яё])(?:' + body + ')', 'gi');
}
const NEG = /(?:^|[^a-zа-яё])(?:не|нет|без|никогда|ни|бросил[а-яё]*|отказ[а-яё]*|never|no|not|don'?t|didn'?t|won'?t|can'?t|quit|stopped|refus[a-z]*)(?![a-zа-яё])/i;
const STAGES_L = {
    ru: ['Чист', 'Пробует', 'Привычка', 'Зависимость', 'Тяжёлая зависимость'],
    en: ['Clean', 'Experimenting', 'Habit', 'Dependent', 'Severe addiction'],
};
const stl = (i) => STAGES_L[lang()][i];

const EN = {
    nicotine: { name: 'Nicotine (smoking)', short: 'Smoking', high: 'mild relaxation, smell of tobacco',
        wd: 'irritability, urge to smoke, anxiety, trouble concentrating',
        cons: ['smokes more and more often, tied to smoke breaks, a cough has appeared, tobacco smell on clothes',
            'lights up when stressed and after meals, gets edgy without cigarettes, spends money on it, morning cough',
            'smokes almost constantly, short of breath, hoarse cough, nervous and angry without cigarettes, health suffering'] },
    alcohol: { name: 'Alcohol', short: 'Alcohol', high: 'slurred speech, lowered inhibitions, euphoria or aggression, poor coordination',
        wd: 'shaking hands, sweating, nausea, anxiety, insomnia, strong urge to drink',
        cons: ['drinks "to relax" more and more often, hangovers, justifies every drink',
            'drinks in the morning and alone, skips obligations, hides bottles, memory gaps, fights with loved ones',
            'cannot function without alcohol, tremors, liver problems, losing job and relationships, seizure risk if quitting abruptly'] },
    cannabis: { name: 'Cannabis', short: 'Cannabis', high: 'relaxed, slowed reactions, red eyes, hunger, giggles or paranoia',
        wd: 'irritability, poor sleep, low appetite, boredom and cravings',
        cons: ['smokes almost every weekend, sluggish, forgetful',
            'smokes daily, motivation drops, trouble at school/work, withdraws socially',
            'cannot relax or sleep without weed, apathy, anxiety, paranoia'] },
    stimulants: { name: 'Stimulants', short: 'Stimulants', high: 'burst of energy, rapid speech, dilated pupils, insomnia, overconfidence, jitteriness',
        wd: 'severe fatigue, low mood, apathy, anxiety, intense cravings, disturbed sleep',
        cons: ['uses "to stay sharp", mood swings, poor sleep and appetite',
            'spends large sums, paranoid, losing weight, euphoria-crash cycles, lies to loved ones',
            'obsessive craving, psychosis-like states, heart problems, debts, isolation, high overdose risk'] },
    opioids: { name: 'Opioids', short: 'Opioids', high: 'drowsiness, cotton-wool bliss, pinpoint pupils, slow speech, nodding off',
        wd: 'body aches, chills and sweats, nausea, agonizing cravings, insomnia, panic',
        cons: ['uses "to dull the pain", drowsy, constantly constipated',
            'dose keeps rising, lives dose to dose, deceives loved ones, money drains away',
            'life revolves around the substance, severe withdrawal without a dose, high overdose risk, debts and crime'] },
    sedatives: { name: 'Sedatives / benzos', short: 'Sedatives', high: 'sluggish, slurred and confused speech, drowsy, dulled emotions',
        wd: 'severe anxiety, panic, trembling, insomnia, seizure risk',
        cons: ['takes pills "to sleep / calm down" more and more often',
            'without pills: anxiety and insomnia, raises the dose, memory gaps, lethargy',
            'cannot live without the drug, confusion, falls, dangerous withdrawal if stopped abruptly, overdose risk especially with alcohol'] },
    psychedelics: { name: 'Psychedelics', short: 'Psychedelics', high: 'altered perception, hallucinations, intense emotions, distorted sense of time',
        wd: 'no pronounced physical withdrawal',
        cons: ['chases "trips" as an escape from reality',
            'derealization, anxiety after trips, hard to return to ordinary life',
            'lasting perception problems, paranoia, trouble telling reality from visions'] },
};
for (const id of IDS) {
    const s = SUBS[id];
    s.L = { ru: { name: s.name, short: s.short, high: s.high, wd: s.wd, cons: s.cons }, en: EN[id] };
}
const sn = (id) => SUBS[id].L[lang()].name;
const ss = (id) => SUBS[id].L[lang()].short;

/* ───────────────────────── Лечение ───────────────────────── */
const T = {
    self:    { id: 'self', name: 'Самостоятельно (резко бросить)', cost: 0, dur: 30, eff: 0.5, wdMul: 1.5, desc: 'Бесплатно, но ломка сильнее, риск срыва высокий.' },
    therapy: { id: 'therapy', name: 'Психотерапия (КПТ)', cost: 150, dur: 60, eff: 1.0, wdMul: 1.0, desc: 'Работа с триггерами и причинами тяги.' },
    group:   { id: 'group', name: 'Группа поддержки (АА / АН)', cost: 0, dur: 80, eff: 0.8, wdMul: 1.1, desc: 'Бесплатно, нужна регулярность и честность.' },
    rehab:   { id: 'rehab', name: 'Реабилитационный центр', cost: 900, dur: 90, eff: 1.9, wdMul: 0.5, med: true, desc: 'Стационар, режим, терапия. Дорого, но надёжнее всего.' },
    detox:   { id: 'detox', name: 'Медицинский детокс', cost: 400, dur: 14, eff: 2.2, wdMul: 0.4, med: true, desc: 'Короткий курс под наблюдением врачей, смягчает ломку.' },
    meds:    { id: 'meds', name: 'Поддерживающие препараты (по назначению врача)', cost: 250, dur: 70, eff: 1.1, wdMul: 0.7, med: true, desc: 'Врач подбирает поддерживающую терапию.' },
    nrt:     { id: 'nrt', name: 'Никотинозаместительная терапия', cost: 40, dur: 60, eff: 1.2, wdMul: 0.5, med: true, desc: 'Пластыри/жвачки, постепенное снижение дозы.' },
    subst:   { id: 'subst', name: 'Заместительная терапия (под врачом)', cost: 300, dur: 120, eff: 1.3, wdMul: 0.4, med: true, desc: 'Медицинская программа поддержки, стабилизирует состояние.' },
    taper:   { id: 'taper', name: 'Плавное снижение дозы под врачом', cost: 200, dur: 80, eff: 1.2, wdMul: 0.5, med: true, desc: 'Резко бросать опасно — врач снижает дозу постепенно.' },
};

const T_EN = {
    self: { name: 'On your own (quit cold turkey)', desc: 'Free, but withdrawal is harsher and relapse risk is high.' },
    therapy: { name: 'Psychotherapy (CBT)', desc: 'Work on triggers and the roots of cravings.' },
    group: { name: 'Support group (AA / NA)', desc: 'Free; needs regularity and honesty.' },
    rehab: { name: 'Rehab center', desc: 'Residential program with routine and therapy. Expensive, but the most reliable.' },
    detox: { name: 'Medical detox', desc: 'Short course under medical care that eases withdrawal.' },
    meds: { name: 'Supportive medication (doctor-prescribed)', desc: 'A doctor selects supportive therapy.' },
    nrt: { name: 'Nicotine replacement therapy', desc: 'Patches/gum, gradual dose reduction.' },
    subst: { name: 'Replacement therapy (medical)', desc: 'A supervised medical program that stabilizes the patient.' },
    taper: { name: 'Gradual dose tapering under a doctor', desc: 'Quitting abruptly is dangerous — a doctor lowers the dose step by step.' },
};
for (const id in T) T[id].L = { ru: { name: T[id].name, desc: T[id].desc }, en: T_EN[id] };
const tn = (tid) => T[tid].L[lang()].name;
const td = (tid) => T[tid].L[lang()].desc;

/* ───────────────────────── Дилеры по умолчанию ───────────────────────── */
const DL = {
    shop: { ru: { name: 'Магазин / бар', desc: 'Легальная продажа (возрастные ограничения мира).' }, en: { name: 'Shop / bar', desc: 'Legal sales (age limits of your world apply).' } },
    vik: { ru: { name: 'Вик', desc: 'Уличный дилер, клубная сцена.' }, en: { name: 'Vic', desc: 'Street dealer, club scene.' } },
    doc: { ru: { name: '«Доктор»', desc: 'Подпольный «фармацевт». Дорого, но качественно.' }, en: { name: '"The Doc"', desc: 'Underground "pharmacist". Pricey, but reliable.' } },
    rose: { ru: { name: 'Мама Роза', desc: 'Торгует из-под полы на рынке.' }, en: { name: 'Mama Rose', desc: 'Sells from under the counter at the market.' } },
};
const dn = (d) => DL[d.id]?.[lang()]?.name ?? d.name;
const dd = (d) => DL[d.id]?.[lang()]?.desc ?? d.desc ?? '';
function defaultDealers() {
    return [
        { id: 'shop', name: 'Магазин / бар', subs: ['nicotine', 'alcohol'], priceMul: 1, reliab: 1, risk: 0, desc: 'Легальная продажа (возрастные ограничения мира).', builtin: true },
        { id: 'vik', name: 'Вик', subs: ['cannabis', 'stimulants', 'psychedelics'], priceMul: 1, reliab: 0.75, risk: 25, desc: 'Уличный дилер, клубная сцена.' },
        { id: 'doc', name: '«Доктор»', subs: ['sedatives', 'opioids'], priceMul: 1.3, reliab: 0.9, risk: 15, desc: 'Подпольный «фармацевт». Дорого, но качественно.' },
        { id: 'rose', name: 'Мама Роза', subs: ['cannabis', 'psychedelics', 'nicotine'], priceMul: 0.9, reliab: 0.8, risk: 20, desc: 'Торгует из-под полы на рынке.' },
    ];
}

/* ───────────────────────── Утилиты и состояние ───────────────────────── */
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function cfg() {
    if (!extension_settings[MOD]) extension_settings[MOD] = {};
    for (const k in DEFAULTS) if (extension_settings[MOD][k] === undefined) extension_settings[MOD][k] = DEFAULTS[k];
    return extension_settings[MOD];
}
const toast = (m, t = 'info') => { if (cfg().toasts && window.toastr) window.toastr[t](m, 'Alcohol n Drugs'); };

function newState() {
    return {
        v: 1, tick: 0, chars: {}, dealers: defaultDealers(), events: [], log: [],
        market: Object.fromEntries(IDS.map((id) => [id, SUBS[id].price])),
    };
}
let fallback = null;
function S() {
    const md = getContext().chatMetadata;
    if (!md) return (fallback = fallback || newState());
    if (!md[MOD]) md[MOD] = newState();
    return md[MOD];
}
let saveT;
function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { getContext().saveMetadata(); } catch (e) { console.warn('[AND] save', e); } }, 400);
}
function ch(name) {
    const st = S();
    if (!st.chars[name]) st.chars[name] = { money: cfg().startMoney, health: 100, heat: 0, rep: 0, debt: 0, creditor: '', subs: {} };
    return st.chars[name];
}
function sb(c, id) {
    return c.subs[id] || (c.subs[id] = { dep: 0, tol: 0, last: null, high: 0, inv: 0, uses: 0, treat: null, remit: 0 });
}
const stageOf = (dep) => (dep < 8 ? 0 : dep < 30 ? 1 : dep < 55 ? 2 : dep < 80 ? 3 : 4);
function log(text) {
    const st = S();
    st.log.unshift({ t: st.tick, x: text });
    if (st.log.length > 80) st.log.length = 80;
}
const pushEvent = (text) => S().events.push({ text, ttl: 2 });

function wd(sub, s, tick) {
    if (!sub.wdSev || s.last == null || s.high > 0 || s.dep < 15) return null;
    const since = tick - s.last;
    if (since < sub.grace) return null;
    const x = (since - sub.grace) / sub.wdLen;
    if (x > 2) return null;
    const curve = x < 1 ? 0.4 + 0.6 * x : 2 - x;
    let lvl = (s.dep / 100) * sub.wdSev * curve * 1.3;
    if (s.treat) lvl *= s.treat.wdMul;
    lvl = clamp(lvl, 0, 1);
    if (lvl < 0.08) return null;
    return { level: lvl, label: t(lvl < 0.3 ? 'wd_mild' : lvl < 0.6 ? 'wd_moderate' : 'wd_severe'), en: lvl < 0.3 ? 'mild' : lvl < 0.6 ? 'moderate' : 'severe' };
}

/* ───────────────────────── Игровая логика ───────────────────────── */
function dealerFor(id) { return S().dealers.find((d) => d.subs.includes(id) && !d.builtin) || S().dealers.find((d) => d.subs.includes(id)); }

function pay(name, c, id) {
    const st = S(), sub = SUBS[id], price = Math.round(st.market[id] * (dealerFor(id)?.priceMul || 1));
    if (c.money >= price) { c.money -= price; return; }
    if (sub.legal) { c.money = 0; return; }
    c.debt += price * 1.25;
    c.creditor = c.creditor || dealerFor(id)?.name || 'дилер';
    c.heat = clamp(c.heat + 3);
    log(t('l_credit', { n: name, s: ss(id), p: price, c: cfg().currency }));
}

function useSub(name, id, units = 1, source = 'manual') {
    const c = ch(name), sub = SUBS[id], s = sb(c, id), D = cfg().difficulty, st = S();
    const wasTreat = !!s.treat;
    for (let u = 0; u < units; u++) {
        if (s.inv > 0) s.inv--; else if (cfg().autoPay) pay(name, c, id);
        const gain = sub.addict * D * (s.dep >= 80 ? 0.4 : 1) * (s.high > 0 ? 0.7 : 1) * (s.remit > 0 ? 1.6 : 1);
        s.dep = clamp(s.dep + gain);
        s.tol = clamp(s.tol + sub.tol * D * 0.6);
        if (!sub.legal) c.heat = clamp(c.heat + 2);
    }
    s.high = Math.max(s.high, sub.dur * units);
    s.last = st.tick;
    s.uses += units;
    const stg = stageOf(s.dep);
    log(t('l_use', { n: name, i: sub.icon, s: ss(id), u: units, a: source === 'auto' ? t('auto') : '', d: Math.round(s.dep), st: stl(stg) }));

    if (wasTreat) { // срыв
        s.treat.left = Math.min(s.treat.total, s.treat.left + s.treat.total * 0.35);
        s.dep = clamp(s.dep + 6);
        log(t('l_relapse', { n: name, s: ss(id) }));
        pushEvent(`${name} relapses during treatment for ${sub.L.en.name}, feeling guilt and shame.`);
    }
    if (stg >= 1 && s.uses === units) pushEvent(`${name} tries ${sub.L.en.name} for the first time — it feels new and tempting.`);
    if (sub.od && cfg().events) {
        const risk = sub.od * (s.dep / 100 + 0.3) * (units > 1 ? 1.5 : 1) * D;
        if (Math.random() < risk) {
            c.health = clamp(c.health - rnd(20, 40));
            log(t('l_od', { n: name, s: ss(id) }));
            pushEvent(`${name} suffers an overdose scare from ${sub.L.en.name}: collapses, needs urgent help. Describe it as frightening and dangerous, not glamorous.`);
        }
    }
}

function finishTreatment(name, id) {
    const c = ch(name), s = sb(c, id), trId = s.treat.id;
    s.treat = null;
    s.remit = 150;
    log(t('l_finish', { n: name, t: tn(trId), d: Math.round(s.dep) }));
    pushEvent(`${name} completes the "${T[trId].L.en.name}" program for ${SUBS[id].L.en.name}; ${s.dep > 25 ? 'cravings still linger' : 'feels clearer and healthier'} — recovery is fragile.`);
}

function randomEvent(name, c, id) {
    const sub = SUBS[id], s = sb(c, id), stg = stageOf(s.dep), cur = cfg().currency;
    const pool = [];
    pool.push(() => { pushEvent(`${name}'s ${sub.L.en.short} habit makes them late or unreliable, causing trouble with work/study/commitments.`); log(t('l_trouble', { n: name, s: ss(id) })); });
    pool.push(() => { pushEvent(`A loved one confronts ${name} about their ${sub.L.en.short} use; tense argument.`); log(t('l_argument', { n: name })); });
    if (c.money > 40) pool.push(() => { const l = Math.round(Math.min(c.money, rnd(30, 120))); c.money -= l; pushEvent(`${name} wastes money on ${sub.L.en.name} and is short on cash.`); log(t('l_waste', { n: name, m: l, c: cur })); });
    if (['alcohol', 'sedatives', 'psychedelics', 'stimulants'].includes(id)) pool.push(() => { pushEvent(`${name} has a gap in memory about recent events because of ${sub.L.en.name}; others notice.`); log(t('l_blackout', { n: name })); });
    if (stg >= 3) pool.push(() => { pushEvent(`Friends or family stage an intervention, urging ${name} to get treatment for ${sub.L.en.name}.`); log(t('l_interv', { n: name })); });
    if (c.health < 60) pool.push(() => { pushEvent(`${name} feels physically ill — poor health from ${sub.L.en.name} shows.`); log(t('l_ill', { n: name })); });
    pool[Math.floor(Math.random() * pool.length)]();
}

function advanceOne() {
    const st = S(), D = cfg().difficulty, cur = cfg().currency;
    st.tick++;
    st.events = st.events.filter((e) => (e.ttl -= 1) > 0);
    if (st.tick % 8 === 0) {
        for (const id of IDS) {
            let p = st.market[id] * rnd(0.92, 1.1);
            if (Math.random() < 0.04) { p *= 1.6; log(t('l_market', { s: ss(id) })); }
            st.market[id] = clamp(p, SUBS[id].price * 0.6, SUBS[id].price * 2.5);
        }
    }
    for (const [name, c] of Object.entries(st.chars)) {
        let recent = false, wdMax = 0, topId = null, topDep = 0;
        for (const [id, s] of Object.entries(c.subs)) {
            const sub = SUBS[id];
            if (s.high > 0) s.high--;
            const since = s.last == null ? Infinity : st.tick - s.last;
            if (since < 15) recent = true;
            if (s.high === 0 && since > 0 && since !== Infinity) {
                const dec = sub.decay * (since > sub.grace ? 1 : 0.3) + (s.treat ? s.treat.eff : 0);
                s.dep = Math.max(0, s.dep - dec);
                s.tol = Math.max(0, s.tol - 0.1);
            }
            if (s.remit > 0) s.remit--;
            if (since < 15) c.health = clamp(c.health - sub.health * (0.3 + s.dep / 100));
            const w = wd(sub, s, st.tick);
            if (w) {
                wdMax = Math.max(wdMax, w.level);
                if (sub.danger && !(s.treat && s.treat.med) && w.level > 0.6) c.health = clamp(c.health - w.level * 0.4);
                if (cfg().events && sub.danger && !(s.treat && s.treat.med) && w.level > 0.6 && Math.random() < 0.04 * D) {
                    c.health = clamp(c.health - rnd(10, 25));
                    log(t('l_seizure', { n: name, s: ss(id) }));
                    pushEvent(`${name} has a seizure from abrupt ${sub.L.en.name} withdrawal without medical help — dangerous, urgent.`);
                }
            }
            if (cfg().events && stageOf(s.dep) >= 2 && !s.high && since > sub.grace && Math.random() < 0.05 * D) {
                pushEvent(`${name} is hit by an intense craving for ${sub.L.en.name}${s.treat ? ' and struggles to stay in treatment' : ''}.`);
            }
            if (s.treat) { s.treat.left--; if (s.treat.left <= 0) finishTreatment(name, id); }
            if (s.dep > topDep) { topDep = s.dep; topId = id; }
        }
        if (!recent && wdMax < 0.3) c.health = clamp(c.health + 0.2 + (Object.values(c.subs).some((s) => s.treat) ? 0.3 : 0));
        c.heat = Math.max(0, c.heat - 0.5);
        if (c.debt > 0) c.debt *= 1.004;
        if (cfg().events) {
            const p = [0, 0, 0.01, 0.025, 0.045][stageOf(topDep)] * D;
            if (topId && Math.random() < p) randomEvent(name, c, topId);
            if (c.heat > 60 && Math.random() < 0.04) {
                let conf = 0;
                for (const id of IDS) if (!SUBS[id].legal && c.subs[id]) { conf += c.subs[id].inv; c.subs[id].inv = 0; }
                const fine = Math.round(Math.min(c.money, rnd(100, 300)));
                c.money -= fine; c.heat = 30;
                log(t('l_raid', { n: name, f: fine, c: cur, k: conf }));
                pushEvent(`${name} is stopped by police over illegal substances (confiscation, fine${conf > 2 ? ', possible arrest' : ''}). Narrate the legal consequences.`);
            }
            if (c.debt > 200 && Math.random() < 0.03) {
                log(t('l_debt', { n: name, cr: c.creditor, d: Math.round(c.debt), c: cur }));
                pushEvent(`${c.creditor} (a dealer) pressures ${name} to repay a debt of about ${Math.round(c.debt)}${cur}; veiled threats.`);
            }
        }
    }
}

function detect(text) {
    const found = [];
    for (const id of IDS) {
        const re = new RegExp(SUBS[id].reG.source, 'gi');
        let m, count = 0;
        while ((m = re.exec(text))) {
            const before = text.slice(Math.max(0, m.index - 22), m.index);
            if (!NEG.test(before)) count++;
            if (m.index === re.lastIndex) re.lastIndex++;
        }
        if (count) found.push({ id, units: Math.min(3, Math.ceil(count / 2)) });
    }
    return found;
}

function onMessage(id, type) {
    try {
        if (!cfg().enabled || type === 'first_message') return;
        const ctx = getContext();
        const msg = ctx.chat?.[id];
        if (!msg || msg.is_system) return;
        msg.extra = msg.extra || {};
        if (msg.extra.and_done) return; // свайп/повтор — не считаем дважды
        msg.extra.and_done = true;
        for (let i = 0; i < cfg().ticks; i++) advanceOne();
        if (cfg().autoDetect) {
            const who = msg.is_user ? ctx.name1 : msg.name;
            const hits = detect(msg.mes || '');
            for (const h of hits) {
                useSub(who, h.id, h.units, 'auto');
                toast(`${who}: ${SUBS[h.id].icon} ${ss(h.id)} → ${Math.round(ch(who).subs[h.id].dep)}%`);
            }
        }
        updatePrompt(); save(); if ($('#and_modal').is(':visible')) render();
    } catch (e) { console.error('[AND]', e); }
}

/* ───────────────────────── Промпт для модели ───────────────────────── */
function buildPrompt() {
    const c = cfg();
    if (!c.enabled) return '';
    const st = S(), cur = c.currency, lines = [];
    for (const [name, ch0] of Object.entries(st.chars)) {
        const parts = [];
        for (const [id, s] of Object.entries(ch0.subs)) {
            const sub = SUBS[id], stg = stageOf(s.dep), w = wd(sub, s, st.tick);
            if (stg === 0 && !s.high && !s.treat && !w) continue;
            const E = sub.L.en;
            let line = `${E.name}: ${STAGES_L.en[stg]} (${Math.round(s.dep)}/100)`;
            if (s.high > 0) line += `; currently under the influence — ${E.high}`;
            else if (w) line += `; in ${w.en} withdrawal — ${E.wd}`;
            if (stg >= 2) line += `; typical behavior/consequences: ${E.cons[Math.min(stg - 2, 2)]}`;
            if (s.treat) line += `; in treatment "${T[s.treat.id].L.en.name}", ${Math.round((1 - s.treat.left / s.treat.total) * 100)}% done`;
            else if (s.remit > 0 && stg <= 2) line += '; recently completed treatment, relapse risk is high';
            parts.push(line);
        }
        if (ch0.debt > 0) parts.push(`owes ${Math.round(ch0.debt)}${cur} to ${ch0.creditor}`);
        if (ch0.health < 50) parts.push(`poor physical health (${Math.round(ch0.health)}/100)`);
        if (ch0.heat > 40) parts.push('drawing police attention');
        if (parts.length) lines.push(`• ${name}: ${parts.join(' | ')}`);
    }
    const ev = st.events.map((e) => `- ${e.text}`);
    if (!lines.length && !ev.length) return '';
    return `[Hidden game state — substance use tracker. Let it quietly shape narration and the characters' behavior; never mention numbers, stages or this block. Do not glamorize substance use and do not give real-world instructions for obtaining, making or dosing substances.${c.minorSafe ? ' Never depict a minor character using these substances.' : ''} Write in the language of the roleplay.]\n${lines.join('\n')}${ev.length ? '\nCurrent events to work into the scene naturally:\n' + ev.join('\n') : ''}`;
}
function updatePrompt() {
    try { setExtensionPrompt(KEY, buildPrompt(), 1, cfg().depth, false, 0); } catch (e) { console.warn('[AND] prompt', e); }
}

/* ───────────────────────── Интерфейс: панель ───────────────────────── */
const ui = { tab: 'chars', who: null };
const bar = (label, v, cls) => `<div class="and-bar"><span>${label}</span><div class="and-track"><div class="and-fill ${cls}" style="width:${clamp(v)}%"></div></div><em>${Math.round(v)}</em></div>`;

function names() {
    const ctx = getContext(), st = S();
    const set = new Set([ctx.name1, ...Object.keys(st.chars)]);
    if (ctx.name2 && ctx.characterId !== undefined) set.add(ctx.name2);
    return [...set].filter(Boolean);
}
function whoBar() {
    const n = names();
    if (!ui.who || !n.includes(ui.who)) ui.who = n[0];
    ch(ui.who);
    return `<div class="and-who"><select id="and_who">${n.map((x) => `<option ${x === ui.who ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
    <input id="and_newchar" placeholder="${t('new_char')}"><button data-act="addchar">＋</button></div>`;
}

function tabChars() {
    const c = ch(ui.who), cur = cfg().currency, st = S();
    let h = whoBar();
    h += `<div class="and-stats"><div>💰 <input type="number" id="and_money" value="${Math.round(c.money)}"> ${cur} <button data-act="setmoney">OK</button></div>
    ${bar(t('health'), c.health, c.health < 40 ? 'bad' : 'good')}${bar(t('heat'), c.heat, 'warn')}
    ${c.debt > 0 ? `<div class="and-debt">${t('debt')}: <b>${Math.round(c.debt)}${cur}</b> (${esc(c.creditor)}) <button data-act="paydebt">${t('repay')}</button></div>` : ''}</div>`;
    for (const id of IDS) {
        const sub = SUBS[id], s = sb(c, id), stg = stageOf(s.dep), w = wd(sub, s, st.tick);
        const active = s.dep > 0 || s.inv > 0 || s.uses > 0;
        let status = '';
        if (s.high > 0) status += `<span class="and-tag t-high">${t('tag_high')}</span>`;
        if (w) status += `<span class="and-tag t-wd">${t('tag_wd', { l: w.label })}</span>`;
        if (s.treat) status += `<span class="and-tag t-tr">${t('tag_treat', { p: Math.round((1 - s.treat.left / s.treat.total) * 100) })}</span>`;
        if (s.remit > 0 && !s.treat) status += `<span class="and-tag t-ok">${t('tag_remit')}</span>`;
        h += `<div class="and-card ${active ? '' : 'dim'}"><div class="and-card-h"><b>${sub.icon} ${sn(id)}</b><span class="and-stage s${stg}">${stl(stg)}</span></div>`;
        if (active) h += bar(t('dependence'), s.dep, 'dep') + bar(t('tolerance'), s.tol, 'tol');
        h += `<div class="and-tags">${status}${s.inv ? `<span class="and-tag">${t('tag_stock', { n: s.inv })}</span>` : ''}</div>`;
        if (stg >= 2) h += `<div class="and-note">${esc(sub.L[lang()].cons[Math.min(stg - 2, 2)])}</div>`;
        h += `<button data-act="use" data-sub="${id}">${s.inv ? t('use_stock') : t('use')}</button></div>`;
    }
    return h;
}

function tabMarket() {
    const st = S(), c = ch(ui.who), cur = cfg().currency;
    let h = whoBar();
    h += `<h4>${t('prices')}</h4><div class="and-prices">${IDS.map((id) => `<span>${SUBS[id].icon} ${ss(id)}: <b>${cur}${Math.round(st.market[id])}</b></span>`).join('')}</div>`;
    h += `<h4>${t('sellers')}</h4>`;
    for (const d of st.dealers) {
        h += `<div class="and-card"><div class="and-card-h"><b>${esc(dn(d))}</b><span class="and-tag">${t('dealer_stats', { r: d.risk, q: Math.round(d.reliab * 100) })}</span></div><div class="and-note">${esc(dd(d))}</div>`;
        for (const id of d.subs) {
            const unit = Math.round(st.market[id] * d.priceMul);
            h += `<div class="and-buy">${SUBS[id].icon} ${ss(id)} — ${cur}${unit}${t('per_unit')}
            <button data-act="buy" data-dealer="${d.id}" data-sub="${id}" data-qty="1">×1</button>
            <button data-act="buy" data-dealer="${d.id}" data-sub="${id}" data-qty="5">×5</button>
            ${SUBS[id].legal ? '' : `<button data-act="buy" data-dealer="${d.id}" data-sub="${id}" data-qty="1" data-credit="1">${t('credit')}</button>`}</div>`;
        }
        if (!d.builtin) h += `<button class="and-del" data-act="deldealer" data-dealer="${d.id}">${t('del')}</button>`;
        h += `</div>`;
    }
    const inv = IDS.filter((id) => (c.subs[id]?.inv || 0) > 0);
    h += `<h4>${t('sell_h', { n: esc(ui.who) })}</h4>`;
    if (!inv.length) h += `<div class="and-note">${t('no_stock')}</div>`;
    else h += `<div class="and-sell"><select id="and_sell_sub">${inv.map((id) => `<option value="${id}">${ss(id)} (${t('stock_opt', { n: c.subs[id].inv })}, ≈${cur}${Math.round(st.market[id] * 0.75 * (1 + c.rep / 200))}${t('per_unit')})</option>`).join('')}</select>
    <input type="number" id="and_sell_qty" value="1" min="1"><button data-act="sell">${t('sell')}</button></div><div class="and-note">${t('rep_note', { r: Math.round(c.rep) })}</div>`;
    h += `<h4>${t('add_dealer')}</h4><div class="and-form"><input id="and_dn" placeholder="${t('d_name')}"><input id="and_dd" placeholder="${t('d_desc')}">
    <label>${t('d_markup')}<input id="and_dp" type="number" step="0.1" value="1"></label><label>${t('d_risk')}<input id="and_dr" type="number" value="20"></label>
    <div class="and-checks">${IDS.map((id) => `<label><input type="checkbox" class="and-dsub" value="${id}"> ${ss(id)}</label>`).join('')}</div>
    <button data-act="adddealer">${t('add')}</button></div>`;
    return h;
}

function tabTreat() {
    const c = ch(ui.who), cur = cfg().currency;
    let h = whoBar(), any = false;
    for (const id of IDS) {
        const sub = SUBS[id], s = sb(c, id);
        if (stageOf(s.dep) < 1 && !s.treat) continue;
        any = true;
        h += `<div class="and-card"><div class="and-card-h"><b>${sub.icon} ${sn(id)}</b><span class="and-stage s${stageOf(s.dep)}">${stl(stageOf(s.dep))}</span></div>`;
        if (s.treat) {
            h += bar(t('progress'), (1 - s.treat.left / s.treat.total) * 100, 'good') + `<div class="and-note">${esc(tn(s.treat.id))}</div><button data-act="stop" data-sub="${id}">${t('stop')}</button>`;
        } else {
            if (sub.danger) h += `<div class="and-note warn">${t('danger_note')}</div>`;
            for (const tid of sub.treat) {
                const tr = T[tid];
                h += `<div class="and-treat"><div><b>${esc(tn(tid))}</b> · ${tr.cost ? cur + tr.cost : t('free')} · ${tr.dur} ${t('turns')}<div class="and-note">${esc(td(tid))}</div></div>
                <button data-act="treat" data-sub="${id}" data-t="${tid}" ${c.money < tr.cost ? 'disabled' : ''}>${t('start')}</button></div>`;
            }
        }
        h += `</div>`;
    }
    if (!any) h += `<div class="and-note">${t('no_need', { n: esc(ui.who) })}</div>`;
    return h;
}

function tabLog() {
    const st = S();
    return `<div class="and-log">${st.log.length ? st.log.map((l) => `<div><em>#${l.t}</em> ${esc(l.x)}</div>`).join('') : `<div class="and-note">${t('log_empty')}</div>`}</div>`;
}

function render() {
    const tabs = [['chars', t('tab_chars')], ['market', t('tab_market')], ['treat', t('tab_treat')], ['log', t('tab_log')]];
    $('#and_modal .and-tabs').html(tabs.map(([k, v]) => `<button data-act="tab" data-tab="${k}" class="${ui.tab === k ? 'on' : ''}">${v}</button>`).join(''));
    const fn = { chars: tabChars, market: tabMarket, treat: tabTreat, log: tabLog }[ui.tab];
    const scroll = $('#and_modal .and-body').scrollTop();
    $('#and_modal .and-body').html(fn());
    $('#and_modal .and-body').scrollTop(scroll);
}
function openPanel() {
    if (!$('#and_modal').length) {
        $('body').append(`<div id="and_modal"><div class="and-box"><div class="and-head"><b>🍺 Alcohol n Drugs</b><span class="and-x" data-act="close">✕</span></div><div class="and-tabs"></div><div class="and-body"></div></div></div>`);
    }
    render();
    $('#and_modal').css('display', 'flex');
}
function after() { updatePrompt(); save(); render(); }

const actions = {
    close() { $('#and_modal').hide(); },
    tab(d) { ui.tab = d.tab; render(); },
    addchar() { const n = String($('#and_newchar').val() || '').trim(); if (!n) return; ch(n); ui.who = n; after(); },
    setmoney() { ch(ui.who).money = Number($('#and_money').val()) || 0; after(); },
    use(d) { useSub(ui.who, d.sub, 1); after(); },
    paydebt() {
        const c = ch(ui.who); const p = Math.min(c.money, c.debt);
        if (p <= 0) return window.toastr?.warning(t('w_nomoney'));
        c.money -= p; c.debt -= p;
        if (c.debt < 1) { c.debt = 0; c.creditor = ''; }
        log(t('l_paid', { n: ui.who, p: Math.round(p), c: cfg().currency })); after();
    },
    buy(d) {
        const st = S(), c = ch(ui.who), dl = st.dealers.find((x) => x.id === d.dealer), id = d.sub, q = Number(d.qty), sub = SUBS[id];
        const total = Math.round(st.market[id] * dl.priceMul) * q;
        if (d.credit) { c.debt += total * 1.25; c.creditor = dn(dl); }
        else { if (c.money < total) return window.toastr?.warning(t('w_notenough')); c.money -= total; }
        let got = q;
        if (Math.random() > dl.reliab) {
            got = Math.ceil(q / 2);
            log(t('l_scam', { n: ui.who, d: dn(dl), g: got, q }));
            window.toastr?.warning(t('w_scam', { d: dn(dl), g: got, q }));
        }
        sb(c, id).inv += got;
        if (!sub.legal) c.heat = clamp(c.heat + dl.risk * 0.25 * Math.min(q, 4));
        log(t('l_bought', { n: ui.who, g: got, s: ss(id), d: dn(dl), t: total, c: cfg().currency, cr: d.credit ? t('l_credit_sfx') : '' }));
        after();
    },
    sell() {
        const st = S(), c = ch(ui.who), id = $('#and_sell_sub').val(), q = Math.max(1, Number($('#and_sell_qty').val()) || 1), s = sb(c, id);
        if (s.inv < q) return window.toastr?.warning(t('w_nostock'));
        const income = Math.round(st.market[id] * 0.75 * (1 + c.rep / 200) * q * rnd(0.9, 1.1));
        s.inv -= q; c.money += income;
        if (!SUBS[id].legal) { c.heat = clamp(c.heat + 4 * q); c.rep = clamp(c.rep + 0.5 * q); }
        log(t('l_sold', { n: ui.who, q, s: ss(id), i: income, c: cfg().currency }));
        if (!SUBS[id].legal) pushEvent(`${ui.who} sells illegal substances on the side, risking police attention and dangerous clients.`);
        after();
    },
    adddealer() {
        const name = String($('#and_dn').val() || '').trim(), subs = $('.and-dsub:checked').map((_, e) => e.value).get();
        if (!name || !subs.length) return window.toastr?.warning(t('w_need'));
        S().dealers.push({ id: 'd' + Date.now(), name, desc: String($('#and_dd').val() || ''), subs, priceMul: Number($('#and_dp').val()) || 1, risk: clamp(Number($('#and_dr').val()) || 20), reliab: 0.8 });
        after();
    },
    deldealer(d) { const st = S(); st.dealers = st.dealers.filter((x) => x.id !== d.dealer); after(); },
    treat(d) {
        const c = ch(ui.who), s = sb(c, d.sub), tr = T[d.t];
        if (s.treat || c.money < tr.cost) return;
        c.money -= tr.cost;
        s.treat = { id: tr.id, left: tr.dur, total: tr.dur, eff: tr.eff, wdMul: tr.wdMul, med: !!tr.med };
        log(t('l_tstart', { n: ui.who, t: tn(tr.id), s: ss(d.sub) }));
        pushEvent(`${ui.who} begins treatment for ${SUBS[d.sub].L.en.name}: ${tr.L.en.name}.`);
        after();
    },
    stop(d) {
        const s = sb(ch(ui.who), d.sub); s.treat = null;
        log(t('l_tstop', { n: ui.who, s: ss(d.sub) }));
        pushEvent(`${ui.who} drops out of treatment for ${SUBS[d.sub].L.en.name}.`);
        after();
    },
};

/* ───────────────────────── Настройки ───────────────────────── */
function settingsHtml() {
    return `<div class="and-settings"><div class="inline-drawer"><div class="inline-drawer-toggle inline-drawer-header"><b>🍺 Alcohol n Drugs</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
    <div class="inline-drawer-content">
    <label>${t('s_lang')}
      <select id="and_lang" class="text_pole"><option value="ru">Русский</option><option value="en">English</option></select></label>
    <label class="checkbox_label"><input type="checkbox" id="and_enabled"> ${t('s_enabled')}</label>
    <label class="checkbox_label"><input type="checkbox" id="and_auto"> ${t('s_auto')}</label>
    <label class="checkbox_label"><input type="checkbox" id="and_events"> ${t('s_events')}</label>
    <label class="checkbox_label"><input type="checkbox" id="and_autopay"> ${t('s_autopay')}</label>
    <label class="checkbox_label"><input type="checkbox" id="and_toasts"> ${t('s_toasts')}</label>
    <label class="checkbox_label"><input type="checkbox" id="and_minor"> ${t('s_minor')}</label>
    <label>${t('s_diff')}
      <select id="and_diff" class="text_pole"><option value="0.5">${t('d_easy')}</option><option value="1">${t('d_norm')}</option><option value="1.5">${t('d_hard')}</option><option value="2">${t('d_brutal')}</option></select></label>
    <label>${t('s_depth')} <input type="number" id="and_depth" class="text_pole" min="0" max="10"></label>
    <label>${t('s_ticks')} <input type="number" id="and_ticks" class="text_pole" min="1" max="10"></label>
    <label>${t('s_cur')} <input id="and_cur" class="text_pole"></label>
    <label>${t('s_start')} <input type="number" id="and_start" class="text_pole"></label>
    <div class="flex-container"><div id="and_open" class="menu_button">${t('s_open')}</div><div id="and_reset" class="menu_button">${t('s_reset')}</div></div>
    </div></div></div>`;
}
function bindSettings() {
    const c = cfg();
    $('#and_lang').val(c.lang).on('change', function () {
        c.lang = this.value; saveSettingsDebounced();
        $('.and-settings').replaceWith(settingsHtml()); bindSettings();
        $('.and-settings .inline-drawer-toggle').trigger('click'); // оставить блок открытым
        applyLangToMenu();
        if ($('#and_modal').is(':visible')) render();
    });
    $('#and_enabled').prop('checked', c.enabled).on('change', function () { c.enabled = this.checked; saveSettingsDebounced(); updatePrompt(); });
    $('#and_auto').prop('checked', c.autoDetect).on('change', function () { c.autoDetect = this.checked; saveSettingsDebounced(); });
    $('#and_events').prop('checked', c.events).on('change', function () { c.events = this.checked; saveSettingsDebounced(); });
    $('#and_autopay').prop('checked', c.autoPay).on('change', function () { c.autoPay = this.checked; saveSettingsDebounced(); });
    $('#and_toasts').prop('checked', c.toasts).on('change', function () { c.toasts = this.checked; saveSettingsDebounced(); });
    $('#and_minor').prop('checked', c.minorSafe).on('change', function () { c.minorSafe = this.checked; saveSettingsDebounced(); updatePrompt(); });
    $('#and_diff').val(String(c.difficulty)).on('change', function () { c.difficulty = Number(this.value); saveSettingsDebounced(); });
    $('#and_depth').val(c.depth).on('input', function () { c.depth = Number(this.value) || 0; saveSettingsDebounced(); updatePrompt(); });
    $('#and_ticks').val(c.ticks).on('input', function () { c.ticks = Math.max(1, Number(this.value) || 1); saveSettingsDebounced(); });
    $('#and_cur').val(c.currency).on('input', function () { c.currency = this.value || '$'; saveSettingsDebounced(); });
    $('#and_start').val(c.startMoney).on('input', function () { c.startMoney = Number(this.value) || 0; saveSettingsDebounced(); });
    $('#and_open').on('click', openPanel);
    $('#and_reset').on('click', () => {
        if (!confirm(t('reset_confirm'))) return;
        const md = getContext().chatMetadata; if (md) delete md[MOD];
        fallback = null; updatePrompt(); save(); if ($('#and_modal').is(':visible')) render();
        window.toastr?.success(t('reset_done'), 'Alcohol n Drugs');
    });
}
function applyLangToMenu() { $('#and_wand .and-wand-label').text('Alcohol n Drugs'); }

/* ───────────────────────── Инициализация ───────────────────────── */
jQuery(() => {
    cfg();
    $('#extensions_settings2').append(settingsHtml());
    bindSettings();
    $('#extensionsMenu').append(`<div id="and_wand" class="list-group-item flex-container flexGap5"><div class="fa-solid fa-wine-bottle extensionsMenuExtensionButton"></div><span class="and-wand-label">Alcohol n Drugs</span></div>`);
    $('#and_wand').on('click', openPanel);

    $(document).on('click', '#and_modal [data-act]', function () { const f = actions[this.dataset.act]; if (f) f(this.dataset, this); });
    $(document).on('change', '#and_who', function () { ui.who = this.value; render(); });
    $(document).on('mousedown', '#and_modal', function (e) { if (e.target === this) $(this).hide(); });

    eventSource.on(event_types.MESSAGE_SENT, (id) => onMessage(id));
    eventSource.on(event_types.MESSAGE_RECEIVED, (id, type) => onMessage(id, type));
    eventSource.on(event_types.CHAT_CHANGED, () => { fallback = null; ui.who = null; updatePrompt(); if ($('#and_modal').is(':visible')) render(); });
    updatePrompt();
    console.log('[Alcohol n Drugs] loaded');
});
