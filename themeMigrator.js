import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
  'bg-zinc-950': 'bg-slate-50',
  'text-zinc-100': 'text-slate-900',
  'text-zinc-200': 'text-slate-800',
  'text-zinc-300': 'text-slate-700',
  'text-zinc-400': 'text-slate-500',
  'text-zinc-500': 'text-slate-400',
  'text-zinc-600': 'text-slate-400',
  'border-white/\\[0\\.06\\]': 'border-slate-200/60',
  'border-white/\\[0\\.08\\]': 'border-slate-200/60',
  'border-white/\\[0\\.05\\]': 'border-slate-200/60',
  'border-white/\\[0\\.04\\]': 'border-slate-200/60',
  'border-white/\\[0\\.14\\]': 'border-slate-300',
  'border-white/\\[0\\.12\\]': 'border-slate-300',
  'bg-white/\\[0\\.035\\]': 'bg-white/80',
  'bg-white/\\[0\\.03\\]': 'bg-white/60',
  'bg-white/\\[0\\.02\\]': 'bg-white/40',
  'bg-white/\\[0\\.04\\]': 'bg-white/50',
  'bg-white/\\[0\\.05\\]': 'bg-white/60',
  'bg-zinc-950/40': 'bg-slate-100/50',
  'bg-zinc-950/60': 'bg-white/80',
  'bg-zinc-900/90': 'bg-white/90',
  'bg-emerald-500/5': 'bg-emerald-50/50',
  'border-emerald-500/15 bg-emerald-500/10 text-emerald-300': 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  'border-emerald-500/15 bg-emerald-500/10 text-emerald-400': 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  'border-amber-500/15 bg-amber-500/10 text-amber-300': 'border-amber-500/20 bg-amber-500/10 text-amber-600',
  'border-amber-500/20 bg-amber-500/10 text-amber-400': 'border-amber-500/20 bg-amber-500/10 text-amber-600',
  'border-rose-500/15 bg-rose-500/10 text-rose-300': 'border-rose-500/20 bg-rose-500/10 text-rose-600',
  'border-rose-500/20 bg-rose-500/10 text-rose-400': 'border-rose-500/20 bg-rose-500/10 text-rose-600',
  'shadow-\\[0_20px_60px_rgba\\(0,0,0,0\\.18\\)\\]': 'shadow-[0_20px_60px_rgba(0,0,0,0.05)]',
  'shadow-\\[0_22px_70px_rgba\\(0,0,0,0\\.22\\)\\]': 'shadow-[0_22px_70px_rgba(0,0,0,0.06)]',
  'shadow-\\[0_20px_60px_rgba\\(16,185,129,0\\.1\\)\\]': 'shadow-[0_20px_60px_rgba(16,185,129,0.08)]',
  'shadow-\\[0_24px_70px_rgba\\(16,185,129,0\\.18\\)\\]': 'shadow-[0_24px_70px_rgba(16,185,129,0.22)]',
  'shadow-\\[0_0_30px_rgba\\(16,185,129,0\\.18\\)\\]': 'shadow-[0_0_30px_rgba(16,185,129,0.12)]',
  'shadow-\\[0_18px_40px_rgba\\(16,185,129,0\\.26\\)\\]': 'shadow-[0_18px_40px_rgba(16,185,129,0.35)]',
  'text-emerald-300': 'text-emerald-600',
  'text-emerald-400': 'text-emerald-600',
  'text-rose-300': 'text-rose-600',
  'text-rose-400': 'text-rose-600',
  'text-blue-400': 'text-blue-600',
  'text-purple-400': 'text-purple-600',
  'text-amber-300': 'text-amber-600',
  'text-amber-400': 'text-amber-600',
  'border-white/\\[0\\.15\\]': 'border-slate-300',
  'bg-emerald-500/12': 'bg-emerald-500/15',
  'bg-emerald-500/16': 'bg-emerald-500/20',
  'rgba\\(255,255,255,0\\.03\\)': 'rgba(0,0,0,0.01)',
  'rgba\\(255,255,255,0\\.05\\)': 'rgba(0,0,0,0.05)',
  'rgba\\(255,255,255,0\\.2\\)': 'rgba(0,0,0,0.1)',
  'rgba\\(255,255,255,0\\.4\\)': 'rgba(0,0,0,0.3)',
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
