/**
 * calculator-data.js
 * Глобальные хелперы, переменные состояния, справочные данные
 */

// ── Хелперы ──────────────────────────────────────────────────────
const q   = s => document.querySelector(s);
const qa  = s => document.querySelectorAll(s);
const fmt = n => parseFloat((n || 0).toFixed(2)).toLocaleString('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const r100     = n => Math.round((n || 0) * 100) / 100;
const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

// ── Глобальное состояние ─────────────────────────────────────────
let disc        = 0;
let chart       = null;
let costCounter = 0;
let dynCounter  = 0;

// ── База автомобилей ─────────────────────────────────────────────
const carDB = {
  Audi: ["A3","A4","A5","A6","A7","A8","Q2","Q3","Q4 e-tron","Q5","Q7","Q8","Q8 e-tron","RS3","RS4","RS5","RS6","RS7","RSQ8","S3","S4","S5","S6","S7","S8","SQ5","SQ7","SQ8","TT","e-tron GT"],
  BMW: ["1 Series","2 Series","3 Series","4 Series","5 Series","6 Series","7 Series","8 Series","X1","X2","X3","X4","X5","X6","X7","iX","iX3","i4","i7","Z4","M2","M3","M4","M5","M8","X3 M","X4 M","X5 M","X6 M"],
  Buick: ["Cascada","Enclave","Encore","Encore GX","Envision","GL8","LaCrosse","Regal","Regal TourX","Verano"],
  BYD: ["Dolphin","Han","Qin Plus","Seal","Song Plus","Tang","Yuan Plus"],
  Cadillac: ["Celestiq","CT4","CT5","CT6","Escalade","Escalade ESV","Lyriq","XT4","XT5","XT6"],
  Changan: ["CS35 Plus","CS55 Plus","CS75 Plus","Uni-K","Uni-T"],
  Chery: ["Arrizo 5","Tiggo 2","Tiggo 4","Tiggo 7","Tiggo 8"],
  Chevrolet: ["Blazer","Colorado","Equinox","Malibu","Silverado 1500","Silverado 2500/3500 HD","Suburban","Tahoe","Trailblazer","Traverse"],
  Chrysler: ["200","300","Pacifica","Pacifica Hybrid","Town & Country","Voyager"],
  Dodge: ["Challenger","Challenger SRT Hellcat","Charger","Charger SRT Hellcat","Dart","Durango","Grand Caravan","Hornet","Journey","Viper"],
  Fisker: ["Alaska","Ocean","Pear","Ronin"],
  Ford: ["Bronco","Edge","Escape","Expedition","Explorer","F-150","Maverick","Mustang","Mustang Mach-E","Ranger"],
  Geely: ["Atlas","Coolray","Emgrand","Monjaro","Tugella"],
  GMC: ["Acadia","Canyon","Hummer EV Pickup","Hummer EV SUV","Savana","Sierra 1500","Sierra HD","Terrain","Yukon","Yukon XL"],
  Haval: ["Dargo","F7","F7x","H6","H9","Jolion"],
  Honda: ["Accord","Civic","Civic Type R","CR-V","HR-V","Odyssey","Passport","Pilot","Ridgeline"],
  Hummer: ["EV Pickup","EV SUV"],
  Hyundai: ["Creta","Elantra","Ioniq 5","Ioniq 6","Kona","Kona Electric","Palisade","Santa Cruz","Santa Fe","Sonata","Tucson","Venue"],
  Jeep: ["Cherokee","Compass","Gladiator","Grand Cherokee","Grand Wagoneer","Renegade","Wagoneer","Wagoneer S","Wrangler","Wrangler 4xe"],
  Kia: ["Carnival","Cerato","Ceed","EV6","EV9","Forte","K5","Niro","Rio","Seltos","Sorento","Soul","Sportage","Stinger","Telluride"],
  Lexus: ["ES","GX","IS","LC","LS","LX","NX","RC","RX","TX","UX"],
  Lincoln: ["Aviator","Continental","Corsair","MKC","MKT","MKX","MKZ","Nautilus","Navigator","Navigator L"],
  Lixiang: ["I8","L6","L7","L8","L9","Mega","One"],
  Lucid: ["Air","Air Grand Touring","Air Pure","Air Sapphire","Air Touring","Gravity","Gravity Grand Touring","Gravity Touring"],
  Mazda: ["CX-3","CX-30","CX-5","CX-50","CX-60","CX-70","CX-90","Mazda2","Mazda3","Mazda6","MX-5","MX-30"],
  "Mercedes-Benz": ["A-Class","B-Class","C-Class","CLA","CLE","CLS","E-Class","EQA","EQB","EQC","EQE","EQS","G-Class","GLA","GLB","GLC","GLE","GLS","S-Class","SL","AMG GT"],
  Nissan: ["Altima","Ariya","GT-R","Kicks","Leaf","Maxima","Murano","Pathfinder","Qashqai","Rogue","Sentra","Titan","X-Trail","Z"],
  Omoda: ["C5","C7","C9","E5","S5"],
  Porsche: ["911","718 Boxster","718 Cayman","Cayenne","Cayenne Coupe","Macan","Panamera","Taycan","Taycan Cross Turismo"],
  Ram: ["1500","1500 Classic","1500 TRX","2500","3500","4500 Chassis Cab","5500 Chassis Cab","ProMaster","ProMaster City","ProMaster Rapid"],
  Rivian: ["EDV","R1S","R1T","R2","R3","R3X","RCV"],
  Tank: ["300","400","500","700"],
  Tesla: ["Cybertruck","Model 3","Model S","Model X","Model Y","Roadster","Semi"],
  Toyota: ["4Runner","Alphard","Avalon","Camry","C-HR","Corolla","Corolla Cross","Crown","GR86","GR Supra","Highlander","Hilux","Land Cruiser","Land Cruiser 300","Prius","RAV4","Sequoia","Sienna","Tacoma","Tundra","Venza","Yaris"],
  Volkswagen: ["Arteon","Atlas","Golf","Golf GTI","Golf R","ID.4","ID.Buzz","Jetta","Jetta GLI","Passat","Polo","Taos","T-Roc","Tiguan","Touareg"],
  Voyah: ["Courage","Dream","Free","Passion"],
  Zeekr: ["001","007","009","7X","9X","Mix","X"]
};

// ── Описания услуг ───────────────────────────────────────────────
const serviceDescriptions = {
  'Полная защита вкруг': 'Полная защита глянцевых кузовных элементов автомобиля с разбором съемных элементов и подготовкой кузова',
  'Защита ударной части': 'Защита ударной части автомобиля с разбором съемных элементов и подготовкой кузова',
  'Демонтаж элементов': 'Снятие кузовных элементов для проведения работ',
  'Монтаж элементов': 'Установка кузовных элементов после проведения работ',
  'Демонтаж и монтаж': 'Полный цикл снятия и установки элементов кузова',
  'Мойка кузова перед оклейкой': 'Подготовительная мойка автомобиля перед оклейкой',
  'Подготовка кузова': 'Комплексная подготовка поверхности к нанесению пленки',
  'Глубокая чистка кузова': 'Детальная очистка кузова от загрязнений и дефектов',
  'Полировка кузова': 'Восстановление и выравнивание лакокрасочного покрытия',
  'Нанесение составов на кузов': 'Обработка кузова защитными составами',
  'Химчистка салона': 'Глубокая очистка салона автомобиля',
  'Нанесение составов на элементы салона': 'Защитная обработка элементов интерьера',
  'Полировка глянцевых элементов': 'Восстановление блеска глянцевых поверхностей',
  'Тонирование задней полусферы': 'Установка тонировочной пленки на заднюю полусферу',
  'Тонирование передних боковых стекол': 'Установка тонировочной пленки на передние боковые стекла',
  'Тонирование лобового стекла': 'Установка тонировочной пленки на лобовое стекло',
  'Бронирование лобового стекла': 'Установка защитной пленки на лобовое стекло',
  'Малярные работы': 'Локальный окрас элемента',
  'Выпрямление вмятин без покраски': 'Выпрямление повреждений ЛКП без окраса',
  'Реставрация ЛКП': 'Работы по лакокрасочному покрытию автомобиля, корректировка и скрытие повреждений',
  'Шумоизоляция': 'Работы по дооснащению автомобиля материалами, снижающими вибрации, шумы и посторонние звуки',
  'PPF прозрачный вкруг': 'Полная защита глянцевых кузовных элементов автомобиля',
  'PPF цветной вкруг': 'Полная защита кузовных элементов цветной пленкой',
  'PPF матовый вкруг': 'Полная защита кузовных элементов матовой пленкой',
  'ПВХ полная оклейка': 'Полная оклейка автомобиля виниловой пленкой'
};

// ── Частичные элементы кузова ───────────────────────────────────
const partElements = [
  'Передний бампер','Задний бампер','Передний бампер (доп)','Задний бампер (доп)',
  'Передняя оптика','Противотуманные фары','Задние фонари','Решетка радиатора',
  'Полоска на капот','Капот','Переднее крыло','Два передних крыла',
  'Расширители арок','Стойки вокруг лобового','Полоска на крышу','Крыша',
  'Пороги','Пороги до замка','Дверные проемы','Передняя дверь',
  'Передние двери (2 шт)','Зона под ручками (2 шт)','Зона под ручками (4 шт)',
  'Задняя дверь','Задние двери (2 шт)','Заднее крыло','Задние крылья (2 шт)',
  'Крышка багажника','Багажник (доп)','Оклейка элементов интерьера','Антихром'
];

// ── Списки услуг по категориям ───────────────────────────────────
const armServices = ['Демонтаж элементов', 'Монтаж элементов', 'Демонтаж и монтаж'];

const detailServices = [
  'Мойка кузова перед оклейкой', 'Подготовка кузова', 'Глубокая чистка кузова',
  'Полировка кузова', 'Нанесение составов на кузов', 'Химчистка салона',
  'Нанесение составов на элементы салона', 'Полировка глянцевых элементов'
];

const glassServices = [
  'Тонирование задней полусферы', 'Тонирование передних боковых стекол',
  'Тонирование лобового стекла', 'Бронирование лобового стекла'
];

const miscServices = [
  'Малярные работы', 'Выпрямление вмятин без покраски',
  'Реставрация ЛКП', 'Шумоизоляция'
];
