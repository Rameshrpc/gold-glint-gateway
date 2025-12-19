import { useState } from 'react';
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
import { Loader2, Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  
  const [editingBlock, setEditingBlock] = useState<PrintContentBlock | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState<PrintContentBlock['block_type']>('gold_declaration');
  const [newBlockEnglish, setNewBlockEnglish] = useState('');
  const [newBlockTamil, setNewBlockTamil] = useState('');
  
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
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="content">Editable Content</TabsTrigger>
          <TabsTrigger value="footer">Header & Footer</TabsTrigger>
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
              <CardDescription>Customize header slogan and footer text (bilingual)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
