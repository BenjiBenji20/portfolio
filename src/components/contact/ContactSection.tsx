'use client';

import { useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import {
  FiMail,
  FiGithub,
  FiLinkedin,
  FiPhone,
  FiSend,
  FiCheck,
  FiMessageSquare,
  FiAlertCircle,
  FiLoader,
} from 'react-icons/fi';
import { SiViber } from 'react-icons/si';
import type { ContactChannel, ContactData } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ContactSectionProps {
  contactData: ContactData;
}

function PlatformIcon({ channel }: { channel: ContactChannel }) {
  const customIconUrl = urlForImage(channel.icon);
  if (customIconUrl) {
    return (
      <div className="relative w-5 h-5 overflow-hidden rounded">
        <Image
          src={customIconUrl}
          alt={channel.platform}
          fill
          sizes="20px"
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  const normalized = channel.platform.toLowerCase();
  if (normalized.includes('email') || normalized.includes('mail')) {
    return <FiMail className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
  }
  if (normalized.includes('github')) {
    return <FiGithub className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
  }
  if (normalized.includes('linkedin')) {
    return <FiLinkedin className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
  }
  if (normalized.includes('viber')) {
    return <SiViber className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
  }
  if (normalized.includes('phone') || normalized.includes('call')) {
    return <FiPhone className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
  }
  return <FiMessageSquare className="w-5 h-5 text-zinc-300 group-hover:text-sky-400 transition-colors" />;
}

export function ContactSection({ contactData }: ContactSectionProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('Job Opportunity');
  const [isOther, setIsOther] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');

  // Status & feedback
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Sanity subjects excluding native 'Other concern'
  const sanitySubjects = (
    contactData.subjects && contactData.subjects.length > 0
      ? contactData.subjects
      : ['Job Opportunity', 'Technical Inquiry', 'Just saying hi!']
  ).filter(
    (s) => s.toLowerCase() !== 'other concern' && s.toLowerCase() !== 'other'
  );

  const handleSubjectClick = (subj: string) => {
    setSelectedSubject(subj);
    setIsOther(false);
  };

  const handleOtherClick = () => {
    setIsOther(true);
    setSelectedSubject('Other concern');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !content) return;
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      // 1. Generate Google reCAPTCHA v3 token just-in-time
      let recaptchaToken = '';
      if (siteKey && typeof window !== 'undefined' && window.grecaptcha) {
        try {
          await new Promise<void>((resolve) => {
            if (window.grecaptcha?.ready) {
              window.grecaptcha.ready(resolve);
            } else {
              resolve();
            }
          });
          recaptchaToken = await window.grecaptcha.execute(siteKey, {
            action: 'contact_submit',
          });
        } catch (recaptchaErr) {
          console.error('[Contact Form] reCAPTCHA generation error:', recaptchaErr);
        }
      }

      // If siteKey is present but token wasn't generated (e.g. adblocker blocking google scripts)
      if (siteKey && !recaptchaToken) {
        setStatus('error');
        setErrorMessage(
          'Security check could not load. Please disable ad-blockers or refresh and try again.'
        );
        return;
      }

      const effectiveSubject = isOther
        ? customSubject.trim() || 'Other concern'
        : selectedSubject;

      // 2. Dispatch payload to consolidated /api/contact endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: effectiveSubject,
          content: content.trim(),
          recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setStatus('error');
        setErrorMessage(
          result.error || 'Failed to dispatch email. Please try again in a moment.'
        );
        return;
      }

      // 3. Success state: clear fields & show feedback
      setStatus('success');
      setName('');
      setEmail('');
      setPhone('');
      setContent('');
      setCustomSubject('');
      setIsOther(false);

      // Auto-revert success message after 6 seconds
      setTimeout(() => {
        setStatus((current) => (current === 'success' ? 'idle' : current));
      }, 6000);
    } catch (err) {
      console.error('[Contact Form] Submit exception:', err);
      setStatus('error');
      setErrorMessage('Network error occurred. Please check your connection and retry.');
    }
  };

  // Reusable Left-side Header block
  const HeaderBlock = () => (
    <div>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-100">
        {contactData.header || "Let's connect!"}
      </h2>
      <p className="text-sm text-zinc-300 mt-3 leading-relaxed">
        Let&apos;s build high-impact systems starts with a conversation. Currently{' '}
        <strong className="text-zinc-100 font-semibold">Open for Junior Roles.</strong>
      </p>
    </div>
  );

  // Reusable Socials & Divider block
  const SocialsBlock = () => (
    <div className="w-full space-y-6">
      {/* Divider with follow-up text */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
          {contactData.followUp || 'or message me in my other socials'}
        </span>
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Contact Channels List */}
      <div className="space-y-3.5">
        {contactData.contacts?.map((channel, idx) => (
          <a
            key={channel._key || `${channel.platform}-${idx}`}
            href={channel.link}
            target={channel.link.startsWith('http') ? '_blank' : undefined}
            rel={channel.link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="group flex items-center gap-3 text-sm text-zinc-300 hover:text-sky-400 transition-colors"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-700/80 bg-zinc-900/60 flex items-center justify-center group-hover:border-sky-500/50 group-hover:bg-zinc-800/80 transition-all shadow-sm">
              <PlatformIcon channel={channel} />
            </div>
            <span className="font-medium truncate">{channel.handle}</span>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <section id="contact" className="w-full pt-10 border-t border-zinc-800/80">
      {/* Load Google reCAPTCHA v3 script non-blockingly */}
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="lazyOnload"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* DESKTOP LEFT COLUMN: Natural cohesive vertical spacing (Header + Socials) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col space-y-8">
          <HeaderBlock />
          <SocialsBlock />
        </div>

        {/* MOBILE / IPAD HEADER: Top block */}
        <div className="lg:hidden">
          <HeaderBlock />
        </div>

        {/* RIGHT COLUMN: Contact Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject Selector: Distributed with space-around */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2.5">
                Subject
              </label>
              <div className="flex flex-wrap justify-around items-center gap-2">
                {/* Predefined subjects from Sanity */}
                {sanitySubjects.map((subj) => {
                  const isActive = !isOther && selectedSubject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      disabled={status === 'submitting'}
                      onClick={() => handleSubjectClick(subj)}
                      className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? 'bg-sky-400 text-zinc-950 font-semibold shadow-sm border border-sky-300'
                          : 'border border-zinc-700/90 text-zinc-300 hover:border-zinc-500 bg-transparent font-medium'
                      }`}
                    >
                      {subj}
                    </button>
                  );
                })}

                {/* Native 'Other concern' option */}
                <button
                  type="button"
                  disabled={status === 'submitting'}
                  onClick={handleOtherClick}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOther
                      ? 'bg-sky-400 text-zinc-950 font-semibold shadow-sm border border-sky-300'
                      : 'border border-zinc-700/90 text-zinc-300 hover:border-zinc-500 bg-transparent font-medium'
                  }`}
                >
                  Other concern
                </button>
              </div>

              {/* Native custom subject input (revealed when Other concern is active) */}
              {isOther && (
                <div className="mt-3">
                  <input
                    type="text"
                    disabled={status === 'submitting'}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Write custom subject..."
                    className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2 text-xs sm:text-sm outline-none transition-colors disabled:opacity-60"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Field 1: Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Hello, I am <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                disabled={status === 'submitting'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* Field 2: Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                You can email me at <span className="text-sky-400">*</span>
              </label>
              <input
                type="email"
                required
                disabled={status === 'submitting'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* Field 3: Phone/Viber */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Or call/Viber me at <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                disabled={status === 'submitting'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* Field 4: Message Content */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Email content <span className="text-sky-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                disabled={status === 'submitting'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compose email..."
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors resize-y disabled:opacity-60"
              />
            </div>

            {/* Error Notification */}
            {status === 'error' && errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs">
                <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Submit Button & Notification */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div>
                {status === 'success' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <FiCheck className="w-4 h-4 shrink-0" />
                    <span>Message received! I will get back to you shortly.</span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-5 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <FiLoader className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiSend className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Google reCAPTCHA Terms Attribution (Allows hiding floating badge compliant with Google TOS) */}
            <p className="text-[11px] text-zinc-500 text-center sm:text-right pt-1 leading-relaxed">
              This site is protected by reCAPTCHA and the Google{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-400 transition-colors"
              >
                Privacy Policy
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-400 transition-colors"
              >
                Terms of Service
              </a>{' '}
              apply.
            </p>
          </form>
        </div>

        {/* MOBILE / IPAD SOCIALS: Positioned BELOW the contact form */}
        <div className="lg:hidden pt-2">
          <SocialsBlock />
        </div>
      </div>
    </section>
  );
}
