// Skills, grouped for the picker. Keep names short — they're used for matching,
// so changing one later means existing extras' data won't match the new name.
export const SKILL_GROUPS: { title: string; options: string[] }[] = [
  {
    title: 'Stunts & action',
    options: ['Stunt work', 'Martial arts', 'Boxing', 'Firearms (licensed)'],
  },
  {
    title: 'Performance',
    options: ['Acting / improv', 'Dancing', 'Singing', 'Musical instrument', 'Sign language'],
  },
  {
    title: 'Driving & equipment',
    options: ['Driving (manual)', 'Motorbike', 'Horse riding'],
  },
  {
    title: 'Sport & fitness',
    options: ['Swimming', 'Cycling', 'Rowing', 'Gymnastics / yoga'],
  },
];

// The same skills as one flat list (used by filters and anywhere that doesn't need groups)
export const SKILL_OPTIONS: string[] = SKILL_GROUPS.flatMap((group) => group.options);

// Languages, grouped for the picker
export const LANGUAGE_GROUPS: { title: string; options: string[] }[] = [
  { title: 'English & Irish', options: ['English', 'Irish'] },
  { title: 'Romance (Latin)', options: ['French', 'Spanish', 'Portuguese'] },
  { title: 'Germanic', options: ['German', 'Dutch'] },
  { title: 'Nordic', options: ['Swedish', 'Norwegian', 'Danish', 'Finnish', 'Icelandic'] },
];

// The same languages as one flat list
export const LANGUAGE_OPTIONS: string[] = LANGUAGE_GROUPS.flatMap((group) => group.options);

export const AVAILABILITY_OPTIONS = [
  'Everyday',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
];