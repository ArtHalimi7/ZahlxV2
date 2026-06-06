import PropTypes from 'prop-types';

const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-white/60 dark:bg-white/[0.03] ${className}`} />
);

const DashboardSkeleton = () => {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-9 w-72" />
            <SkeletonBlock className="h-4 w-56" />
          </div>
          <SkeletonBlock className="h-12 w-44 rounded-full" />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
          <SkeletonBlock className="h-40" />
        </div>

        <div className="rounded-[1.8rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-4 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.06] pb-4">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-8 w-28 rounded-full" />
          </div>

          <div className="hidden gap-0 sm:block">
            <div className="grid grid-cols-5 gap-4 border-b border-slate-200/60 dark:border-white/[0.06] py-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-4" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-4 border-b border-white/[0.03] py-5 last:border-0">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-24 justify-self-end" />
                <SkeletonBlock className="h-7 w-24 justify-self-end rounded-full" />
              </div>
            ))}
          </div>

          <div className="grid gap-3 pt-4 sm:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                  <div className="space-y-2 text-right">
                    <SkeletonBlock className="ml-auto h-4 w-20" />
                    <SkeletonBlock className="ml-auto h-6 w-16 rounded-full" />
                  </div>
                </div>
                <SkeletonBlock className="mt-3 h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

SkeletonBlock.propTypes = {
  className: PropTypes.string,
};
