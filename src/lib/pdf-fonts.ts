import { Font } from '@react-pdf/renderer';

// Register Roboto with all variants for PDF generation
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu51xIIzc.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBic6CsE.ttf', fontWeight: 700, fontStyle: 'italic' },
  ],
});

// Register Noto Sans Tamil for Tamil text in PDFs
Font.register({
  family: 'Noto Sans Tamil',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7vGo70RqKDt_EvT.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7v6pKDt_EvT.ttf', fontWeight: 700 },
  ],
});

// Register Noto Sans for mixed content
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu3mhPy0.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6Pdu3mhPy0.ttf', fontWeight: 700 },
  ],
});

// Register Poppins for headers
Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1xlFQ.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.ttf', fontWeight: 700 },
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
