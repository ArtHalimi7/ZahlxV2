import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { ArrowUpRight, Clock3, FileText } from 'lucide-react';

const STATUS_META = {
  paguar: {
    label: 'Paguar',
    className: 'border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400',
  },
  ne_pritje: {
    label: 'Në Pritje',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
  },
  anuluar: {
    label: 'Anuluar',
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400',
  },
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
      <FileText size={22} />
    </div>
    <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Nuk ka transaksione ende</h3>
    <p className="mt-2 max-w-md text-[13px] leading-6 text-slate-400 dark:text-zinc-500">
      Sapo të regjistrohen shitjet e para, këtu do të shfaqet fluksi i fundit i faturave dhe statuset e tyre.
    </p>
  </div>
);

const DashboardTransactions = ({ transactions }) => {
  if (!transactions.length) {
    return (
      <section className="rounded-[1.8rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl">
        <div className="border-b border-slate-200/60 dark:border-transparent px-5 py-4 sm:px-6">
          <h2 className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Transaksionet e Fundit</h2>
        </div>
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="rounded-[1.8rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] shadow-[0_22px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-slate-200/60 dark:border-transparent px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Transaksionet e Fundit</h2>
          <p className="mt-1 text-[12px] text-slate-400 dark:text-zinc-500">Pamje e strukturuar për kontroll të shpejtë dhe pa mbingarkesë vizuale.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-1.5 px-3 py-2 text-[12px] text-slate-500 dark:text-zinc-400">
          <ArrowUpRight size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>{transactions.length} regjistrime</span>
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200/60 dark:border-transparent text-left text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">
              <th className="px-6 py-4 font-medium">Fatura</th>
              <th className="px-6 py-4 font-medium">Klienti</th>
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 text-right font-medium">Totali</th>
              <th className="px-6 py-4 text-right font-medium">Statusi</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx, index) => {
              const status = STATUS_META[tx.statusi] || STATUS_META.paguar;

              return (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.04 }}
                  className="border-b border-white/[0.03] transition-colors last:border-0 hover:bg-white/40 dark:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
                        <FileText size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-[13px] text-slate-700 dark:text-zinc-300">{tx.numri_fatures}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500">
                          <Clock3 size={12} />
                          <span>{tx.timeLabel}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] text-slate-800 dark:text-zinc-200">{tx.klienti}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[13px] text-slate-700 dark:text-zinc-300">{tx.dateLabel}</p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">{tx.timeLabel}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{tx.formattedTotal}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:hidden">
        {transactions.map((tx, index) => {
          const status = STATUS_META[tx.statusi] || STATUS_META.paguar;

          return (
            <motion.article
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-slate-900 dark:text-zinc-100">{tx.klienti}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-zinc-500">{tx.numri_fatures}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{tx.formattedTotal}</p>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-transparent pt-3 text-[11px] text-slate-400 dark:text-zinc-500">
                <span>{tx.dateLabel}</span>
                <span>{tx.timeLabel}</span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardTransactions;

DashboardTransactions.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    numri_fatures: PropTypes.string.isRequired,
    klienti: PropTypes.string.isRequired,
    dateLabel: PropTypes.string.isRequired,
    timeLabel: PropTypes.string.isRequired,
    formattedTotal: PropTypes.string.isRequired,
    statusi: PropTypes.string.isRequired,
  })).isRequired,
};
