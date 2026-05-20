TRUNCATE user_events, events RESTART IDENTITY CASCADE;

INSERT INTO events (title, description, category, date, price, is_free, latitude, longitude, venue, address, image_url, created_by) VALUES
(
  'Джаз на крыше',
  'Вечер живой джазовой музыки с панорамным видом на город. Дресс-код smart casual.',
  'concert',
  NOW() + INTERVAL '1 day',
  25, false, 50.4501, 30.5234,
  'Sky Lounge',
  'вул. Хрещатик, 22, Київ',
  'https://picsum.photos/seed/event1/800/600',
  1
),
(
  'Выставка современного искусства',
  'Работы молодых художников Украины и Европы.',
  'exhibition',
  NOW() + INTERVAL '3 days',
  0, true, 50.4547, 30.5308,
  'Галерея «Арсенал»',
  'Лаврська вул., 10-12, Київ',
  'https://picsum.photos/seed/event2/800/600',
  1
),
(
  'Гамлет',
  'Классическая постановка в современной интерпретации.',
  'theater',
  NOW() + INTERVAL '5 days',
  40, false, 50.4478, 30.5132,
  'Национальный академический театр',
  'вул. Богдана Хмельницького, 102, Київ',
  'https://picsum.photos/seed/event3/800/600',
  1
),
(
  'Лекция: ИИ в повседневной жизни',
  'Как технологии меняют работу, учёбу и творчество.',
  'lecture',
  NOW() + INTERVAL '6 hours',
  0, true, 50.4422, 30.5367,
  'IT-кластер',
  'вул. Дорогожицька, 1, Київ',
  'https://picsum.photos/seed/event4/800/600',
  1
),
(
  'Городской фестиваль уличной еды',
  'Кухни мира, живая музыка и мастер-классы для всей семьи.',
  'festival',
  NOW() + INTERVAL '7 days',
  15, false, 50.4265, 30.5383,
  'Парк Владимирская горка',
  'парк Володимирська гірка, Київ',
  'https://picsum.photos/seed/event5/800/600',
  1
),
(
  'Симфонический вечер',
  'Произведения Чайковского и Скрябина.',
  'concert',
  NOW() + INTERVAL '14 days',
  55, false, 50.4601, 30.5144,
  'Киевская опера',
  'вул. Володимирська, 56, Київ',
  'https://picsum.photos/seed/event6/800/600',
  1
);
