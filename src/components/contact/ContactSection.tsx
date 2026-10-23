'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiMail, FiGithub, FiLinkedin, FiPhone, FiSend, FiCheck, FiMessageSquare } from 'react-icons/fi';
import { SiViber } from 'react-icons/si';
import type { ContactChannel, ContactData } from '@/types/sanity';
import { urlForImage } from '@/sanity/lib/image';

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
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !content) return;

    // Temporary handler (Resend & reCaptcha v3 to be connected via /api/contact)
    setIsSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setPhone('');
      setContent('');
      setCustomSubject('');
      setIsOther(false);
      setIsSubmitted(false);
    }, 4000);
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
                      onClick={() => handleSubjectClick(subj)}
                      className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                  onClick={handleOtherClick}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Write custom subject..."
                    className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2 text-xs sm:text-sm outline-none transition-colors"
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors"
              />
            </div>

            {/* Field 3: Phone/Viber */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Or call/Viber me at <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors"
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compose email..."
                className="w-full rounded-lg bg-zinc-900/60 border border-zinc-800/90 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-zinc-100 placeholder:text-zinc-600 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors resize-y"
              />
            </div>

            {/* Submit Button & Notification */}
            <div className="flex items-center justify-between pt-1">
              <div>
                {isSubmitted && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Message received! Will get back to you shortly.</span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-5 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-colors cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
            </div>
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
