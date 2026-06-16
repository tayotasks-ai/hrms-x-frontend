import fs from 'fs';
import path from 'path';

const DIR = '/Users/tayoadejuwon/Desktop/hrms/frontend/src/components';

const replacements = {
  'bg-zinc-950': 'bg-white dark:bg-zinc-950',
  'bg-zinc-900': 'bg-zinc-50 dark:bg-zinc-900',
  'bg-black': 'bg-white dark:bg-black',
  'border-zinc-800': 'border-zinc-200 dark:border-zinc-800',
  'border-zinc-850': 'border-zinc-200 dark:border-zinc-850',
  'text-zinc-100': 'text-zinc-900 dark:text-zinc-100',
  'text-zinc-50': 'text-zinc-900 dark:text-zinc-50',
  'text-zinc-200': 'text-zinc-800 dark:text-zinc-200',
  'text-zinc-400': 'text-zinc-600 dark:text-zinc-400',
  'hover:bg-zinc-900': 'hover:bg-zinc-100 dark:hover:bg-zinc-900',
  'hover:border-zinc-700': 'hover:border-zinc-300 dark:hover:border-zinc-700',
  'bg-zinc-900/50': 'bg-zinc-100/50 dark:bg-zinc-900/50',
  'bg-zinc-950/20': 'bg-zinc-50/20 dark:bg-zinc-950/20',
  'bg-zinc-950/60': 'bg-zinc-50/60 dark:bg-zinc-950/60',
  'bg-zinc-850': 'bg-zinc-100 dark:bg-zinc-850',
  'text-lime-400': 'text-lime-600 dark:text-lime-400',
  'bg-lime-400': 'bg-lime-600 dark:bg-lime-400',
  'border-lime-400': 'border-lime-600 dark:border-lime-400',
  'text-zinc-300': 'text-zinc-700 dark:text-zinc-300'
};

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    // Only replace if it doesn't already have the dark mode prefix attached
    const regex = new RegExp(`(?<!dark:)\\b${key}\\b`, 'g');
    content = content.replace(regex, value);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.vue'));
for (const file of files) {
  processFile(path.join(DIR, file));
}
processFile('/Users/tayoadejuwon/Desktop/hrms/frontend/src/App.vue');
console.log('Done!');
