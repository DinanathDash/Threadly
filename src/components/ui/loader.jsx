import React from 'react';
import InlineLoader from '@/components/ui/inline-loader';

const Loader = ({ color = "#4338CA", size = "100px", speed = "2.5s", className = "" }) => {
  return (
    <InlineLoader 
      color={color} 
      size={size} 
      speed={speed} 
      className={className} 
    />
  );
}

export default Loader;