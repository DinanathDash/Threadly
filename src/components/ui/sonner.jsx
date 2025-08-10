import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

// Custom Toaster component with improved description visibility
const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()
  
  // Add a small script to ensure styles are applied after the toast renders
  const injectStyles = () => {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .sonner-toast [data-description] { 
        color: inherit !important; 
        opacity: 1 !important; 
        font-weight: 300 !important; 
      }
    `;
    document.head.appendChild(styleTag);
  };
  
  // Run once on component mount
  if (typeof window !== 'undefined') {
    injectStyles();
  }

  return (
    <Sonner
      theme={theme}
      className="toaster group custom-toaster"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      toastOptions={{
        style: {
          "--description-color": "var(--popover-foreground)",
          "--toast-description-opacity": "1",
        },
        descriptionClassName: "font-medium text-current !opacity-100",
        customClass: "high-visibility-toast"
      }}
      {...props}
    />
  );
}

export { Toaster }
