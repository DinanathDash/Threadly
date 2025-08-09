import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1D9BF0',
    },
    secondary: {
      main: '#F5F5F5',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
    },
    text: {
      primary: '#000000',
      secondary: '#6B6B6B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    h1: {
      fontSize: '18px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '14px',
    },
    caption: {
      fontSize: '12px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
          borderRadius: '8px',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#EAEAEA',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '32px',
          height: '32px',
        },
      },
    },
  },
});

export default theme;
