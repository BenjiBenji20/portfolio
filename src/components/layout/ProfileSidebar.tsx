'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  FiBriefcase,
  FiMapPin,
  FiBookOpen,
  FiMail,
  FiGlobe,
  FiLinkedin,
  FiGithub,
  FiCheck,
  FiCopy,
} from 'react-icons/fi';
import type { ProfileData } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

interface ProfileSidebarProps {
  profile: ProfileData;
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const [copied, setCopied] = useState(false);

  const avatarUrl =
    urlForImage(profile.avatar) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  const copyEmail = async () => {
    if (!profile.socialLinks?.email) return;
    try {
      await navigator.clipboard.writeText(profile.socialLinks.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard permission error
    }
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0">
      <div className="flex flex-col gap-4">
        {/* Avatar & Availability indicator */}
        <div className="flex items-start gap-4 md:flex-col md:items-start">
          <div className="relative group shrink-0">
            <div className="relative h-20 w-20 md:h-52 md:w-52 overflow-hidden rounded-full ring-2 ring-zinc-800 bg-zinc-900">
              <Image
                src={avatarUrl}
                alt={profile.fullName}
                fill
                sizes="(max-width: 768px) 80px, 208px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            {profile.status.isAvailable && (
              <span
                className="absolute bottom-1 right-1 md:bottom-3 md:right-3 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-zinc-950"
                title="Available for opportunities"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            )}
          </div>

          {/* Identity: Name, Headline, Motto */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 truncate">
              {profile.fullName}
            </h1>
            <p className="text-sm font-medium text-zinc-400 mt-0.5">
              {profile.headline}
            </p>
            {profile.motto && (
              <p className="text-xs text-zinc-400 italic mt-2 leading-relaxed line-clamp-2">
                &ldquo;{profile.motto}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Status Pill */}
        {profile.status.statusMessage && (
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{profile.status.statusMessage}</span>
          </div>
        )}

        <hr className="border-zinc-800/60 my-1" />

        {/* Metadata List using React Icons */}
        <div className="flex flex-col gap-2.5 text-xs text-zinc-400">
          {/* Current Affiliation */}
          {profile.currentAffiliation && (
            <div className="flex items-start gap-2.5">
              <FiBriefcase className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-zinc-300 font-medium">
                  {profile.currentAffiliation.role}
                </span>{' '}
                <span className="text-zinc-500">at</span>{' '}
                {profile.currentAffiliation.url ? (
                  <a
                    href={profile.currentAffiliation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-300 hover:text-emerald-400 transition-colors underline decoration-zinc-700 underline-offset-2"
                  >
                    {profile.currentAffiliation.company}
                  </a>
                ) : (
                  <span className="text-zinc-300">
                    {profile.currentAffiliation.company}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-2.5">
              <FiMapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}

          {/* Education */}
          {profile.education && (
            <div className="flex items-start gap-2.5">
              <FiBookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-zinc-300">{profile.education.degree}</span>
                <span className="block text-zinc-500 text-[11px]">
                  {profile.education.institution}
                </span>
              </div>
            </div>
          )}

          {/* Email with 1-click copy */}
          {profile.socialLinks?.email && (
            <div className="flex items-center justify-between group gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <FiMail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <a
                  href={`mailto:${profile.socialLinks.email}`}
                  className="truncate text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  {profile.socialLinks.email}
                </a>
              </div>
              <button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email to clipboard"
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors shrink-0"
                title="Copy email"
              >
                {copied ? (
                  <FiCheck className="w-3 h-3 text-emerald-400" />
                ) : (
                  <FiCopy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}

          {/* Website */}
          {profile.socialLinks?.website && (
            <div className="flex items-center gap-2.5">
              <FiGlobe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-zinc-300 hover:text-emerald-400 transition-colors"
              >
                {profile.socialLinks.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {/* GitHub */}
          {profile.socialLinks?.github && (
            <div className="flex items-center gap-2.5">
              <FiGithub className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-zinc-300 hover:text-emerald-400 transition-colors"
              >
                github.com/BenjiBenji20 ↗
              </a>
            </div>
          )}

          {/* LinkedIn */}
          {profile.socialLinks?.linkedin && (
            <div className="flex items-center gap-2.5">
              <FiLinkedin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-zinc-300 hover:text-emerald-400 transition-colors"
              >
                linkedin.com/in/benji-cañones ↗
              </a>
            </div>
          )}
        </div>

        {/* Featured Skill Chips */}
        {profile.featuredSkills && profile.featuredSkills.length > 0 && (
          <>
            <hr className="border-zinc-800/60 my-1" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-2 font-mono">
                Core Stack
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.featuredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
