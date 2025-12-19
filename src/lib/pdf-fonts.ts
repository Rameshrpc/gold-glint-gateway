import { Font } from '@react-pdf/renderer';

// Register Roboto with stable jsDelivr CDN URLs (TTF format required for @react-pdf/renderer)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-italic.ttf', fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Register Noto Sans Tamil for Tamil text in PDFs
Font.register({
  family: 'Noto Sans Tamil',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@latest/tamil-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@latest/tamil-700-normal.ttf', fontWeight: 700 },
  ],
});

// Register Noto Sans for mixed content
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

// Register Poppins for headers
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

export const fontsRegistered = true;

// Font configuration for bilingual documents
export const PDF_FONTS = {
  english: 'Roboto',
  tamil: 'Noto Sans Tamil',
  mixed: 'Noto Sans',
  header: 'Poppins',
};
