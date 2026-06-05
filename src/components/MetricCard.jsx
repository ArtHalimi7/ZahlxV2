import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const MetricCard = ({ label, value, detail, icon: Icon, tone = 'emerald', delta, className = '' }) => {
  const toneMap = {
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400',
    zinc: 'border-slate-200/60 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.04] text-slate-800 dark:text-zinc-200',
  };

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative px-4 py-6 lg:px-8 lg:py-4 ${className}`}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400 dark:text-zinc-500">{label}</p>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.1rem] tabular-nums">
            {value}
          </p>
          {detail && <p className="mt-2 text-[13px] text-slate-400 dark:text-zinc-500">{detail}</p>}
        </div>

        <div className="flex flex-col items-end gap-3">
          {Icon && (
            <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${toneMap[tone]}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
          {delta && (
            <span className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300">
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
  tone: PropTypes.oneOf(['emerald', 'zinc']),
  delta: PropTypes.string,
  className: PropTypes.string,
};
