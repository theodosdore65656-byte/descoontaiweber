import React from 'react';
import { Story } from '../../../types';

interface StoryCircleProps {
  story: Story;
  onClick?: () => void;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({ story, onClick }) => {
  return (
    <div 
      className="flex flex-col items-center space-y-1 min-w-[72px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-brand-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
        <div className="p-[2px] bg-white rounded-full">
          <img 
            src={story.image} 
            alt={story.name} 
            className="w-16 h-16 rounded-full object-cover"
          />
        </div>
      </div>
      <span className="text-xs text-gray-700 font-bold truncate w-full text-center group-hover:text-brand-600">
        {story.name}
      </span>
    </div>
  );
};