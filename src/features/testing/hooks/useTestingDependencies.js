import { useContext } from 'react';
import { TestingContext } from './testingContext';

export function useTestingDependencies() {
  const context = useContext(TestingContext);
  if (!context) {
    throw new Error(
      'useTestingDependencies must be used within a TestingProvider'
    );
  }
  return context;
}
