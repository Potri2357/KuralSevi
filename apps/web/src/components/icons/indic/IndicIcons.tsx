import React from 'react';

export interface IndicIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  color?: string;
}

/**
 * IndicEar (செவி / The Listening Ear)
 * Symbolizes the attentive ear of governance ("Sevi") listening to citizen voices.
 */
export function IndicEar({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Ear contour */}
      <path d="M6 8.5a4.5 4.5 0 0 1 9 0c0 3-2 4.5-3 6.5a4 4 0 0 0 1 5" />
      <path d="M9.5 9a1.5 1.5 0 0 1 3 0c0 1.5-1 2.5-2 3.5" />
      {/* Listening soundwave resonance */}
      <path d="M18 5a8 8 0 0 1 0 14" />
      <path d="M21 2a12 12 0 0 1 0 20" />
    </svg>
  );
}

/**
 * IndicScroll (ஓலைச்சுவடி / Palm Leaf Manuscript & Tirukkural Edict)
 * Classical palm-leaf manuscript representing ethical foundations and official dossiers.
 */
export function IndicScroll({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 12h8" />
      <path d="M8 15h5" />
      <circle cx="16.5" cy="15" r="1.5" />
      <path d="M2 7h2v10H2" />
      <path d="M20 7h2v10h-2" />
    </svg>
  );
}

/**
 * IndicChakra (அசோகச் சக்கரம் / Wheel of Dharma & Progress)
 * Public welfare, eternal constitutional law, and progressive governance.
 */
export function IndicChakra({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v6.5" />
      <path d="M12 14.5V21" />
      <path d="M3 12h6.5" />
      <path d="M14.5 12H21" />
      <path d="m5.6 5.6 4.6 4.6" />
      <path d="m13.8 13.8 4.6 4.6" />
      <path d="m18.4 5.6-4.6 4.6" />
      <path d="m10.2 13.8-4.6 4.6" />
    </svg>
  );
}

/**
 * IndicRupeeDbt (நேரடி மானியம் / Rupee Direct Benefit Transfer)
 * Indian Rupee with dynamic inclusion arrows symbolizing direct livelihood sanctions.
 */
export function IndicRupeeDbt({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer transfer ring */}
      <path d="M21 12a9 9 0 1 1-9-9c2.4 0 4.6.9 6.3 2.5L21 8" />
      <path d="M21 3v5h-5" />
      {/* Rupee Symbol */}
      <path d="M9 7h6" />
      <path d="M9 10h5" />
      <path d="M9 7v6c1.5 0 3-1 3-2.5S10.5 8 9 8" />
      <path d="m11.5 13 4 5" />
    </svg>
  );
}

/**
 * IndicHandloom (கைத்தறி / Weaving Shuttle & Artisan Loom)
 * NSQF Handloom, spinning, and textile artisan livelihoods.
 */
export function IndicHandloom({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Weaver's shuttle */}
      <path d="M2.5 12c3-4 6-6 10-6s7 2 9 6c-2 4-5 6-9 6s-7-2-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M8 4v2" />
      <path d="M8 18v2" />
      <path d="M16 4v2" />
      <path d="M16 18v2" />
    </svg>
  );
}

/**
 * IndicAgriSickle (அரிவாள் / Sickle & Grains of Harvest)
 * Traditional agrarian skilling, farm mechanization, and allied rural trades.
 */
export function IndicAgriSickle({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Crescent sickle blade */}
      <path d="M15 3a9 9 0 0 0-8.5 12L5 18l3 3 3-1.5A9 9 0 0 0 21 9c-3 0-5 1-6-6z" />
      {/* Handle */}
      <path d="m5 18-3 3" />
      {/* Paddy grains */}
      <path d="M18 15a2 2 0 1 1-3 0 2 2 0 0 1 3 0z" />
      <path d="M20 18a2 2 0 1 1-3 0 2 2 0 0 1 3 0z" />
    </svg>
  );
}

/**
 * IndicDiya (அகல் விளக்கு / Auspicious Lamp of Knowledge)
 * Lighting the path of rural skilling, dignity, and economic self-reliance.
 */
export function IndicDiya({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Diya Bowl */}
      <path d="M3 13c0 4.5 4 8 9 8s9-3.5 9-8H3z" />
      <path d="M2 13h20" />
      {/* Base stand */}
      <path d="M9 21h6" />
      {/* Sacred Flame */}
      <path d="M12 2c-2 3-2 5 0 8 2-3 2-5 0-8z" />
    </svg>
  );
}

/**
 * IndicNamaste (வணக்கம் / Anjali Mudra)
 * Respectful greeting, equality, and citizen-first governance.
 */
export function IndicNamaste({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Folded hands in prayer / greeting */}
      <path d="M12 3v13" />
      <path d="M12 3c-1.5 2.5-3 5-3 9 0 3 1.5 5 3 6.5" />
      <path d="M12 3c1.5 2.5 3 5 3 9 0 3-1.5 5-3 6.5" />
      <path d="M9 12c-2 1-3 3-3 6h12c0-3-1-5-3-6" />
      <path d="M7 21h10" />
    </svg>
  );
}

/**
 * IndicGopuram (கோபுரம் / Temple Gopuram & Tamil Heritage)
 * Dravidian architecture, regional civil pride, and institutional stature.
 */
export function IndicGopuram({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Pinnacle kalasams */}
      <path d="M10 2h4" />
      <path d="M12 2v2" />
      {/* Tier 1 */}
      <path d="M9 4h6l-1 3H10z" />
      {/* Tier 2 */}
      <path d="M7 7h10l-1 4H8z" />
      {/* Tier 3 */}
      <path d="M5 11h14l-1 5H6z" />
      {/* Base Arch Gateway */}
      <path d="M4 16h16v6H4z" />
      <path d="M9 22v-3a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

/**
 * IndicGramSabha (கிராம சபை / Banyan Tree of Assembly)
 * Village democratic council, community consensus, and local livelihood mapping.
 */
export function IndicGramSabha({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Spreading Tree canopy */}
      <path d="M12 3a6 6 0 0 0-5.5 3.5 5 5 0 0 0-2.5 9 5 5 0 0 0 3 1.5H17a5 5 0 0 0 3-1.5 5 5 0 0 0-2.5-9A6 6 0 0 0 12 3z" />
      {/* Trunk and roots */}
      <path d="M12 17v5" />
      <path d="M9 22h6" />
      {/* Community council members */}
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  );
}

/**
 * IndicCertificate (சான்றிதழ் / NSQF Sanad & Credential)
 * Formal skilling certification, QP-NOS recognition, and verified livelihood credential.
 */
export function IndicCertificate({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 10h6" />
      {/* Seal with ribbon */}
      <circle cx="15" cy="15" r="3" />
      <path d="m13.5 17.5-1.5 4.5 3-1.5 3 1.5-1.5-4.5" />
    </svg>
  );
}

/**
 * IndicVoiceWave (குரல் அலை / Speech Soundwave Resonance)
 * Multilingual speech intake, acoustic phonetics, and AI voice intelligence.
 */
export function IndicVoiceWave({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M4 10v4" />
      <path d="M20 10v4" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
}

/**
 * IndicToolTrowel (கொத்தனார்க் கரண்டி / Masonry & Construction)
 * NSQF construction, plumbing, masonry, and fabrication trades.
 */
export function IndicToolTrowel({
  size = 24,
  strokeWidth = 2,
  className = '',
  color = 'currentColor',
  ...props
}: IndicIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Trowel blade */}
      <path d="M12 2 4 10l5 5L17 7l2-4-7-1z" />
      {/* Crank neck */}
      <path d="m9 15 4 4" />
      {/* Handle */}
      <path d="m13 19 3 3" />
      <path d="m16 22 2-2-3-3" />
    </svg>
  );
}
