"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const MarvelScene = dynamic(() => import('./3d/MarvelScene'), { ssr: false });

export default function Background3D() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <MarvelScene />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
    </div>
  );
}
