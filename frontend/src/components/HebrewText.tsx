/**
 * HebrewText Component - Displays Hebrew text with RTL support and optional Nikud
 */
import React from 'react';

interface HebrewTextProps {
  text: string;
  withNikud?: boolean;
  showFlash?: boolean;
  className?: string;
}

export const HebrewText: React.FC<HebrewTextProps> = ({
  text,
  withNikud = false,
  showFlash = false,
  className = '',
}) => {
  const classes = [
    'hebrew-text',
    withNikud ? 'hebrew-text-with-nikud' : '',
    showFlash ? 'flash-animation' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {text}
    </div>
  );
};
