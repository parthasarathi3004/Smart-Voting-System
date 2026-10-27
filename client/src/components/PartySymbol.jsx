import React, { useState } from 'react';

// Official Authentic Election Symbols for Tamil Nadu Political Parties (Vector SVG Code)
export const PARTY_SYMBOLS = {
  // TVK - Tamilaga Vettri Kazhagam (Official Symbol: Whistle / விசில்)
  TVK: {
    name: 'Whistle',
    tamilName: 'விசில்',
    themeColor: '#f59e0b',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="tvkWhistleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="tvkRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#78350F" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#1E293B" />
        {/* Lanyard Ring */}
        <circle cx="20" cy="56" r="7.5" fill="none" stroke="url(#tvkRing)" strokeWidth="3.5" />
        {/* Whistle Cylinder Chamber */}
        <circle cx="44" cy="56" r="21" fill="url(#tvkWhistleGrad)" stroke="#78350F" strokeWidth="2" />
        {/* Sound Vent */}
        <ellipse cx="44" cy="46" rx="7.5" ry="3.5" fill="#0F172A" />
        {/* Whistle Mouthpiece Tube */}
        <path d="M 44 38 L 84 38 L 86 48 L 44 54 Z" fill="url(#tvkWhistleGrad)" stroke="#78350F" strokeWidth="2" />
        <rect x="83" y="38" width="6" height="10" rx="1.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
        {/* Sound Waves */}
        <path d="M 72 26 Q 80 20 88 26" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 64 20 Q 76 12 88 18" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        <text x="50" y="89" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" fill="#FDE68A" textAnchor="middle">TVK • விசில்</text>
      </svg>
    )
  },

  // AIADMK - All India Anna Dravida Munnetra Kazhagam (Official Symbol: Two Leaves / இரட்டை இலை)
  AIADMK: {
    name: 'Two Leaves',
    tamilName: 'இரட்டை இலை',
    themeColor: '#10b981',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="aiadmkLeaf1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="aiadmkLeaf2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#064E3B" stroke="#10B981" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        {/* Central Stem */}
        <path d="M 50 80 Q 50 68 50 58" fill="none" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
        {/* Left Leaf */}
        <path d="M 50 60 C 33 56 19 40 22 22 C 36 22 48 36 50 58 Z" fill="url(#aiadmkLeaf1)" stroke="#ECFDF5" strokeWidth="1.5" />
        <path d="M 50 58 Q 36 40 25 26" fill="none" stroke="#ECFDF5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 44 46 Q 32 44 28 40" fill="none" stroke="#A7F3D0" strokeWidth="1" />
        <path d="M 47 38 Q 38 34 34 30" fill="none" stroke="#A7F3D0" strokeWidth="1" />
        {/* Right Leaf */}
        <path d="M 50 60 C 67 56 81 40 78 22 C 64 22 52 36 50 58 Z" fill="url(#aiadmkLeaf2)" stroke="#ECFDF5" strokeWidth="1.5" />
        <path d="M 50 58 Q 64 40 75 26" fill="none" stroke="#ECFDF5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 56 46 Q 68 44 72 40" fill="none" stroke="#A7F3D0" strokeWidth="1" />
        <path d="M 53 38 Q 62 34 66 30" fill="none" stroke="#A7F3D0" strokeWidth="1" />
        <text x="50" y="89" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" fill="#A7F3D0" textAnchor="middle">AIADMK • இரட்டை இலை</text>
      </svg>
    )
  },

  // DMK - Dravida Munnetra Kazhagam (Official Symbol: Rising Sun / உதயசூரியன்)
  DMK: {
    name: 'Rising Sun',
    tamilName: 'உதயசூரியன்',
    themeColor: '#ef4444',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="dmkSun" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#7F1D1D" stroke="#EF4444" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#18181B" />
        {/* Radiant Sun Rays */}
        <g fill="#F59E0B" stroke="#FDE047" strokeWidth="0.5">
          <polygon points="50,14 47,36 53,36" />
          <polygon points="35,18 40,38 45,35" />
          <polygon points="65,18 55,35 60,38" />
          <polygon points="23,27 35,41 39,37" />
          <polygon points="77,27 61,37 65,41" />
          <polygon points="14,40 31,46 33,42" />
          <polygon points="86,40 67,42 69,46" />
        </g>
        {/* Half Sun Disc */}
        <circle cx="50" cy="52" r="16" fill="url(#dmkSun)" stroke="#991B1B" strokeWidth="1.5" />
        {/* Twin Mountain Silhouettes */}
        <polygon points="12,73 34,44 52,68 12,73" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
        <polygon points="48,68 66,44 88,73 48,73" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="12" y="69" width="76" height="5" rx="1.5" fill="#EF4444" />
        <text x="50" y="89" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" fill="#FEF08A" textAnchor="middle">DMK • உதயசூரியன்</text>
      </svg>
    )
  },

  // BJP - Bharatiya Janata Party (Official Symbol: Lotus / தாமரை)
  BJP: {
    name: 'Lotus',
    tamilName: 'தாமரை',
    themeColor: '#f97316',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="bjpLotusCenter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="60%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>
          <linearGradient id="bjpLotusOuter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="50%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#7C2D12" stroke="#F97316" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        {/* Base Water Lily Leaves */}
        <ellipse cx="32" cy="69" rx="13" ry="5" fill="#15803D" stroke="#86EFAC" strokeWidth="1" transform="rotate(-15 32 69)" />
        <ellipse cx="68" cy="69" rx="13" ry="5" fill="#15803D" stroke="#86EFAC" strokeWidth="1" transform="rotate(15 68 69)" />
        <ellipse cx="50" cy="71" rx="15" ry="4.5" fill="#166534" stroke="#86EFAC" strokeWidth="1" />
        {/* Outermost Petals */}
        <path d="M 50 65 C 24 63 16 46 22 36 C 28 44 38 55 50 65 Z" fill="url(#bjpLotusOuter)" stroke="#FFE4E6" strokeWidth="1" />
        <path d="M 50 65 C 76 63 84 46 78 36 C 72 44 62 55 50 65 Z" fill="url(#bjpLotusOuter)" stroke="#FFE4E6" strokeWidth="1" />
        {/* Mid Petals */}
        <path d="M 50 65 C 30 57 28 36 36 26 C 40 38 46 53 50 65 Z" fill="url(#bjpLotusCenter)" stroke="#FFE4E6" strokeWidth="1" />
        <path d="M 50 65 C 70 57 72 36 64 26 C 60 38 54 53 50 65 Z" fill="url(#bjpLotusCenter)" stroke="#FFE4E6" strokeWidth="1" />
        {/* Center Main Petal */}
        <path d="M 50 65 C 42 50 42 30 50 20 C 58 30 58 50 50 65 Z" fill="#FDA4AF" stroke="#FFE4E6" strokeWidth="1.5" />
        <text x="50" y="89" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" fill="#FED7AA" textAnchor="middle">BJP • தாமரை</text>
      </svg>
    )
  },

  // NTK - Naam Tamilar Katchi (Official Symbol: Sugarcane Farmer / விவசாயி)
  NTK: {
    name: 'Sugarcane Farmer',
    tamilName: 'விவசாயி',
    themeColor: '#dc2626',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#7F1D1D" stroke="#DC2626" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#022C22" />
        {/* Sugarcane Stalk 1 (Left) */}
        <path d="M 31 78 L 31 20" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="36" x2="34" y2="36" stroke="#FEF08A" strokeWidth="2" />
        <line x1="28" y1="52" x2="34" y2="52" stroke="#FEF08A" strokeWidth="2" />
        <path d="M 31 28 Q 17 22 15 15" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 31 44 Q 15 38 17 30" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        {/* Sugarcane Stalk 2 (Right) */}
        <path d="M 69 78 L 69 20" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <line x1="66" y1="36" x2="72" y2="36" stroke="#FEF08A" strokeWidth="2" />
        <line x1="66" y1="52" x2="72" y2="52" stroke="#FEF08A" strokeWidth="2" />
        <path d="M 69 28 Q 83 22 85 15" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 69 44 Q 85 38 83 30" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
        {/* Farmer Center Figure */}
        <ellipse cx="50" cy="33" rx="6.5" ry="5.5" fill="#F59E0B" />
        <circle cx="50" cy="36" r="4.5" fill="#FED7AA" />
        <path d="M 43 44 L 57 44 L 60 74 L 40 74 Z" fill="#EF4444" stroke="#FEE2E2" strokeWidth="1" />
        <path d="M 43 44 Q 48 56 46 70" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
        <path d="M 43 47 L 31 49" stroke="#FED7AA" strokeWidth="3" strokeLinecap="round" />
        <path d="M 57 47 L 69 49" stroke="#FED7AA" strokeWidth="3" strokeLinecap="round" />
        <text x="50" y="89" fontSize="9" fontFamily="sans-serif" fontWeight="bold" fill="#FEF08A" textAnchor="middle">NTK • விவசாயி</text>
      </svg>
    )
  },

  // INC - Indian National Congress (Official Symbol: Hand / கை)
  INC: {
    name: 'Hand',
    tamilName: 'கை சின்னம்',
    themeColor: '#3b82f6',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        {/* Wrist Base */}
        <rect x="42" y="66" width="16" height="12" rx="2.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Palm */}
        <path d="M 34 50 C 34 65 42 67 50 67 C 58 67 66 65 66 50 Z" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        {/* Thumb */}
        <path d="M 34 52 C 26 48 24 38 30 36 C 34 35 36 42 38 48 Z" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        {/* Fingers */}
        <rect x="38" y="24" width="7" height="28" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        <rect x="46" y="20" width="7.5" height="32" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        <rect x="54" y="24" width="7" height="28" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        <rect x="62" y="32" width="6.5" height="20" rx="3" fill="#F8FAFC" stroke="#1E40AF" strokeWidth="2" />
        <text x="50" y="89" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" fill="#93C5FD" textAnchor="middle">INC • கை</text>
      </svg>
    )
  },

  // PMK - Pattali Makkal Katchi (Official Symbol: Mango / மாம்பழம்)
  PMK: {
    name: 'Mango',
    tamilName: 'மாம்பழம்',
    themeColor: '#eab308',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="pmkMango" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#713F12" stroke="#EAB308" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <path d="M 52 26 C 68 18 78 24 74 36 C 64 38 56 32 52 26 Z" fill="#22C55E" stroke="#86EFAC" strokeWidth="1.5" />
        <path d="M 50 34 Q 48 24 54 20" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        <path d="M 48 30 C 64 30 78 44 76 60 C 74 74 60 78 48 76 C 34 74 24 64 26 50 C 28 36 38 30 48 30 Z" fill="url(#pmkMango)" stroke="#B45309" strokeWidth="2" />
        <text x="50" y="89" fontSize="9" fontFamily="sans-serif" fontWeight="bold" fill="#FEF08A" textAnchor="middle">PMK • மாம்பழம்</text>
      </svg>
    )
  },

  // DMDK - Desiya Murpokku Dravida Kazhagam (Official Symbol: Murasu / முரசு)
  DMDK: {
    name: 'Murasu',
    tamilName: 'முரசு',
    themeColor: '#ec4899',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#831843" stroke="#EC4899" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <line x1="22" y1="26" x2="78" y2="74" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="78" y1="26" x2="22" y2="74" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 26 42 Q 50 48 74 42 L 68 68 Q 50 76 32 68 Z" fill="#DC2626" stroke="#F87171" strokeWidth="2" />
        <ellipse cx="50" cy="42" rx="24" ry="7.5" fill="#FEF3C7" stroke="#92400E" strokeWidth="2" />
        <path d="M 26 44 L 40 71 L 50 44 L 60 71 L 74 44" fill="none" stroke="#FBBF24" strokeWidth="2" />
        <text x="50" y="89" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" fill="#FBCFE8" textAnchor="middle">DMDK • முரசு</text>
      </svg>
    )
  },

  // MNM - Makkal Needhi Maiam (Official Symbol: Battery Torch / டார்ச் லைட்)
  MNM: {
    name: 'Torchlight',
    tamilName: 'டார்ச் லைட்',
    themeColor: '#6366f1',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#312E81" stroke="#6366F1" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <polygon points="46,38 78,16 84,46" fill="#FDE047" opacity="0.35" />
        <polygon points="44,34 56,44 48,54 36,44" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2" />
        <rect x="22" y="48" width="28" height="12" rx="3" fill="#4F46E5" stroke="#A5B4FC" strokeWidth="2" transform="rotate(-40 36 54)" />
        <rect x="28" y="50" width="6" height="3" rx="1" fill="#EF4444" transform="rotate(-40 31 51)" />
        <text x="50" y="89" fontSize="9" fontFamily="sans-serif" fontWeight="bold" fill="#C7D2FE" textAnchor="middle">MNM • டார்ச்</text>
      </svg>
    )
  },

  // AMMK - Amma Makkal Munnettra Kazagam (Official Symbol: Cooker / குக்கர்)
  AMMK: {
    name: 'Cooker',
    tamilName: 'குக்கர்',
    themeColor: '#8b5cf6',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#4C1D95" stroke="#8B5CF6" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <rect x="47" y="22" width="6" height="8" rx="2" fill="#1F2937" stroke="#9CA3AF" strokeWidth="1" />
        <path d="M 32 36 L 68 36 L 64 30 L 36 30 Z" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
        <path d="M 30 38 L 70 38 L 68 67 C 68 73 32 73 32 67 Z" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
        <rect x="66" y="34" width="22" height="6" rx="3" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
        <path d="M 30 46 C 22 46 22 56 30 56" fill="none" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
        <text x="50" y="89" fontSize="9" fontFamily="sans-serif" fontWeight="bold" fill="#DDD6FE" textAnchor="middle">AMMK • குக்கர்</text>
      </svg>
    )
  },

  // VCK - Viduthalai Chiruthaigal Katchi (Official Symbol: Pot / பானை)
  VCK: {
    name: 'Clay Pot',
    tamilName: 'பானை',
    themeColor: '#06b6d4',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="vckPot" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="60%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#164E63" stroke="#06B6D4" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <ellipse cx="50" cy="32" rx="16" ry="5" fill="#FDBA74" stroke="#9A3412" strokeWidth="2" />
        <ellipse cx="50" cy="32" rx="11" ry="2.5" fill="#431407" />
        <path d="M 38 33 L 34 40 L 66 40 L 62 33 Z" fill="url(#vckPot)" />
        <circle cx="50" cy="55" r="21" fill="url(#vckPot)" stroke="#7C2D12" strokeWidth="2" />
        <path d="M 32 50 Q 50 58 68 50" fill="none" stroke="#FED7AA" strokeWidth="1.5" />
        <path d="M 34 58 Q 50 66 66 58" fill="none" stroke="#FED7AA" strokeWidth="1.5" />
        <text x="50" y="89" fontSize="9.5" fontFamily="sans-serif" fontWeight="bold" fill="#A5F3FC" textAnchor="middle">VCK • பானை</text>
      </svg>
    )
  },

  // CPI & CPI(M) - Communist Parties (Official Symbol: Ears of Corn & Sickle / Hammer & Sickle)
  CPI: {
    name: 'Ears of Corn & Sickle',
    tamilName: 'நெற்கதிர் அரிவாள்',
    themeColor: '#b91c1c',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#881337" stroke="#E11D48" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <polygon points="50,18 53,26 62,26 55,31 57,39 50,34 43,39 45,31 38,26 47,26" fill="#FACC15" />
        <path d="M 32 64 C 24 50 28 34 44 26 C 36 34 36 46 44 54 C 48 58 54 60 62 60 C 50 66 38 68 32 64 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="58" y="58" width="15" height="6" rx="2" fill="#B45309" transform="rotate(35 65 61)" />
        <rect x="36" y="38" width="28" height="6.5" rx="1.5" fill="#E2E8F0" transform="rotate(-45 50 41)" />
        <rect x="58" y="24" width="9" height="13" rx="2" fill="#64748B" transform="rotate(-45 62 30)" />
        <text x="50" y="89" fontSize="9" fontFamily="sans-serif" fontWeight="bold" fill="#FECDD3" textAnchor="middle">CPI • அரிவாள்</text>
      </svg>
    )
  },
  'CPI(M)': {
    name: 'Hammer, Sickle and Star',
    tamilName: 'அரிவாள் சுத்தியல்',
    themeColor: '#991b1b',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#881337" stroke="#E11D48" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="#0F172A" />
        <polygon points="50,18 53,26 62,26 55,31 57,39 50,34 43,39 45,31 38,26 47,26" fill="#FACC15" />
        <path d="M 32 64 C 24 50 28 34 44 26 C 36 34 36 46 44 54 C 48 58 54 60 62 60 C 50 66 38 68 32 64 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="58" y="58" width="15" height="6" rx="2" fill="#B45309" transform="rotate(35 65 61)" />
        <rect x="36" y="38" width="28" height="6.5" rx="1.5" fill="#E2E8F0" transform="rotate(-45 50 41)" />
        <rect x="58" y="24" width="9" height="13" rx="2" fill="#64748B" transform="rotate(-45 62 30)" />
        <text x="50" y="89" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" fill="#FECDD3" textAnchor="middle">CPI(M) • சுத்தியல்</text>
      </svg>
    )
  }
};

// Helper to get party metadata
export function getPartyInfo(party) {
  const cleanParty = String(party || '').trim();
  return PARTY_SYMBOLS[cleanParty] || PARTY_SYMBOLS[cleanParty.toUpperCase()] || null;
}

// Reusable Party Symbol Component: renders high-def SVG or handles image fallback
export default function PartySymbol({ party, symbolUrl, className = 'w-10 h-10', showLabel = false, labelClassName = '' }) {
  const [imgError, setImgError] = useState(false);

  // Normalize party name lookup
  const cleanParty = String(party || '').trim();
  const partyInfo = PARTY_SYMBOLS[cleanParty] || PARTY_SYMBOLS[cleanParty.toUpperCase()];

  // 1. Prioritize authentic built-in vector SVG symbol for guaranteed offline rendering & zero broken images
  if (partyInfo && partyInfo.svg) {
    return (
      <div className={`relative flex flex-col items-center justify-center flex-shrink-0 ${className}`}>
        {partyInfo.svg}
        {showLabel && (
          <span className={`text-[10px] font-mono font-bold text-slate-300 mt-1 text-center ${labelClassName}`}>
            {partyInfo.tamilName}
          </span>
        )}
      </div>
    );
  }

  // 2. If party not in list, try custom image URL if available
  const hasValidCustomUrl = symbolUrl && !symbolUrl.includes('wikimedia.org') && !imgError;
  if (hasValidCustomUrl) {
    return (
      <div className={`relative flex flex-col items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src={symbolUrl}
          alt={`${cleanParty} Symbol`}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
        {showLabel && partyInfo && (
          <span className={`text-[10px] font-mono font-bold text-slate-300 mt-1 text-center ${labelClassName}`}>
            {partyInfo.tamilName}
          </span>
        )}
      </div>
    );
  }

  // 3. Fallback for independent candidates or unknown parties
  return (
    <div className={`rounded-xl bg-navy-800 border border-white/20 flex flex-col items-center justify-center text-cyber-cyan flex-shrink-0 ${className}`}>
      <span className="text-xs font-mono font-black">{cleanParty.slice(0, 3)}</span>
      <span className="text-[8px] font-mono text-slate-400">சின்னம்</span>
    </div>
  );
}

