import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
  'bg-slate-50(?! dark:bg-zinc-950)': 'bg-[#f4f4f5] dark:bg-zinc-950',
  'text-slate-900(?! dark:text-zinc-100)': 'text-slate-900 dark:text-zinc-100',
  'text-slate-800(?! dark:text-zinc-200)': 'text-slate-800 dark:text-zinc-200',
  'text-slate-700(?! dark:text-zinc-300)': 'text-slate-700 dark:text-zinc-300',
  'text-slate-500(?! dark:text-zinc-400)': 'text-slate-500 dark:text-zinc-400',
  'text-slate-400(?! dark:text-zinc-500)': 'text-slate-400 dark:text-zinc-500',
  'border-slate-200/60(?! dark:border-white/\\[0\\.06\\])': 'border-slate-200/60 dark:border-white/[0.06]',
  'border-slate-300(?! dark:border-white/\\[0\\.12\\])': 'border-slate-300 dark:border-white/[0.12]',
  'bg-white/80(?! dark:bg-zinc-950/80)': 'bg-white/80 dark:bg-zinc-950/80',
  'bg-white/60(?! dark:bg-white/\\[0\\.03\\])': 'bg-white/60 dark:bg-white/[0.03]',
  'bg-white/50(?! dark:bg-white/\\[0\\.04\\])': 'bg-white/50 dark:bg-white/[0.04]',
  'bg-white/40(?! dark:bg-white/\\[0\\.02\\])': 'bg-white/40 dark:bg-white/[0.02]',
  'bg-slate-100/50(?! dark:bg-zinc-950/40)': 'bg-slate-100/50 dark:bg-zinc-950/40',
  'bg-white/90(?! dark:bg-zinc-900/90)': 'bg-white/90 dark:bg-zinc-900/90',
  'bg-emerald-50/50(?! dark:bg-emerald-500/5)': 'bg-emerald-50/50 dark:bg-emerald-500/5',
  
  'border-emerald-500/20 bg-emerald-500/10 text-emerald-600': 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400',
  'border-amber-500/20 bg-amber-500/10 text-amber-600': 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
  'border-rose-500/20 bg-rose-500/10 text-rose-600': 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400',

  'shadow-\\[0_20px_60px_rgba\\(0,0,0,0\\.05\\)\\]': 'shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)]',
  'shadow-\\[0_22px_70px_rgba\\(0,0,0,0\\.06\\)\\]': 'shadow-[0_22px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.22)]',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done!');
