import { Font } from '@react-pdf/renderer';

// Register English fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', 
      fontWeight: 400 
    },
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', 
      fontWeight: 700 
    },
  ],
});

// Register Catamaran font (supports both English and Tamil)
Font.register({
  family: 'Catamaran',
  fonts: [
    { 
      src: 'https://cdn.jsdelivr.net/gh/AravindIM/Catamaran@2.0/fonts/Catamaran-Regular.ttf', 
      fontWeight: 400 
    },
    { 
      src: 'https://cdn.jsdelivr.net/gh/AravindIM/Catamaran@2.0/fonts/Catamaran-Bold.ttf', 
      fontWeight: 700 
    },
  ],
});

export const fontFamilies = {
  english: 'Roboto',
  tamil: 'Catamaran',
  bilingual: 'Catamaran',
};

export const getPaperSize = (size: string) => {
  switch (size) {
    case 'a4':
      return { width: 595, height: 842 };
    case 'a5':
      return { width: 420, height: 595 };
    case 'thermal_80':
      return { width: 226, height: 'auto' };
    case 'thermal_58':
      return { width: 164, height: 'auto' };
    default:
      return { width: 595, height: 842 };
  }
};
