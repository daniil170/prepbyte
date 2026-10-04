import { RouterProvider } from 'react-router-dom';
import { BrandIntro } from './BrandIntro/BrandIntro';
import { AppProviders } from './providers';
import { router } from './router';
import { CookieConsentModal } from '@shared/ui/CookieConsent';

export function App() {
  return (
    <AppProviders>
      <BrandIntro />
      <CookieConsentModal />
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
