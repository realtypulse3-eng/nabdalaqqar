import type { Metadata } from 'next';
import { getDictionary, getLocale } from '@/lib/i18n/get-dictionary';
import { directionFor } from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/i18n-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'RealtyPulse AI',
  description: 'Autonomous real estate brokerage intelligence platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const dict = getDictionary(locale);
  const dir = directionFor(locale);

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
