/**
 * MetricCard
 * 
 * A single stat card for the dashboard.
 * Design: glass container, no gradient, no icon clutter.
 * Just the label, the number, and an optional subtle trend line.
 */
const MetricCard = ({ label, value, detail, className = '' }) => {
  return (
    <div className={`glass glass-hover p-5 sm:p-6 ${className}`}>
      <p className="text-[12px] sm:text-[13px] font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-2 text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight tabular-nums">
        {value}
      </p>
      {detail && (
        <p className="mt-1.5 text-[12px] sm:text-[13px] text-zinc-500">
          {detail}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
