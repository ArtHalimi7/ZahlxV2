import PropTypes from 'prop-types';

const SectionPage = ({ eyebrow, title, description, accent }) => {
  return (
    <div className="relative min-h-full overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="w-full rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-400/90">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-7 text-zinc-400">{description}</p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-4 py-2 text-[13px] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
            {accent}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SectionPage;

SectionPage.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
};
