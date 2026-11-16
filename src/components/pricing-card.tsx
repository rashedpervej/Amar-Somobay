import { useMemo, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useRef } from 'react';
import {
  ArrowRight,
  Check,
  Cloud,
  Code2,
  Crown,
  Gauge,
  Globe2,
  Layers3,
  Sparkles,
  Zap,
} from 'lucide-react';

export type PricingBilling = 'monthly' | 'yearly';

export interface PricingFeature {
  title: string;
  detail: string;
  icon?: 'zap' | 'layers' | 'cloud' | 'globe' | 'gauge' | 'code';
}

export interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyTotal?: number;
  yearlySavingPercent?: number;
  currency?: string;
  periodLabel?: string;
  audienceLabel?: string;
  footnote?: string;
  ctaLabel?: string;
  features: PricingFeature[];
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (billing: PricingBilling) => void;
  className?: string;
}

const featureIcons = {
  zap: Zap,
  layers: Layers3,
  cloud: Cloud,
  globe: Globe2,
  gauge: Gauge,
  code: Code2,
};

function RollingDigit({ digit, reducedMotion }: { digit: number; reducedMotion: boolean }) {
  const spring = useSpring(digit, { stiffness: 150, damping: 22, mass: 0.7 });
  const y = useTransform(spring, value => `-${value * 1.08}em`);

  useMemo(() => {
    spring.set(digit);
  }, [digit, spring]);

  return (
    <span className="relative inline-block h-[1.08em] w-[0.62em] overflow-hidden align-bottom tabular-nums" aria-hidden="true">
      <motion.span
        className="absolute left-0 top-0 flex flex-col leading-[1.08]"
        style={reducedMotion ? { y: `-${digit * 1.08}em` } : { y }}
      >
        {Array.from({ length: 10 }, (_, number) => (
          <span key={number} className="h-[1.08em]">{number}</span>
        ))}
      </motion.span>
    </span>
  );
}

function RollingPrice({ value, currency, reducedMotion }: { value: number; currency: string; reducedMotion: boolean }) {
  const digits = String(Math.max(0, Math.round(value))).split('');
  return (
    <span className="inline-flex items-start font-semibold tracking-[-0.075em] text-slate-950">
      <span className="mr-1 mt-2 text-2xl font-medium tracking-normal text-slate-300">{currency}</span>
      <span className="inline-flex">
        {digits.map((digit, index) => (
          <RollingDigit key={digits.length - index} digit={Number(digit)} reducedMotion={reducedMotion} />
        ))}
      </span>
    </span>
  );
}

export function PricingCard({ plan, onSelect, className = '' }: PricingCardProps) {
  const [yearly, setYearly] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(shellRef, { once: true, margin: '0px 0px -8% 0px' });
  const prefersReducedMotion = useReducedMotion() ?? false;
  const saving = plan.yearlySavingPercent ?? (
    plan.monthlyPrice > 0
      ? Math.max(0, Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100))
      : 0
  );
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const yearlyTotal = plan.yearlyTotal ?? plan.yearlyPrice * 12;
  const motionOff = prefersReducedMotion;

  const iconMotion = motionOff
    ? {}
    : { rotate: [0, -10, 10, 0], scale: [1, 1.08, 1] };

  return (
    <motion.div
      ref={shellRef}
      initial={motionOff ? false : { opacity: 0, y: 28, filter: 'blur(12px)' }}
      animate={isInView || motionOff ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setEngaged(true)}
      onHoverEnd={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setEngaged(false);
      }}
      className={`relative isolate mx-auto w-full max-w-[440px] rounded-[34px] bg-[#f1f1f5] p-3.5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] outline-none ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[34px] opacity-0"
        animate={{ opacity: engaged ? 1 : 0 }}
        transition={{ duration: 0.45 }}
      >
        <motion.div
          className="absolute -inset-1 bg-[linear-gradient(115deg,#e8ddff_0%,#dce4ff_28%,#f8dff0_58%,#ffe6d4_100%)] blur-2xl"
          animate={motionOff ? {} : { x: ['-5%', '5%', '-5%'], y: ['-4%', '4%', '-4%'] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div
        className="relative rounded-[26px] bg-white px-6 pb-6 pt-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
        animate={motionOff ? {} : {
          y: engaged ? -5 : 0,
          boxShadow: engaged
            ? '0 24px 48px rgba(124, 94, 180, 0.18)'
            : '0 8px 24px rgba(15,23,42,0.05)',
        }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      >
        <div className="mb-6 flex min-h-7 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={engaged ? 'recommended' : 'audience'}
              initial={motionOff ? false : { y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={motionOff ? undefined : { y: -12, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600"
            >
              {engaged && <Sparkles size={13} className="text-violet-500" />}
              {engaged ? 'Recommended for you' : (plan.audienceLabel ?? 'Ideal for solo makers')}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10"
            animate={motionOff ? {} : {
              rotate: engaged ? [0, -8, 8, 0] : 0,
              backgroundColor: engaged ? '#6d5bd0' : '#0f172a',
            }}
            transition={{ duration: 0.55 }}
          >
            <Crown size={22} strokeWidth={1.8} />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">{plan.name}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{plan.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-end">
              <RollingPrice value={price} currency={plan.currency ?? '$'} reducedMotion={motionOff} />
              <span className="mb-1.5 ml-1.5 text-sm text-slate-400">/ {plan.periodLabel ?? (yearly ? 'year' : 'month')}</span>
            </div>
            <div className="relative mt-1 h-5 overflow-hidden text-xs text-slate-400" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={yearly ? 'yearly' : 'monthly'}
                  initial={motionOff ? false : { opacity: 0, filter: 'blur(5px)', y: 5 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={motionOff ? undefined : { opacity: 0, filter: 'blur(5px)', y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  {yearly ? `Billed yearly · ${plan.currency ?? '$'}${yearlyTotal.toLocaleString()} total` : 'Billed monthly · cancel anytime'}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly(value => !value)}
            className="group mb-1 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-2 text-left outline-none transition-colors hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <span className="relative h-5 w-9 rounded-full bg-slate-300 transition-colors" style={{ backgroundColor: yearly ? '#16a36a' : undefined }}>
              <motion.span
                className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                animate={{ x: yearly ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              />
            </span>
            <span className="min-w-[74px] text-[11px] font-semibold text-slate-600">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={yearly ? 'saving' : 'pay'}
                  className={yearly ? 'text-emerald-600' : ''}
                  initial={motionOff ? false : { opacity: 0, y: 5, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={motionOff ? undefined : { opacity: 0, y: -5, filter: 'blur(3px)' }}
                >
                  {yearly ? `Save ${saving}%` : 'Pay yearly'}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect(yearly ? 'yearly' : 'monthly')}
          className="group mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <span>{plan.ctaLabel ?? 'Get started'}</span>
          <span className="relative flex h-4 w-5 items-center justify-center overflow-hidden">
            <motion.span
              className="absolute"
              initial={false}
              whileHover={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight size={16} />
            </motion.span>
            <motion.span
              className="absolute -translate-x-6 opacity-0"
              whileHover={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.04 }}
            >
              <ArrowRight size={16} />
            </motion.span>
          </span>
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          {plan.footnote ?? 'No hidden fees. Change or cancel your plan at any time.'}
        </p>

        <div className="my-5 h-px bg-slate-100" />

        <ul className="space-y-4">
          {plan.features.map((feature, index) => {
            const Icon = featureIcons[feature.icon ?? 'check' as keyof typeof featureIcons] ?? Check;
            return (
              <motion.li
                key={feature.title}
                initial={motionOff ? false : { opacity: 0, y: 10 }}
                animate={isInView || motionOff ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: motionOff ? 0 : 0.12 + index * 0.08, duration: 0.35 }}
                className="group flex items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                tabIndex={0}
              >
                <motion.span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
                  whileHover={motionOff ? {} : { scale: 1.08, rotate: 8 }}
                  animate={{ color: engaged ? '#6d5bd0' : '#64748b' }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </motion.span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">{feature.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{feature.detail}</span>
                </span>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}
