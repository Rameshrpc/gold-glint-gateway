// Hook for managing Sale Agreement content (13 clauses + declaration)

export interface AgreementClause {
  number: number;
  tamil: string;
  english?: string;
}

export interface SaleAgreementContent {
  // Agreement clauses (Page 2)
  clauses: AgreementClause[];
  
  // Declaration content (Page 3)
  declarationTitle: { english: string; tamil: string };
  declarationText: string;
  warningText: string;
  
  // Signature labels
  companySignature: { english: string; tamil: string };
  customerSignature: { english: string; tamil: string };
  authorisedSignatory: { english: string; tamil: string };
  nameOfCustomer: { english: string; tamil: string };
}

export function useSaleAgreementContent(): SaleAgreementContent {
  // 13 Agreement Clauses from the uploaded document (corrected Tamil spelling)
  const clauses: AgreementClause[] = [
    {
      number: 1,
      tamil: 'ஜெனித் கோல்ட்ல் என்னுடைய தங்க நகைகளை அடமானம் செய்யவில்லை அவைகளை நிறுவனத்தின் மூலமாக விற்று மொத்த தொகைகளை பெற்றுக் கொள்ள சம்மதிக்கிறேன்.',
      english: 'I declare that I am voluntarily selling my gold jewellery to Zenith Gold and receiving the agreed amount.',
    },
    {
      number: 2,
      tamil: 'ஜெனித் கோல்ட்ல் விற்பனை செய்த மேலே குறிப்பிட்டுள்ள தங்கநகைகளின் பேரில் எனக்கு எந்த உரிமையும் கிடையாது என ஒப்புக்கொள்கிறேன்.',
      english: 'I acknowledge that once sold, I have no ownership rights over the jewellery listed above.',
    },
    {
      number: 3,
      tamil: 'ஜெனித் கோல்ட்ல் தங்க நகைகளை திருப்ப கொடுக்கவோ அல்லது மறுக்கவோ நிறுவனத்திற்கு உரிமை உண்டு என்பதை நிறுவனத்தின் மூலம் தெரிந்து கொண்டு அதை ஒப்புக்கொள்கிறேன்.',
      english: 'Zenith Gold has the right to return or exchange the jewellery as per their terms.',
    },
    {
      number: 4,
      tamil: 'ஜெனித் கோல்ட்ல் குறிப்பிடப்பட்டுள்ள ஒரு மத்திலிருந்து இரண்டு மாத தவணை தேதியிலோ அல்லது வாடிக்கையாளர் பணம்செலுத்தி திருப்பிப்பெறும் தேதியிலோ அன்றைய மார்க்கெட்டின் விற்பனை விலையிலோ நிறுவனம் செலுத்தக்கோரும் இலாபம் நஷ்டம் உட்பட முழுத்தொகையும் செலுத்தி மேலே குறிப்பிட்டுள்ள நகைகளை திரும்ப பெற முடியும் என்பதையும் மேலும் நிறுவனம் செலுத்த கோரும் தொகையை குறைக்க எனக்கு எந்தவித உரிமையும் கிடையாது என்பதை தெரிந்துகொண்டு அதை ஒப்புக்கொள்கிறேன்.',
      english: 'Tenure is 1-2 months. Trade margin applies as per agreement terms. I can repurchase the jewellery by paying the full amount including profit/loss.',
    },
    {
      number: 5,
      tamil: 'ஜெனித் கோல்ட் நிறுவனம் கோரும் முழு தொகையை நான் செலுத்தும் தவறும் நகைகளை கோய் அல்லது அதற்கு ஏற்ற மாறும் தரத்திற்கு ஏற்ற நகைகளை கோய் மாற்றுக்கொள்ள நிறுவனத்திற்கு உரிமை உண்டு.',
      english: 'If full payment not made, company may sell/exchange the jewellery.',
    },
    {
      number: 6,
      tamil: 'ஜெனித் கோல்ட்ல் விற்பனை செய்த நகைகளைதிரும்ப பெற ஒரு மாதத்தில் இருந்து மாதம் மட்டுமே தவணை காலம் என்பதையும் தவணை காலகட்டத்தில் தங்கத்தின் விலை ஏற்ற இறக்கத்திற்கு ஒவ்வொரு இரண்டு மாதத்திற்கும் 10% சதவீதம் நஷ்டத்தொகையாக விற்பனை செய்த மொத்த தொகைக்கும் சேர்த்து கட்ட ஒப்புக்கொண்டு அன்றைய தொகைக்கு காசோலையாகவும் கடன் உறுதிமொழி பாத்திரமாகவும் கொடுத்துள்ளேன் வாங்கிய மொத்த தொகை மற்றும் கட்டுவதாக உறுதியளித்த தொகையை கட்டாத பட்சத்தில் விற்பனை செய்த தங்கத்தின் மூலம் எனக்கு ஏற்பட்ட பொருளாதார நஷ்டத்திற்கோ, உணர்வு நஷ்டத்திற்கோ அல்லது மன உளைச்சலுக்கோ நான் மட்டுமே பொறுப்பு நிறுவனம் எந்த விதத்திலும் பொறுப்பல்ல என உறுதியளிக்கிறேன்.',
      english: '10% loss applies per 2-month period after initial tenure. I take full responsibility for any financial or emotional loss.',
    },
    {
      number: 7,
      tamil: 'ஜெனித் கோல்ட் நிறுவனத்திற்கு நான் கொடுத்த தங்கநகையின் மூலம் நஷ்டம் ஏற்படும் பட்சத்தில் நிறுவனம் எந்த நேரத்திலும் என்னை பணம் காட்டுமாறு நிர்பந்திக்கோவோ நான் செலுத்தும் பணத்தை வாங்கவோ,மறுக்கவோ அல்லது ஜெனித் கோல்ட் விலைக்கு வாங்கிய தங்க நகைகளை திருப்ப கொடுக்காமல் மறுக்கவோ நிறுவனத்திற்கு முழு உரிமை உண்டு என்பதை தெரிந்துகொண்டு அதை ஒப்புக்கொள்கிறேன்.',
      english: 'Company has full rights to demand payment, refuse payment, or refuse to return the jewellery.',
    },
    {
      number: 8,
      tamil: 'ஜெனித் கோல்ட் மேலே குறிப்பிட்டுள்ள விற்பனை செய்த தங்க நகைகளை அனைத்தும் என்னுடைய சொந்த தங்கநகைகள் ஆகும். இவை அனைத்தும் யாரையும் ஏமாற்றியோ நகைகளின் உரிமையாளருக்கு தெரியாமலோ அல்லது திருடப்பட்டோ கொண்டு வந்த நகைகள் அல்ல என்றும் இவை அனைத்தும் எனக்கு மட்டுமே உரிமையான தங்க நகைகள் என்றும் மேலே குறிப்பிட்டுள்ள தங்க நகைகள் அனைத்தும் 22 கேரட் மற்றும் 20 கேரட் தரமுள்ள தங்க நகைகள் என்றும் உறுதி கூறுகிறேன்.',
      english: 'All jewellery sold is my own property (22K/20K purity confirmed). Not stolen or obtained fraudulently.',
    },
    {
      number: 9,
      tamil: 'ஜெனித் கோல்ட் என்னுடைய அவசர பணத் தேவைகளுக்காகவும் சொந்த விருப்பத்தின் பேரிலும் யாருடைய வற்புறுத்தலுமின்றி முழு சம்மதித்து விற்கிறேன் கொடுக்கப்பட்டுள்ள தங்க நகைகளின் உரிமையற்று இருந்தாலோ அல்லது தங்க நகைகளின் தரம் குறைவாக இருந்த பின்னர் எனக்கு ஜெனித் கோல்ட் நிறுவனம் தெரியப்படுத்தினாலோ ஜெனித் கோல்ட் நிறுவனத்திடம் இருந்து பணமாக அல்லது வங்கியின் மூலமாக பெற்றுக்கொண்ட முழு தொகையையும் எந்த நிபந்தனையும் இன்றி திருப்பி செலுத்த தயாராக இருக்கிறேன் என உறுதி கூறுகிறேன்.',
      english: 'Identity proofs are genuine and no coercion involved. I will return the full amount if any issue is found with the jewellery.',
    },
    {
      number: 10,
      tamil: 'ஜெனித் கோல்ட்ல் வாங்கிய தொகையை திரும்ப செலுத்தாதவரும் பட்சத்தில் என்னுடைய அசையும் மற்றும் அசையா சொத்துக்களில் இருந்து ஜெனித் கோல்ட் நிறுவனம் விற்று பணம் பெற்றுக்கொள்ள உரிமை அளிக்கிறேன்.',
      english: 'Company can claim from my assets if I fail to repay the amount.',
    },
    {
      number: 11,
      tamil: 'ஜெனித் கோல்ட்ல் என்னுடைய அடையாள சான்றிதழ்கள், தொழில் முறை சான்றிதழ்கள் வேலை சம்பந்தப்பட்ட சான்றிதழ்கள் மற்றும் இருப்பிட சான்றிதழ்களையும் இணைத்துள்ளேன்.',
      english: 'Aadhaar, employment, and residence details are true and attached.',
    },
    {
      number: 12,
      tamil: 'ஜெனித் கோல்ட் விற்பனை செய்த மேலே குறிப்பிட்டுள்ள எனக்கு சொந்தமான தங்கநகைகளை எந்த முன் அறிவிப்பின்றி ஜெனித் கோல்ட்ல் நிறுவனம் விற்பனை செய்யும் அல்லது அடகு வைத்து பணம் பெரும் அதற்கு எனக்கு ஜெனித் கோல்ட்ல் நிறுவனம் எந்தவித முன் அறிவிப்போ கடிதம் அனுப்பவோ கைபேசி மூலம் தெரிவிக்கவோ நிறுவனம் செய்யாது என தெரிந்து கொண்டு அதை ஒப்புக்கொள்கிறேன்.',
      english: 'SMS/notification consent provided. Company may sell/pledge without prior notice.',
    },
    {
      number: 13,
      tamil: 'மேலே குறிப்பிட்ட அனைத்து விதிமுறைகளையும் படித்து மற்றும் கேட்டும் தெரிந்து கொண்டேன் மேலும் நான் கொடுத்துள்ள அடையாள அட்டை இருப்பிடச் சான்றிதழ்கள் மற்றும் தொழில் முறை சான்றிதழ் அனைத்தும் உண்மை என உறுதியளிக்கிறேன் தவறும் பட்சத்தில் ஜெனித் கோல்ட்ல் நிறுவனம் என்மேல் எடுக்கும் அனைத்து சட்ட நடவடிக்கைகளுக்கும் கட்டுப்படுவேன் என உறுதியளிக்கிறேன்.',
      english: 'All rules read and understood, bound by agreement. I submit to all legal actions by the company if I fail.',
    },
  ];

  // Customer Selling Declaration content (Page 3)
  const declarationText = `மேலே குறிப்பிட்டுள்ள தங்க நகைகள் அனைத்தும் என்னுடைய சொந்த தங்க நகைகள் ஆகும் இவை அனைத்தும் யாரையும் ஏமாற்றியோ நகைகளின் உரிமையாளருக்கு தெரியாமலோ அல்லது திருடப்பட்டோ கொண்டு வந்த நகைகள் அல்ல என்றும் இவை அனைத்தும் எனக்கு மட்டுமே உரிமையான தங்க நகைகள் என்றும் மேலே குறிப்பிட்டுள்ள தங்க நகைகள் அனைத்தும் 22 கேரட் மற்றும் 20 கேரட் தரமுள்ள தங்க நகைகள் என்றும் உறுதி கூறுகிறேன். என்னுடைய அடையாள தேவைகளுக்காகவும் சொந்த விருப்பத்திலும் யாருடைய புறுத்தலும் இன்றி முழுமையாக விற்கிறேன். கொடுக்கப்பட்டுள்ள தங்க நகைகள் உரிமையற்று இருந்தாலோ அல்லது தங்க நகைகள் தரம் குறைவாக இருந்தால் எனக்கு ஜெனித் கோல்ட் நிறுவனம் தெரியப்படுத்தினாலோ ஜெனித் கோல்ட் நிறுவனத்திடம் இருந்து பணமாக அல்லது வங்கிய மூலமாக பெற்றுக்கொண்ட முழு தொகையையும் எந்த நிபந்தனையும் இன்றி திருப்பி செலுத்த தயாராக இருக்கிறேன் என உறுதி கூறுகிறேன். தவறும் பட்சத்தில் என்னுடைய அசையும் மற்றும் அசைய சொத்துக்களில் இருந்து ஜெனித் கோல்ட் நிறுவனம் பணம் பெற்றுக்கொள்ள உரிமை அளிக்கிறேன் மேலும் என்னுடைய அடையாள அட்டை இருப்பிடச் சான்றிதழ்கள் மற்றும் தொழில் முறை சான்றிதழ் அனைத்தும் உண்மை என உறுதி கூறுகிறேன். தவறும் பட்சத்தில் ஜெனித் கோல்ட் நிறுவனம் என்மேல் எடுக்கும் அனைத்து நடவடிக்கைகளுக்கும் கட்டுப்படுவேன் என உறுதியளிக்கிறேன்.`;

  const warningText = 'ஜெனித் கோல்ட் நிறுவனத்தின் மீது எந்தவித காவல் நிலைய புகாரும் அளிக்கமாட்டேன் என்று உறுதி அளிக்கிறேன்.';

  return {
    clauses,
    declarationTitle: {
      english: 'Customer Selling Declaration',
      tamil: 'வாடிக்கையாளர் விற்பனை அறிவிப்பு',
    },
    declarationText,
    warningText,
    companySignature: {
      english: 'For Zenith Gold',
      tamil: 'ஜெனித் கோல்ட்',
    },
    customerSignature: {
      english: 'Customer Signature',
      tamil: 'வாடிக்கையாளர் கையொப்பம்',
    },
    authorisedSignatory: {
      english: 'Authorised Signatory',
      tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பமிடுபவர்',
    },
    nameOfCustomer: {
      english: 'Name of Customer',
      tamil: 'வாடிக்கையாளர் பெயர்',
    },
  };
}
