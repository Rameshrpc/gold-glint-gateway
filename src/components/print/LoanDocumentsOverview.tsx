import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, ScrollText, CreditCard, Camera, Database, FolderOpen, Languages } from 'lucide-react';

interface DocumentCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tamilTitle: string;
  purpose: string;
  dataSource: string;
  storage?: string;
  language: string;
}

function DocumentCard({ icon: Icon, title, tamilTitle, purpose, dataSource, storage, language }: DocumentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{tamilTitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">{purpose}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Data Source</span>
          </div>
          <p className="text-xs text-foreground pl-5">{dataSource}</p>
        </div>
        
        {storage && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Storage</span>
            </div>
            <p className="text-xs text-foreground pl-5">{storage}</p>
          </div>
        )}
        
        <div className="pt-2 flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">{language}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function LoanDocumentsOverview() {
  const documents: DocumentCardProps[] = [
    {
      icon: FileText,
      title: 'Loan Receipt',
      tamilTitle: 'கடன் ரசீது',
      purpose: 'Official loan receipt with customer information, gold items pledged, loan amounts, and payment details. Includes customer copy and office copy variants.',
      dataSource: 'loans, customers, gold_items, schemes tables',
      language: 'Bilingual (Tamil + English)',
    },
    {
      icon: Shield,
      title: 'Gold Declaration',
      tamilTitle: 'தங்க அறிவிப்பு',
      purpose: 'Customer declaration confirming ownership and authenticity of pledged gold ornaments. Contains legally binding statements.',
      dataSource: 'print_content_blocks (declarations)',
      language: 'Bilingual (Tamil + English)',
    },
    {
      icon: ScrollText,
      title: 'Terms & Conditions',
      tamilTitle: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
      purpose: 'Loan agreement terms covering interest rates, redemption procedures, auction policies, and borrower obligations.',
      dataSource: 'client_terms_conditions table',
      language: 'Tamil (configurable)',
    },
    {
      icon: CreditCard,
      title: 'KYC Documents',
      tamilTitle: 'கேஒய்சி ஆவணங்கள்',
      purpose: 'Customer identity verification documents including Aadhaar card (front & back) and PAN card images.',
      dataSource: 'customers.aadhaar_front_url, aadhaar_back_url, pan_card_url',
      storage: 'customer-documents bucket',
      language: 'Bilingual labels',
    },
    {
      icon: Camera,
      title: 'Jewel Image',
      tamilTitle: 'நகை படம்',
      purpose: 'High-quality photograph of pledged gold ornaments for visual record and verification during redemption.',
      dataSource: 'loans.jewel_photo_url',
      storage: 'loan-documents bucket',
      language: 'Bilingual (Tamil + English)',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loan Documents Overview</CardTitle>
          <CardDescription>
            These documents are automatically generated when creating a loan. Each document serves a specific purpose in the loan lifecycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.title} {...doc} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Generation Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">1</span> Loan Created
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">2</span> Data Collected
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">3</span> Images Uploaded
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">4</span> PDFs Generated
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary" className="gap-1">
              <span className="font-semibold">5</span> Print / Download
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            All documents are merged into a single PDF file for easy printing. Configure individual documents in the respective settings sections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
