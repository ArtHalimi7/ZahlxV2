import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import PropTypes from 'prop-types';

const MetricCard = ({ label, value, detail, icon: Icon, tone = 'indigo', delta, deltaIcon: DeltaIcon, tooltip, className = '' }) => {
  const toneMap = {
    emerald: 'border-green-500/20 bg-green-500/10 text-green-650 dark:border-green-500/15 dark:text-green-400',
    indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400',
    zinc: 'border-slate-200/60 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.04] text-slate-800 dark:text-zinc-200',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400',
  };

  const badgeToneMap = {
    emerald: 'border-green-500/20 bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    zinc: 'border-slate-200/60 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-300',
    amber: 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative px-5 py-6 sm:px-6 xl:px-8 xl:py-4 ${className}`}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-zinc-500">
            {label}
            {tooltip && (
              <span className="group/tooltip relative inline-block cursor-help print:hidden">
                <Info size={11} className="text-slate-400 dark:text-zinc-500 transition hover:text-indigo-555" />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-black/95 border border-slate-200/20 px-2.5 py-2 text-[10px] font-medium leading-normal text-white shadow-xl opacity-0 transition group-hover/tooltip:opacity-100 normal-case tracking-normal">
                  {tooltip}
                </span>
              </span>
            )}
          </p>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.1rem] tabular-nums">
            {value}
          </p>
          {detail && <p className="mt-2 text-[13px] text-slate-400 dark:text-zinc-500">{detail}</p>}
        </div>

        <div className="flex flex-col items-end gap-3 font-medium">
          {Icon && (
            <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${toneMap[tone]}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
          {delta && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeToneMap[tone]}`}>
              {DeltaIcon && <DeltaIcon size={11} className="shrink-0" />}
              {delta}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default MetricCard;

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  detail: PropTypes.string,
  icon: PropTypes.elementType,
  tone: PropTypes.oneOf(['emerald', 'indigo', 'zinc', 'amber', 'rose']),
  delta: PropTypes.string,
  deltaIcon: PropTypes.elementType,
  tooltip: PropTypes.string,
  className: PropTypes.string,
};
