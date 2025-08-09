import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * A styled channel item component for the sidebar
 */
export function ChannelItem({ icon, label, to, active, hasUnread, badge, onClick }) {
  const Component = to ? NavLink : 'button';
  
  return (
    <Component
      to={to}
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex items-center gap-2 w-full py-1 px-3 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left",
        (active || isActive) ? "bg-gray-100 dark:bg-gray-700" : "",
        "group relative"
      )}
    >
      <span className={cn(
        "text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100",
        (active || (to && Component.isActive)) && "text-gray-900 dark:text-gray-100"
      )}>
        {icon}
      </span>
      <span className={cn(
        "text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100 flex-1 truncate",
        (active || (to && Component.isActive)) && "text-gray-900 dark:text-gray-100",
        hasUnread && "font-medium"
      )}>
        {label}
      </span>
      {badge && (
        <span className="bg-blue-500 text-white text-xs py-0.5 px-1.5 rounded-md">
          {badge}
        </span>
      )}
      {hasUnread && !badge && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
      )}
    </Component>
  );
}
