import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const MetricCard = ({ label, value, detail, icon: Icon, tone = 'emerald', delta, className = '' }) => {
  const toneMap = {
    emerald: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-400',
    zinc: 'border-white/[0.08] bg-white/[0.04] text-zinc-200',
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-[1.6rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-zinc-500">{label}</p>
          <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-zinc-100 sm:text-[2.1rem] tabular-nums">
            {value}
          </p>
          {detail && <p className="mt-2 text-[13px] text-zinc-500">{detail}</p>}
        </div>

        <div className="flex flex-col items-end gap-3">
          {Icon && (
            <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${toneMap[tone]}`}>
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
          {delta && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-300">
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
