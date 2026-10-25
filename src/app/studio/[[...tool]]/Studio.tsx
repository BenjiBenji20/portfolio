'use client';

import { useEffect, useState } from 'react';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../../sanity.config';

export function Studio() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#101112',
          color: '#8f95a0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Loading Studio...
      </div>
    );
  }

  return <NextStudio config={config} />;
}

