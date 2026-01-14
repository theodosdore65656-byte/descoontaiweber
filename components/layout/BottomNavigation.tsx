
import React from 'react';
import { Home, Search, Store, Settings } from 'lucide-react';

export type NavTab = 'home' | 'search' | 'shops' | 'settings';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: NavTab; icon: React.ElementType }[] = [
    { id: 'home', icon: Home },
    { id: 'search', icon: Search },
    { id: 'shops', icon: Store },
    { id: 'settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-center w-full h-full transition-all duration-200 group relative`}
            >
              {/* Active Indicator Background */}
              {isActive && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-brand-50 rounded-2xl -z-10 animate-in zoom-in-50 duration-200" />
              )}

              <Icon 
                size={28} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
