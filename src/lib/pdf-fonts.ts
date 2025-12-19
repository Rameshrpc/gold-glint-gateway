import { Font } from '@react-pdf/renderer';

// Register Roboto with stable jsDelivr CDN URLs
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.woff', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-italic.woff', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-italic.woff', fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Register Noto Sans Tamil for Tamil text in PDFs
Font.register({
  family: 'Noto Sans Tamil',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tamil@5.0.19/files/noto-sans-tamil-tamil-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tamil@5.0.19/files/noto-sans-tamil-tamil-700-normal.woff', fontWeight: 700 },
  ],
});

// Register Noto Sans for mixed content
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.22/files/noto-sans-latin-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.0.22/files/noto-sans-latin-700-normal.woff', fontWeight: 700 },
  ],
});

// Register Poppins for headers
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.14/files/poppins-latin-400-normal.woff', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.14/files/poppins-latin-600-normal.woff', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/@fontsource/poppins@5.0.14/files/poppins-latin-700-normal.woff', fontWeight: 700 },
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
