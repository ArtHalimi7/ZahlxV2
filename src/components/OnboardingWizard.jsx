import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Check, Percent, Users, Rocket, Plus, ChevronRight, ChevronLeft } from 'lucide-react';

const OnboardingWizard = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [taxRate, setTaxRate] = useState(18); // Default to 18%
  const [workers, setWorkers] = useState([]);
  
  // Worker registration input fields
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerError, setWorkerError] = useState('');
  const [workerSuccess, setWorkerSuccess] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);

  if (!isOpen || !user) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.setItem(`default_tax_rate_${user.id}`, taxRate.toString());
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setWorkerError('');
    setWorkerSuccess('');
    setAddingWorker(true);

    try {
      const res = await fetch('/api/auth/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emri_punetorit: workerName,
          email: workerEmail,
          password: workerPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Dështoi krijimi i punëtorit');
      }

      const data = await res.json();
      setWorkers([...workers, data]);
      setWorkerSuccess(`Punëtori ${workerName} u krijua me sukses!`);
      // Reset inputs
      setWorkerName('');
      setWorkerEmail('');
      setWorkerPassword('');
    } catch (err) {
      setWorkerError(err.message || 'Gabim gjatë krijimit të punëtorit');
    } finally {
      setAddingWorker(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-[550px] overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950 p-8 shadow-2xl"
        >
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-550">
              Hapi {step} nga 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s <= step ? 'bg-white' : 'bg-zinc-800'}`}
                />
              ))}
            </div>
          </div>

          {/* Steps Content */}
          <div className="min-h-[280px]">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-[20px] font-bold text-white flex items-center gap-2">
                    <Percent className="h-5 w-5 text-indigo-400" />
                    Konfiguro TVSH-në
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-450">
                    Zgjidh shkallën e parazgjedhur të TVSH-së që do të zbatohet automatikisht për shitjet tuaja. Këtë mund ta ndryshoni gjatë checkout-it në çdo kohë.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[0, 8, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRate(rate)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border p-5 transition ${
                        taxRate === rate
                          ? 'border-white bg-white/[0.04] text-white'
                          : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-[24px] font-bold tracking-tight">{rate}%</span>
                      <span className="mt-1 text-[11px] font-medium text-zinc-555">
                        {rate === 0 && 'Pa TVSH'}
                        {rate === 8 && 'TVSH e Ulur'}
                        {rate === 18 && 'TVSH Standarde'}
                      </span>
                      {taxRate === rate && (
                        <div className="absolute right-2 top-2 rounded-full bg-white p-0.5 text-black">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-[20px] font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    Krijo Llogarinë e Cashier-it (Opsionale)
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-450">
                    Shto punëtorët e tu që ata të kenë qasje të limituar vetëm në POS (arka për të bërë shitje) pa parë raportet tuaja financiare.
                  </p>
                </div>

                {workerError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-400">
                    {workerError}
                  </div>
                )}
                {workerSuccess && (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-[12px] text-green-400">
                    {workerSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateWorker} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Emri i punëtorit"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email i punëtorit"
                      value={workerEmail}
                      onChange={(e) => setWorkerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      required
                      placeholder="Fjalëkalimi"
                      value={workerPassword}
                      onChange={(e) => setWorkerPassword(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={addingWorker}
                      className="flex items-center gap-1.5 px-5 rounded-xl bg-white text-black font-semibold text-[13px] hover:bg-zinc-200 transition"
                    >
                      <Plus className="h-4 w-4" />
                      Shto
                    </button>
                  </div>
                </form>

                {workers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Punëtorët e shtuar ({workers.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {workers.map((w) => (
                        <span key={w.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-900 border border-white/5 text-[12px] text-zinc-350">
                          {w.emri_biznesit} ({w.email})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-6"
              >
                <div className="h-16 w-16 flex items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Rocket className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-white">Biznesi juaj u konfigurua!</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-450 max-w-[380px]">
                    Gjithçka është gati. Llogaria e biznesit <strong className="text-white">"{user.emri_biznesit}"</strong> u krijua dhe mund të filloni të shtoni produkte dhe të kryeni shitje.
                  </p>
                </div>

                <div className="w-full max-w-[320px] rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 text-left space-y-2 text-[12px] text-zinc-450">
                  <div className="flex justify-between">
                    <span>Emri i Biznesit:</span>
                    <span className="font-semibold text-white">{user.emri_biznesit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVSH e Parazgjedhur:</span>
                    <span className="font-semibold text-white">{taxRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Punëtorë të regjistruar:</span>
                    <span className="font-semibold text-white">{workers.length} punëtorë</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between pt-4 border-t border-white/[0.06]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/10 transition text-[13px] font-medium"
              >
                <ChevronLeft className="h-4 w-4" />
                Kthehu
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition text-[13px] font-semibold"
            >
              {step === 3 ? 'Filloni Menaxhimin' : 'Vazhdo'}
              {step < 3 && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingWizard;
