// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock lucide-react icons for all tests
// This prevents errors from SVGs not rendering in the JSDOM environment
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');

  // A proxy to mock any named export from lucide-react that looks like a component
  return new Proxy(originalModule, {
    get: (target, prop) => {
      if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        // Return a simple div with a data-testid for any icon component
        return (props: any) => <div data-testid={`mock-icon-${prop}`} {...props} />;
      }
      // Return actual exports for non-component exports (like the 'icons' object)
      return target[prop];
    },
  });
});
