import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePrintSettings, PrintContentBlock } from '@/hooks/usePrintSettings';
import { useClientTerms, useSaveClientTerms } from '@/hooks/useClientTerms';
import { Loader2, Plus, Trash2, Edit2, Save, X, GripVertical, Upload, ImageIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TemplatesTab } from './TemplatesTab';
import { BranchPrintSettingsTab } from './BranchPrintSettingsTab';

export function PrintSettingsTab() {
  const { 
    settings, 
    contentBlocks, 
    loading, 
    saving, 
    updateSettings, 
    updateContentBlock,
    addContentBlock,
    deleteContentBlock,
    getBlocksByType,
  } = usePrintSettings();
  
  
  // Terms & Conditions state
  const { data: terms = [], isLoading: loadingTerms } = useClientTerms('loan');
  const { mutate: saveTerms, isPending: savingTerms } = useSaveClientTerms();
  const [editingTerms, setEditingTerms] = useState<string[]>([]);
  const [isEditingTermsMode, setIsEditingTermsMode] = useState(false);

  const [editingBlock, setEditingBlock] = useState<PrintContentBlock | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState<PrintContentBlock['block_type']>('gold_declaration');
  const [newBlockEnglish, setNewBlockEnglish] = useState('');
  const [newBlockTamil, setNewBlockTamil] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('print-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('print-assets')
        .getPublicUrl(filePath);

      await updateSettings({ logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings({ logo_url: null });
      toast.success('Logo removed');
    } catch (error) {
      toast.error('Failed to remove logo');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  const handleAddBlock = async () => {
    if (!newBlockEnglish.trim() || !newBlockTamil.trim()) return;
    
    const existingBlocks = getBlocksByType(newBlockType);
    await addContentBlock({
      block_type: newBlockType,
      content_english: newBlockEnglish,
      content_tamil: newBlockTamil,
      display_order: existingBlocks.length + 1,
      is_active: true,
    });
    
    setNewBlockEnglish('');
    setNewBlockTamil('');
    setIsAddDialogOpen(false);
  };
  // Default Tamil Terms Template
  const DEFAULT_TAMIL_TERMS = [
    'என்னுடைய குடும்ப/வியாபார செலவுக்கு பணம் தேவைப்படுவதால் இந்த விண்ணப்பத்தின் பின்பக்கத்தில் அட்டவணையில் கண்டுள்ள எனக்கு பரிபூரணமாகச் சொந்தமான நகையை/நகைகளை ஈடாக வைத்துக் கொண்டு {LOAN_AMOUNT} கடன் வழங்குமாறு கேட்டுக்கொள்கிறேன்.',
    'நிறுவனத்தின் அங்கீகரிக்கப்பட்ட மதிப்பீட்டாளர்களால் இப்படிவத்தின் பின்பக்கத்தில் குறிப்பிட்ட மதிப்பு தொகை நகைகளின் விபர எடை, விலை, மதிப்பு ஆகியவற்றை ஒப்புக்கொள்கிறேன்.',
    'மேற்படி கடன் தொகைக்கு மேலே குறிப்பிடப்பட்ட வட்டியை அல்லது நிறுவனத்தால் அவ்வப்பொழுது நிர்ணயிக்கப்படும் வட்டியை செலுத்த ஒப்புக்கொள்கிறேன். மேற்படி கடன் தொகைக்கு வட்டியை கடன் பெற்ற நாளிலிருந்து மூன்று மாதத்திற்குள்ளோ அல்லது ஒவ்வொரு காலாண்டு இறுதிக்குள்ளோ இவற்றில் எது முன்பாக வருகின்றதோ அந்தத் தேதியில் அல்லது அந்த தேதி விடுமுறையாயிருப்பின் அதற்கு முந்தைய வேலை நாளில் செலுத்தி விடுகிறேன் என்றும். அவ்வாறு என்னால் செலுத்தப்படாத வட்டி பாக்கித்தொகையை நிறுவனம் நிர்ணயம் செய்யும் ஒவ்வொரு காலாண்டு இறுதியிலும் அசலுடன் சேர்ந்து அவ்வாறு வரும் தொகைக்கு ரூ.100/-க்கு வருடம் ஒன்றுக்கு மேலே குறிப்பிட்ட வட்டி விகிதத்தின்படி வட்டி சேர்த்து கூடிய அசல் வட்டித்தொகையை அல்லது நிறுவனத்தின் அதிகாரம் பெற்றவர்களுக்காவது செலுத்துகிறேன் என்றும் இதன் மூலம் உறுதியளிக்கிறேன்.',
    'நிறுவனத்தால் அவ்வப்பொழுது கடன் கணக்கு சம்மந்தமாக விதிக்கப்படும் அல்லது கணக்கில் பற்று வைக்கப்படும் கட்டணங்களுக்கு நான் கட்டுப்பட்டு செலுத்திவிடுவதாகவும் உறுதி அளிக்கிறேன்.',
    'ஆயுளுக்கு பிறகு மேற்கண்ட கணக்கிற்காக திரு. {NOMINEE_NAME} ({NOMINEE_RELATION}) அவர்களை நாமினி (Nominee) யாக நியமிக்கிறேன்.',
    'நகைக்கடன் சட்ட திட்டங்களை எந்த சமயத்திலும் அறிவிப்பின்றி திருத்தவோ அல்லது நீக்கவோ அல்லது வட்டிவிகிதம், லோன் கமிஷன் இதர செலவுகள் போன்றவைகளை அவ்வப்பொழுது நிர்ணயிக்க நிறுவனத்திற்கு முழு உரிமை உண்டு. அவைகளை உரிய நேரங்களில் செலுத்தி விடுகிறேன்.',
    'நான் தங்களுடைய நிறுவனத்தில் அடகு வைக்கும் நகைகள் வேறு எந்த வழக்கிலாவது அல்லது வேறு ஏதாவது வில்லங்கம் ஏற்பட்டு அதனால் எவ்வகையிலாவது தங்கள் நிறுவனத்திற்கு நட்டம் ஏற்படுமானால் நான் என்னுடைய சொத்துக்களைக்கொண்டு இந்த இழப்பீட்டை கொடுத்து தீர்ப்பேன் என உறுதி அளிக்கிறேன்.',
    'பாக்கித் தொகையை திருப்பிச் செலுத்த முடியாவிட்டால் ஈட்டு நகையை/நகைகளை தனிப்பட்ட முறையிலோ, பொது ஏலத்திலோ விற்க நிறுவனத்திற்கு நிறுவனத்தின் அதிகாரம் பெற்றவர்களுக்கு உரிமை உண்டு என்றும், அப்படி விற்று பெறப்பட்ட தொகையை மேற்படி நகைக்கடன் பாக்கி மற்றும் இதர செலவினங்களுக்கு சரி செய்துக் கொள்ளவும். அதன் பிறகும் கடன் பாக்கி இருந்தால் அந்த பாக்கித் தொகையை செலுத்த ஒப்புக்கொள்கிறேன். அவ்வாறு நான் செலுத்தவில்லையெனில் நிறுவனமோ அல்லது நிறுவனத்தின் அதிகாரம் பெற்றவர்களோ சகஜமாகவோ அல்லது நீதிமன்றம் மூலமாகவோ என் மீதி நடவடிக்கை எடுத்து வசூலிப்பதற்கும் சம்மதிக்கிறேன். விற்றவிலை கடன் தொகையைவிட அதிகமாக இருப்பின் கடன் பாக்கி போக மீதி உள்ள தொகையை என்னால் நிறுவனத்திற்கு வேறு எவ்வகையிலேனும் செலுத்த வேண்டிய பாக்கிக்கு வரவு வைத்தது போக மீதி தொகையை என்னுடைய கணக்கில் வட்டி இல்லாததாக வரவு வைக்கும்படி அல்லது என்னுடைய செலவில் எனக்கு அனுப்பி வைக்கும்படி கேட்டுக் கொள்கிறேன்.',
    'நகை களவு போகும்பட்சத்தில் மதிப்பீட்டாளர் மதிப்பு தொகை மட்டும் வழங்கப்படும் என்பதை அறிவேன்.',
    'என்னால் குறிப்பிட்ட கெடு காலத்திற்குள் நகையை/நகைகளை மீட்காதபட்சத்தில் இந்த கடனை அசல் வட்டி உள்பட கூடுதல் தொகைக்கு புதிதாக மேலும் ஒரு ஆண்டு காலத்திற்கு புதுப்பிக்க ஒப்புக் கொள்கிறேன். மேலும் இந்த விண்ணப்பத்தையே புது கணக்கிற்குரிய விண்ணப்பமாக பாவித்துக் கொள்வதுடன் அதில் கண்டுள்ள அனைத்து விதிமுறைகள் இந்த கணக்கிற்கும் பொருந்தக்கூடியவைகள் என ஒப்புக் கொள்கிறேன். நகைக்கடனுக்குரிய சட்டத்திட்டங்கள் மற்றும் விதிகள் புதிய கடன் கணக்கையும் கட்டுப்படுத்தக்கூடியவைகள் என ஒப்புக்கொள்கிறேன்.',
    'மேற்கண்ட கடன் சம்மந்தப்பட்ட விதிகள் நடவடிக்கைகள் அனைத்தும் எனக்கு புரியும்படி படித்துக் காட்டப்பட்டு விளக்கப்பட்டு அவைகளை நான் நன்கு புரிந்துகொண்டு அவைகளின் விளைவுகளை பற்றியும் தெரிந்துக் கொண்டும், அவைகளை ஏற்று இந்த கடன் தொகையை பெற்றிருக்கிறேன் என உறுதி கூறுகிறேன் / சான்றிடுகிறேன்.',
    'இந்தக் கடன் விண்ணப்பத்தில் குறிப்பிட்ட முகவரியை மாற்றினால் உடன் எழுத்து முலமாக தெரிவிக்கிறேன் என்றும் அவ்வாறு தெரிவிக்காவிட்டால் கடன் தொடர்பான அனைத்து அறிவிப்புகளையும் (ஏல அறிவிப்பு நோட்டீஸ் உட்பட) கடன் விண்ணப்பத்தில் குறிப்பிடப்பட்ட முகவரிக்கே அனுப்பலாம் என்பதையும் அதனால் ஏற்படும் இழப்புகளுக்கும் நிறுவனம் பொறுப்பாகாது என்பதையும் ஒப்புக்கொள்கிறேன்.',
    'தினசரி 3 மணி வரையிலும் மட்டுமே நகையை மீட்டு கொள்ள முடியும். சனி, ஞாயிறு மற்றும் அரசு விடுமுறை நாட்களில் நகையை மீட்டு கொள்ள இயலாது.',
  ];

  // Load default Tamil terms
  const loadDefaultTamilTerms = () => {
    setEditingTerms([...DEFAULT_TAMIL_TERMS]);
    setIsEditingTermsMode(true);
    toast.info('Default Tamil terms loaded. Review and save to apply.');
  };

  // Initialize editing terms from loaded data
  const startEditingTerms = () => {
    setEditingTerms(terms.map(t => t.terms_text));
    setIsEditingTermsMode(true);
  };

  const addNewTerm = () => {
    setEditingTerms([...editingTerms, '']);
  };

  const updateTerm = (index: number, value: string) => {
    const updated = [...editingTerms];
    updated[index] = value;
    setEditingTerms(updated);
  };

  const removeTerm = (index: number) => {
    setEditingTerms(editingTerms.filter((_, i) => i !== index));
  };

  const handleSaveTerms = () => {
    const validTerms = editingTerms.filter(t => t.trim() !== '');
    saveTerms({ 
      termType: 'loan', 
      terms: validTerms, 
      language: 'tamil' 
    }, {
      onSuccess: () => {
        setIsEditingTermsMode(false);
      }
    });
  };

  const cancelEditingTerms = () => {
    setEditingTerms([]);
    setIsEditingTermsMode(false);
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="content">Editable Content</TabsTrigger>
          <TabsTrigger value="footer">Header & Footer</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="branches">Branch Settings</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Print Settings</CardTitle>
              <CardDescription>Configure default print options for all documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Language / மொழி</Label>
                  <Select 
                    value={settings.language} 
                    onValueChange={(val: 'bilingual' | 'english' | 'tamil') => updateSettings({ language: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bilingual">Bilingual (English + Tamil)</SelectItem>
                      <SelectItem value="english">English Only</SelectItem>
                      <SelectItem value="tamil">Tamil Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select 
                    value={settings.paper_size} 
                    onValueChange={(val: 'A4' | 'Legal' | 'Letter') => updateSettings({ paper_size: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                      <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select 
                    value={settings.font_family} 
                    onValueChange={(val) => updateSettings({ font_family: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Noto Sans">Noto Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Agreement Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sale Agreement Settings</CardTitle>
              <CardDescription>
                Configure settings specific to Sale Agreement (Trading Format) documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name for Sale Agreements</Label>
                <Input
                  value={settings.sale_agreement_company_name || ''}
                  onChange={(e) => updateSettings({ sale_agreement_company_name: e.target.value || null })}
                  placeholder="e.g., ZAMIN GOLD (leave empty to use main company name)"
                />
                <p className="text-sm text-muted-foreground">
                  This name will appear on Sale Agreement documents as the buyer. If left empty, the main company name will be used.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Document Defaults */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Defaults</CardTitle>
              <CardDescription>Set default copies and inclusion for each document type</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="w-24 text-center">Include</TableHead>
                    <TableHead className="w-32 text-center">Copies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">Loan Receipt</p>
                        <p className="text-sm text-muted-foreground">கடன் ரசீது</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={settings.include_loan_receipt} 
                        onCheckedChange={(checked) => updateSettings({ include_loan_receipt: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={settings.loan_receipt_copies}
                        onChange={(e) => updateSettings({ loan_receipt_copies: parseInt(e.target.value) || 1 })}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">KYC Documents</p>
                        <p className="text-sm text-muted-foreground">கேஒய்சி ஆவணங்கள்</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={settings.include_kyc_documents} 
                        onCheckedChange={(checked) => updateSettings({ include_kyc_documents: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={settings.kyc_documents_copies}
                        onChange={(e) => updateSettings({ kyc_documents_copies: parseInt(e.target.value) || 1 })}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">Jewel Image</p>
                        <p className="text-sm text-muted-foreground">நகை படம்</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={settings.include_jewel_image} 
                        onCheckedChange={(checked) => updateSettings({ include_jewel_image: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={settings.jewel_image_copies}
                        onChange={(e) => updateSettings({ jewel_image_copies: parseInt(e.target.value) || 1 })}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">Gold Declaration</p>
                        <p className="text-sm text-muted-foreground">தங்க அறிவிப்பு</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={settings.include_gold_declaration} 
                        onCheckedChange={(checked) => updateSettings({ include_gold_declaration: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={settings.gold_declaration_copies}
                        onChange={(e) => updateSettings({ gold_declaration_copies: parseInt(e.target.value) || 1 })}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div>
                        <p className="font-medium">Terms & Conditions</p>
                        <p className="text-sm text-muted-foreground">விதிமுறைகள்</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={settings.include_terms_conditions} 
                        onCheckedChange={(checked) => updateSettings({ include_terms_conditions: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5" 
                        value={settings.terms_conditions_copies}
                        onChange={(e) => updateSettings({ terms_conditions_copies: parseInt(e.target.value) || 1 })}
                        className="w-20 mx-auto text-center"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Terms & Conditions Editor */}
        <TabsContent value="terms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Terms & Conditions / நிபந்தனைகளும், அறிவிப்புகளும்
                </CardTitle>
                <CardDescription>
                  Manage the full terms and conditions page for loan documents. Tamil-only or bilingual terms are supported.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!isEditingTermsMode ? (
                  <>
                    <Button onClick={loadDefaultTamilTerms} variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Load Default Tamil Terms
                    </Button>
                    <Button onClick={startEditingTerms} variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Terms
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={cancelEditingTerms} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTerms} disabled={savingTerms} size="sm">
                      {savingTerms ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Terms
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingTerms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isEditingTermsMode ? (
                <div className="space-y-4">
                  {/* Placeholder Documentation */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Available Placeholders (will be replaced at print time):</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-blue-800 dark:text-blue-200">
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{LOAN_AMOUNT}'}</code>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{CUSTOMER_NAME}'}</code>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{NOMINEE_NAME}'}</code>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{NOMINEE_RELATION}'}</code>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{PLACE}'}</code>
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs">{'{DATE}'}</code>
                    </div>
                    <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                      You can also write Tamil-only terms. English/Tamil format is optional.
                    </p>
                  </div>
                  
                  {editingTerms.map((term, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <Textarea
                        value={term}
                        onChange={(e) => updateTerm(index, e.target.value)}
                        placeholder="Enter term (Tamil or English/Tamil bilingual)"
                        className="flex-1 min-h-[100px] font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTerm(index)}
                        className="shrink-0 mt-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addNewTerm} className="w-full mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Term
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {terms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No Terms & Conditions configured</p>
                      <p className="text-sm mt-1">Click "Load Default Tamil Terms" to start with a template, or "Edit Terms" to add your own</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {terms.map((term, index) => (
                        <div key={term.id} className="p-3 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{term.terms_text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Editable Content */}
        <TabsContent value="content">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Editable Content Blocks</CardTitle>
                <CardDescription>Manage bilingual content for declarations and acknowledgments</CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gold Declaration */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="outline">Gold Declaration</Badge>
                    <span className="text-sm text-muted-foreground">தங்க அறிவிப்பு</span>
                  </h4>
                  <div className="space-y-2">
                    {getBlocksByType('gold_declaration').map((block, index) => (
                      <div key={block.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                        <div className="flex-1">
                          <p className="text-sm">{index + 1}. {block.content_english}</p>
                          <p className="text-sm text-muted-foreground">{block.content_tamil}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingBlock(block)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteContentBlock(block.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Warning */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="destructive">Warning</Badge>
                    <span className="text-sm text-muted-foreground">எச்சரிக்கை</span>
                  </h4>
                  <div className="space-y-2">
                    {getBlocksByType('warning').map((block) => (
                      <div key={block.id} className="flex items-start gap-3 p-3 border rounded-lg border-destructive/30">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{block.content_english}</p>
                          <p className="text-sm text-muted-foreground">{block.content_tamil}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingBlock(block)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Acknowledgment */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary">Acknowledgment</Badge>
                    <span className="text-sm text-muted-foreground">ஒப்புதல்</span>
                  </h4>
                  <div className="space-y-2">
                    {getBlocksByType('acknowledgment').map((block) => (
                      <div key={block.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm">{block.content_english}</p>
                          <p className="text-sm text-muted-foreground">{block.content_tamil}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingBlock(block)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Header & Footer */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Header & Footer Settings</CardTitle>
              <CardDescription>Customize logo, header slogan and footer text (bilingual)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-3">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo_url ? (
                    <div className="relative">
                      <img 
                        src={settings.logo_url} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-contain border rounded-lg bg-muted"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: Square image, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Slogan (English)</Label>
                  <Input 
                    value={settings.company_slogan_english || ''} 
                    onChange={(e) => updateSettings({ company_slogan_english: e.target.value || null })}
                    placeholder="Your trusted gold loan partner"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Slogan (Tamil)</Label>
                  <Input 
                    value={settings.company_slogan_tamil || ''} 
                    onChange={(e) => updateSettings({ company_slogan_tamil: e.target.value || null })}
                    placeholder="உங்கள் நம்பகமான தங்க கடன் பங்காளி"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Footer Text (English)</Label>
                  <Textarea 
                    value={settings.footer_english || ''} 
                    onChange={(e) => updateSettings({ footer_english: e.target.value || null })}
                    placeholder="Thank you for your business"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Footer Text (Tamil)</Label>
                  <Textarea 
                    value={settings.footer_tamil || ''} 
                    onChange={(e) => updateSettings({ footer_tamil: e.target.value || null })}
                    placeholder="உங்கள் வணிகத்திற்கு நன்றி"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
        
        {/* Branch Settings Tab */}
        <TabsContent value="branches">
          <BranchPrintSettingsTab />
        </TabsContent>
      </Tabs>
      
      {/* Edit Block Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content Block</DialogTitle>
            <DialogDescription>Update the bilingual content</DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>English Content</Label>
                <Textarea 
                  value={editingBlock.content_english} 
                  onChange={(e) => setEditingBlock({ ...editingBlock, content_english: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Tamil Content</Label>
                <Textarea 
                  value={editingBlock.content_tamil} 
                  onChange={(e) => setEditingBlock({ ...editingBlock, content_tamil: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBlock(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (editingBlock) {
                  updateContentBlock(editingBlock.id, {
                    content_english: editingBlock.content_english,
                    content_tamil: editingBlock.content_tamil,
                  });
                  setEditingBlock(null);
                }
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Block Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content Block</DialogTitle>
            <DialogDescription>Add a new bilingual content block</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Block Type</Label>
              <Select value={newBlockType} onValueChange={(val: PrintContentBlock['block_type']) => setNewBlockType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold_declaration">Gold Declaration</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="acknowledgment">Acknowledgment</SelectItem>
                  <SelectItem value="signature_labels">Signature Labels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>English Content</Label>
              <Textarea 
                value={newBlockEnglish} 
                onChange={(e) => setNewBlockEnglish(e.target.value)}
                placeholder="Enter English content..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tamil Content</Label>
              <Textarea 
                value={newBlockTamil} 
                onChange={(e) => setNewBlockTamil(e.target.value)}
                placeholder="Enter Tamil content..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddBlock}
              disabled={saving || !newBlockEnglish.trim() || !newBlockTamil.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
