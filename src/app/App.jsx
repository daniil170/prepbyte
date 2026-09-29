import { RouterProvider } from 'react-router-dom';
import { BrandIntro } from './BrandIntro/BrandIntro';
import { AppProviders } from './providers';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <BrandIntro />
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
