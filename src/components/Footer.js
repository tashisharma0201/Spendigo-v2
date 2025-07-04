import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  const footerStyles = {
    footer: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderTop: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
      padding: '2rem 1rem',
      marginTop: 'auto',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      textAlign: 'center',
    },
    projectText: {
      fontSize: '0.875rem',
      color: isDarkMode ? '#94a3b8' : '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    links: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    link: {
      color: '#20c997',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    brand: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: isDarkMode ? '#cbd5e1' : '#1e293b',
    },
    separator: {
      color: isDarkMode ? '#64748b' : '#94a3b8',
    },
  };

  return (
    <footer style={footerStyles.footer}>
      <div style={footerStyles.container}>
        <div style={footerStyles.projectText}>
          <span>Project by</span>
          <a 
            href="https://github.com/tashisharma0201" 
            target="_blank" 
            rel="noopener noreferrer"
            style={footerStyles.link}
          >
            Tashi Sharma
          </a>
        </div>
        
        <div style={footerStyles.links}>
          <span style={footerStyles.brand}>Spendigo</span>
          <span style={footerStyles.separator}>•</span>
          <a 
            href="https://github.com/tashisharma0201" 
            target="_blank" 
            rel="noopener noreferrer"
            style={footerStyles.link}
          >
            GitHub
          </a>
          <span style={footerStyles.separator}>•</span>
          <a 
            href="https://in.linkedin.com/in/tashi-sharma-97695b277" 
            target="_blank" 
            rel="noopener noreferrer"
            style={footerStyles.link}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
