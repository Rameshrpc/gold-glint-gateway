import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, User, Calendar, Phone, Mail, Briefcase, IndianRupee, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CameraCapture from '@/components/CameraCapture';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  is_active?: boolean;
}

type NomineeRelation = 'father' | 'mother' | 'spouse' | 'son' | 'daughter' | 
                       'brother' | 'sister' | 'grandfather' | 'grandmother' | 
                       'uncle' | 'aunt' | 'other';

const NOMINEE_RELATIONS: { value: NomineeRelation; label: string }[] = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'other', label: 'Other' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

interface InlineCustomerFormProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated: (customerId: string) => void;
  clientId: string;
  branches: Branch[];
  defaultBranchId?: string;
}

interface ImageUploadFieldProps {
  label: string;
  file: File | null;
  preview: string | null;
  onFileChange: (file: File | null, preview: string | null) => void;
  onCapture: () => void;
  required?: boolean;
  uploading?: boolean;
}

function ImageUploadField({ label, file, preview, onFileChange, onCapture, required, uploading }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileChange(selectedFile, reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt={label} 
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={() => onFileChange(null, null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-3 flex items-center justify-center gap-2">
            {uploading ? (
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <>
                <Button type="button" size="sm" variant="outline" onClick={onCapture}>
                  <Camera className="h-4 w-4 mr-1" /> Camera
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" /> Upload
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default function InlineCustomerForm({ 
  open, 
  onClose, 
  onCustomerCreated, 
  clientId, 
  branches,
  defaultBranchId 
}: InlineCustomerFormProps) {
  // Basic fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [branchId, setBranchId] = useState(defaultBranchId || '');
  
  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  // Additional details
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  
  // Image states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);
  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const [panCardPreview, setPanCardPreview] = useState<string | null>(null);
  
  // Camera capture
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'photo' | 'aadhaar_front' | 'aadhaar_back' | 'pan_card'>('photo');
  
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAlternatePhone('');
    setEmail('');
    setDateOfBirth('');
    setGender('');
    setBranchId(defaultBranchId || '');
    setAddress('');
    setCity('');
    setState('');
    setPincode('');
    setOccupation('');
    setMonthlyIncome('');
    setNomineeName('');
    setNomineeRelation('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadhaarFrontFile(null);
    setAadhaarFrontPreview(null);
    setAadhaarBackFile(null);
    setAadhaarBackPreview(null);
    setPanCardFile(null);
    setPanCardPreview(null);
  };

  const openCamera = (target: 'photo' | 'aadhaar_front' | 'aadhaar_back' | 'pan_card') => {
    setCameraTarget(target);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File, preview: string) => {
    switch (cameraTarget) {
      case 'photo':
        setPhotoFile(file);
        setPhotoPreview(preview);
        break;
      case 'aadhaar_front':
        setAadhaarFrontFile(file);
        setAadhaarFrontPreview(preview);
        break;
      case 'aadhaar_back':
        setAadhaarBackFile(file);
        setAadhaarBackPreview(preview);
        break;
      case 'pan_card':
        setPanCardFile(file);
        setPanCardPreview(preview);
        break;
    }
    setCameraOpen(false);
  };

  const uploadDocument = async (file: File, documentType: string, customerId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${customerId}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !branchId) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate mandatory KYC documents
    if (!photoFile) {
      toast.error('Profile photo is required');
      return;
    }
    if (!aadhaarFrontFile) {
      toast.error('Aadhaar front image is required');
      return;
    }
    if (!aadhaarBackFile) {
      toast.error('Aadhaar back image is required');
      return;
    }
    if (!panCardFile) {
      toast.error('PAN card image is required');
      return;
    }

    setSubmitting(true);
    try {
      // Get branch code for customer code generation
      const branch = branches.find(b => b.id === branchId);
      const branchCode = branch?.branch_code || 'CUST';

      // Generate customer code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_customer_code', { 
          p_client_id: clientId, 
          p_branch_code: branchCode 
        });

      if (codeError) throw codeError;

      const customerData = {
        client_id: clientId,
        branch_id: branchId,
        customer_code: codeData,
        full_name: fullName.trim(),
        phone: phone.trim(),
        alternate_phone: alternatePhone.trim() || null,
        email: email.trim() || null,
        date_of_birth: dateOfBirth || null,
        gender: (gender as 'male' | 'female' | 'other') || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        occupation: occupation.trim() || null,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
        nominee_name: nomineeName.trim() || null,
        nominee_relation: (nomineeRelation as NomineeRelation) || null,
      };

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) throw error;

      // Upload all documents in parallel
      const uploadTasks: Promise<{ key: string; url: string }>[] = [];
      
      if (photoFile) {
        uploadTasks.push(
          uploadDocument(photoFile, 'profile', newCustomer.id)
            .then(url => ({ key: 'photo_url', url }))
        );
      }
      if (aadhaarFrontFile) {
        uploadTasks.push(
          uploadDocument(aadhaarFrontFile, 'aadhaar_front', newCustomer.id)
            .then(url => ({ key: 'aadhaar_front_url', url }))
        );
      }
      if (aadhaarBackFile) {
        uploadTasks.push(
          uploadDocument(aadhaarBackFile, 'aadhaar_back', newCustomer.id)
            .then(url => ({ key: 'aadhaar_back_url', url }))
        );
      }
      if (panCardFile) {
        uploadTasks.push(
          uploadDocument(panCardFile, 'pan_card', newCustomer.id)
            .then(url => ({ key: 'pan_card_url', url }))
        );
      }

      if (uploadTasks.length > 0) {
        const results = await Promise.all(uploadTasks);
        const documentUpdates: Record<string, string> = {};
        results.forEach(r => { documentUpdates[r.key] = r.url; });

        const { error: updateError } = await supabase
          .from('customers')
          .update(documentUpdates)
          .eq('id', newCustomer.id);

        if (updateError) throw updateError;
      }

      toast.success(`Customer ${newCustomer.customer_code} created successfully`);
      onCustomerCreated(newCustomer.id);
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const getCameraLabel = () => {
    switch (cameraTarget) {
      case 'photo': return 'Profile Photo';
      case 'aadhaar_front': return 'Aadhaar Front';
      case 'aadhaar_back': return 'Aadhaar Back';
      case 'pan_card': return 'PAN Card';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-amber-600" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo & Branch */}
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField
                label="Profile Photo"
                file={photoFile}
                preview={photoPreview}
                onFileChange={(f, p) => { setPhotoFile(f); setPhotoPreview(p); }}
                onCapture={() => openCamera('photo')}
                required
              />
              
              <div className="space-y-2">
                <Label>Branch <span className="text-destructive">*</span></Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.filter(b => b.is_active !== false).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Details
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="Alternate number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Monthly Income</Label>
                  <Input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="₹"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Address
              </h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* KYC Documents */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" /> KYC Documents
              </h4>
              
              <div className="grid grid-cols-3 gap-3">
                <ImageUploadField
                  label="Aadhaar Front"
                  file={aadhaarFrontFile}
                  preview={aadhaarFrontPreview}
                  onFileChange={(f, p) => { setAadhaarFrontFile(f); setAadhaarFrontPreview(p); }}
                  onCapture={() => openCamera('aadhaar_front')}
                  required
                />
                
                <ImageUploadField
                  label="Aadhaar Back"
                  file={aadhaarBackFile}
                  preview={aadhaarBackPreview}
                  onFileChange={(f, p) => { setAadhaarBackFile(f); setAadhaarBackPreview(p); }}
                  onCapture={() => openCamera('aadhaar_back')}
                  required
                />
                
                <ImageUploadField
                  label="PAN Card"
                  file={panCardFile}
                  preview={panCardPreview}
                  onFileChange={(f, p) => { setPanCardFile(f); setPanCardPreview(p); }}
                  onCapture={() => openCamera('pan_card')}
                  required
                />
              </div>
            </div>

            {/* Nominee Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" /> Nominee Details
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nominee Name</Label>
                  <Input
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="Enter nominee name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nominee Relation</Label>
                  <Select value={nomineeRelation} onValueChange={setNomineeRelation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOMINEE_RELATIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-gradient-to-r from-amber-500 to-orange-600"
              >
                {submitting ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        label={getCameraLabel()}
      />
    </>
  );
}
