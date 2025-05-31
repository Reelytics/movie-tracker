import React, { useState, useRef, useEffect } from 'react';

interface MenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const Menu: React.FC<MenuProps> = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 min-w-[150px] z-50">
          {children}
        </div>
      )}
    </div>
  );
};

export const MenuItem: React.FC<MenuItemProps> = ({ children, onClick, icon }) => {
  return (
    <button
      className="flex items-center w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white rounded-md"
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
