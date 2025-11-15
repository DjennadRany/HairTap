import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface BookingActionBarProps {
  primaryLabel: string;
  onPrimaryAction: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const Spinner = () => (
  <span className="flex items-center gap-2">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" aria-hidden="true" />
    <span>Veuillez patienter…</span>
  </span>
);

export const BookingActionBar: React.FC<BookingActionBarProps> = ({
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full space-y-3 md:flex md:flex-row md:items-stretch md:space-y-0 md:gap-3',
        className
      )}
    >
      <Button
        onClick={onPrimaryAction}
        disabled={primaryDisabled || primaryLoading}
        fullWidth
        size="lg"
        className="py-4 text-base font-semibold"
      >
        <span className="flex items-center justify-center gap-2" aria-live="polite" aria-busy={primaryLoading}>
          {primaryLoading ? <Spinner /> : primaryLabel}
        </span>
      </Button>
      {secondaryLabel && onSecondaryAction && (
        <Button
          onClick={onSecondaryAction}
          variant="outline"
          fullWidth
          size="lg"
          className="py-4 text-base font-semibold"
        >
          {secondaryLabel}
        </Button>
      )}
    </div>
  );
};

export default BookingActionBar;
