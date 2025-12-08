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

// Register Tamil fonts (Noto Sans Tamil from Google Fonts)
Font.register({
  family: 'NotoSansTamil',
  fonts: [
    { 
      src: 'https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7vGor0R.ttf', 
      fontWeight: 400 
    },
    { 
      src: 'https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7u9p70R.ttf', 
      fontWeight: 700 
    },
  ],
});

export const fontFamilies = {
  english: 'Roboto',
  tamil: 'NotoSansTamil',
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
