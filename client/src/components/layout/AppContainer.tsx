import React from 'react';

interface AppContainerProps {
  children: React.ReactNode;
}

/**
 * AppContainer component maintains a mobile-app feel on medium screens only.
 * On desktop (lg+), it allows full width for proper desktop experience.
 */
export default function AppContainer({ children }: AppContainerProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 lg:bg-transparent lg:dark:bg-transparent">
      {/* App container with responsive constraints */}
      <div 
        className="w-full bg-white dark:bg-gray-900 min-h-screen flex flex-col relative
          md:max-w-md md:mx-auto md:shadow-xl md:my-4 md:min-h-0 md:rounded-xl
          lg:max-w-none lg:shadow-none lg:my-0 lg:min-h-screen lg:rounded-none lg:mx-0"
      >
        {children}
      </div>
    </div>
  );
}
