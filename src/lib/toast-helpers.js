import { toast } from 'sonner';

// Custom toast helpers with improved description visibility
export const highVisibilityToast = {
  success: (title, description, options = {}) => {
    return toast.success(title, {
      ...options,
      style: {
        '--description-color': 'var(--popover-foreground)',
        '--toast-description-opacity': '1',
        ...(options.style || {})
      },
      description,
      descriptionClassName: "font-medium text-current opacity-100",
    });
  },
  
  error: (title, description, options = {}) => {
    return toast.error(title, {
      ...options,
      style: {
        '--description-color': 'var(--popover-foreground)',
        '--toast-description-opacity': '1',
        ...(options.style || {})
      },
      description,
      descriptionClassName: "font-medium text-current opacity-100",
    });
  },
  
  warning: (title, description, options = {}) => {
    return toast.warning(title, {
      ...options,
      style: {
        '--description-color': 'var(--popover-foreground)',
        '--toast-description-opacity': '1',
        ...(options.style || {})
      },
      description,
      descriptionClassName: "font-medium text-current opacity-100",
    });
  },
  
  info: (title, description, options = {}) => {
    return toast.info(title, {
      ...options,
      style: {
        '--description-color': 'var(--popover-foreground)',
        '--toast-description-opacity': '1',
        ...(options.style || {})
      },
      description,
      descriptionClassName: "font-medium text-current opacity-100",
    });
  }
};

// For backward compatibility
export const enhancedToast = {
  ...toast,
  ...highVisibilityToast
};

export default enhancedToast;
