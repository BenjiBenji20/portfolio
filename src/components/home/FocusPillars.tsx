import Image from 'next/image';
import { FiTerminal, FiCpu, FiShield, FiCode } from 'react-icons/fi';
import type { FocusField } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

interface FocusPillarsProps {
  pillars: FocusField[];
}

function DefaultIcon({ index }: { index: number }) {
  switch (index % 4) {
    case 0:
      return <FiTerminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 1:
      return <FiCpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    case 2:
      return <FiShield className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    default:
      return <FiCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
  }
}

export function FocusPillars({ pillars }: FocusPillarsProps) {
  if (!pillars || pillars.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 pt-2">
      {pillars.map((pillar, idx) => {
        const iconUrl = urlForImage(pillar.icon);

        return (
          <div key={pillar._key || pillar.title || idx} className="p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              {iconUrl ? (
                <div className="relative w-3.5 h-3.5 shrink-0 overflow-hidden rounded-full ring-1 ring-sky-500/40">
                  <Image
                    src={iconUrl}
                    alt={pillar.icon?.alt || pillar.title}
                    fill
                    sizes="14px"
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <DefaultIcon index={idx} />
              )}
              <span>{pillar.title}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 leading-normal">
              {pillar.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
