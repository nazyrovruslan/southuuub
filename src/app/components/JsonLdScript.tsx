/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface JsonLdScriptProps {
  data: {
    page?: any;
    site?: any;
  };
}

export default function JsonLdScript({ data }: JsonLdScriptProps) {
  const [scriptContent, setScriptContent] = useState<string>('');

  useEffect(() => {
    if (data) {
      const schemas = [
        ...(data.page?.schema_json_ld ? [data.page.schema_json_ld] : []),
        ...(data.site?.schema_json_ld || []),
      ];

      if (schemas.length > 0) {
        setScriptContent(JSON.stringify(schemas));
      }
    }
  }, [data]);

  if (!scriptContent) return null;

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
      strategy="afterInteractive"
    />
  );
}