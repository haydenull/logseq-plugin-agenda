import React, { useState } from 'react'

const Polygonal: React.FC<{}> = () => {
  return (
    <div>
      <svg height="410">
        <defs>
          <radialGradient id="r1" cx="0" cy="0" r="1">
            <stop offset="0%" stop-color="#FFB64833"></stop>
            <stop offset="100%" stop-color="#FFB64800"></stop>
          </radialGradient>
          <radialGradient id="r2" cx="1" cy="0" r="1">
            <stop offset="0%" stop-color="#FF5A4833"></stop>
            <stop offset="100%" stop-color="#FF5A4800"></stop>
          </radialGradient>
          <linearGradient id="b1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFB64833" stop-opacity="0.5"></stop>
            <stop offset="100%" stop-color="#FFB64800"></stop>
          </linearGradient>
          <linearGradient id="b2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF5A4833"></stop>
            <stop offset="100%" stop-color="#FF5A4800" stop-opacity="0.5"></stop>
          </linearGradient>
        </defs>
        <linearGradient id="b3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFB648"></stop>
          <stop offset="100%" stop-color="#FF5A48"></stop>
        </linearGradient>

        <path d="M 3,185.5 V 57 Q 49.25,27.5 99.5,27.5 T 197.5,46 T 295.5,2 V 185.5 Z" fill="url(#r1)" stroke-width="1" />
        <path d="M 3,185.5 V 57 Q 49.25,27.5 99.5,27.5 T 197.5,46 T 295.5,2 V 185.5 Z" fill="url(#r2)" stroke-width="1" />
        <path d="M 3,57 Q 49.25,27.5 99.5,27.5 T 197.5,46 T 295.5,2" fill="none" stroke="url(#b3)" stroke-width="2" />
        <circle r="4" cx="3" cy="57" fill="#FFB648" />
        <circle r="4" cx="99.5" cy="27.5" fill="#FFB648" />
        <circle r="4" cx="197.5" cy="46" fill="#FFB648" />
      <circle r="4" cx="295.5" cy="2" fill="#FFB648" />
      </svg>
    </div>
  )
}

export default Polygonal
