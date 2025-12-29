import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBillOfSaleContent, Declaration, StrikePeriod } from '@/hooks/useBillOfSaleContent';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2, Plus, Trash2, GripVertical, Save, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function BillOfSaleSettings() {
  const { 
    content, 
    contentBlocks,
    loading, 
    saving, 
    initializeContent,
    updateContentBlock,
    addContentBlock,
    deleteContentBlock,
    updateSettings,
    hasContent
  } = useBillOfSaleContent();
  
  const { settings, updateSettings: updatePrintSettings } = usePrintSettings();
  
  const [localSettings, setLocalSettings] = useState({
    place: content.settings.place,
    refPrefix: content.settings.refPrefix
  });
  
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<{ english: string; tamil: string }>({ english: '', tamil: '' });

  useEffect(() => {
    setLocalSettings({
      place: content.settings.place,
      refPrefix: content.settings.refPrefix
    });
  }, [content.settings]);

  const handleSaveSettings = async () => {
    await updateSettings(localSettings);
  };

  const handleToggleTradingFormat = async (enabled: boolean) => {
    await updatePrintSettings({ use_trading_format: enabled } as any);
  };

  const handleToggleIncludeBillOfSale = async (enabled: boolean) => {
    await updatePrintSettings({ include_bill_of_sale: enabled } as any);
  };

  const startEditing = (blockId: string, english: string, tamil: string) => {
    setEditingBlock(blockId);
    setEditedValues({ english, tamil });
  };

  const cancelEditing = () => {
    setEditingBlock(null);
    setEditedValues({ english: '', tamil: '' });
  };

  const saveEditing = async (blockId: string) => {
    await updateContentBlock(blockId, {
      content_english: editedValues.english,
      content_tamil: editedValues.tamil
    });
    cancelEditing();
  };

  const getBlockByType = (type: string) => contentBlocks.find(b => b.block_type === type);
  const getBlocksByType = (type: string) => contentBlocks.filter(b => b.block_type === type).sort((a, b) => a.display_order - b.display_order);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bill of Sale Agreement Settings
          </CardTitle>
          <CardDescription>
            Configure the content for Bill of Sale & Repurchase Option Agreement documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bill of Sale content has not been initialized for your organization.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={initializeContent} 
            disabled={saving}
            className="mt-4"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Initialize Default Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bill of Sale Agreement Settings
        </CardTitle>
        <CardDescription>
          Configure all content for Bill of Sale & Repurchase Option Agreement documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="declarations">Declarations</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
            <TabsTrigger value="strike-prices">Strike Prices</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Document Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Enable Trading Format</Label>
                    <p className="text-sm text-muted-foreground">Use Bill of Sale instead of Loan Receipt by default</p>
                  </div>
                  <Switch
                    checked={(settings as any)?.use_trading_format || false}
                    onCheckedChange={handleToggleTradingFormat}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Include Bill of Sale</Label>
                    <p className="text-sm text-muted-foreground">Include in loan document prints</p>
                  </div>
                  <Switch
                    checked={(settings as any)?.include_bill_of_sale || false}
                    onCheckedChange={handleToggleIncludeBillOfSale}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Place</Label>
                  <Input
                    value={localSettings.place}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, place: e.target.value }))}
                    placeholder="e.g., Coimbatore"
                  />
                  <p className="text-xs text-muted-foreground">Place shown on the agreement</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Reference Prefix</Label>
                  <Input
                    value={localSettings.refPrefix}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, refPrefix: e.target.value }))}
                    placeholder="e.g., ZG"
                  />
                  <p className="text-xs text-muted-foreground">Prefix for agreement reference number</p>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>

              <Separator />

              {/* Document Title */}
              <div className="space-y-4">
                <h4 className="font-medium">Document Title</h4>
                {(() => {
                  const block = getBlockByType('bill_of_sale_title');
                  if (!block) return null;
                  const isEditing = editingBlock === block.id;
                  return (
                    <div className="p-4 border rounded-lg space-y-3">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label>English</Label>
                            <Input
                              value={editedValues.english}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tamil</Label>
                            <Input
                              value={editedValues.tamil}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Badge variant="outline" className="mb-2">English</Badge>
                            <p className="font-medium">{block.content_english}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">Tamil</Badge>
                            <p>{block.content_tamil}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Legal Reference */}
              <div className="space-y-4">
                <h4 className="font-medium">Legal Reference</h4>
                {(() => {
                  const block = getBlockByType('bill_of_sale_legal_ref');
                  if (!block) return null;
                  const isEditing = editingBlock === block.id;
                  return (
                    <div className="p-4 border rounded-lg space-y-3">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label>English</Label>
                            <Input
                              value={editedValues.english}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tamil</Label>
                            <Input
                              value={editedValues.tamil}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Badge variant="outline" className="mb-2">English</Badge>
                            <p>{block.content_english}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-2">Tamil</Badge>
                            <p>{block.content_tamil}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            {[
              { type: 'bill_of_sale_seller_title', title: 'Section 1: Seller Title' },
              { type: 'bill_of_sale_buyer_title', title: 'Section 2: Buyer Title' },
              { type: 'bill_of_sale_goods_title', title: 'Section A: Goods Title' },
              { type: 'bill_of_sale_goods_intro', title: 'Section A: Goods Introduction' },
              { type: 'bill_of_sale_consideration_title', title: 'Section B: Consideration Title' },
              { type: 'bill_of_sale_consideration_intro', title: 'Section B: Consideration Introduction' },
              { type: 'bill_of_sale_spot_price_label', title: 'Spot Price Label' },
              { type: 'bill_of_sale_repurchase_title', title: 'Section C: Repurchase Title' },
              { type: 'bill_of_sale_repurchase_intro', title: 'Section C: Repurchase Introduction' },
              { type: 'bill_of_sale_expiry_note', title: 'Option Expiry Note' },
              { type: 'bill_of_sale_declarations_title', title: 'Section D: Declarations Title' },
            ].map(({ type, title }) => {
              const block = getBlockByType(type);
              if (!block) return null;
              const isEditing = editingBlock === block.id;
              const isLongText = type.includes('intro') || type.includes('note');
              
              return (
                <div key={type} className="space-y-2">
                  <h4 className="font-medium">{title}</h4>
                  <div className="p-4 border rounded-lg space-y-3">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>English</Label>
                          {isLongText ? (
                            <Textarea
                              value={editedValues.english}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                              rows={3}
                            />
                          ) : (
                            <Input
                              value={editedValues.english}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Tamil</Label>
                          {isLongText ? (
                            <Textarea
                              value={editedValues.tamil}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                              rows={3}
                            />
                          ) : (
                            <Input
                              value={editedValues.tamil}
                              onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Badge variant="outline" className="mb-2">English</Badge>
                          <p className={isLongText ? 'text-sm' : ''}>{block.content_english}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Tamil</Badge>
                          <p className={isLongText ? 'text-sm' : ''}>{block.content_tamil}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Declarations Tab */}
          <TabsContent value="declarations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Declarations</h3>
                <p className="text-sm text-muted-foreground">Manage declaration statements that appear on the document</p>
              </div>
              <Button 
                onClick={() => addContentBlock({
                  block_type: 'bill_of_sale_declaration',
                  content_english: 'New Declaration|Enter declaration text here',
                  content_tamil: 'புதிய அறிவிப்பு|அறிவிப்பு உரையை இங்கே உள்ளிடவும்',
                  display_order: (getBlocksByType('bill_of_sale_declaration').length || 0) + 1
                })}
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Declaration
              </Button>
            </div>
            
            <div className="space-y-4">
              {getBlocksByType('bill_of_sale_declaration').map((block, index) => {
                const parts = block.content_english.split('|');
                const title = parts[0] || `Declaration ${index + 1}`;
                const contentEn = parts[1] || block.content_english;
                const tamilParts = block.content_tamil.split('|');
                const contentTa = tamilParts.length > 1 ? tamilParts[1] : block.content_tamil;
                const isEditing = editingBlock === block.id;

                return (
                  <div key={block.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge>{index + 1}</Badge>
                        <span className="font-medium">{title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContentBlock(block.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={editedValues.english.split('|')[0] || ''}
                            onChange={(e) => {
                              const parts = editedValues.english.split('|');
                              parts[0] = e.target.value;
                              setEditedValues(prev => ({ ...prev, english: parts.join('|') }));
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Content (English)</Label>
                          <Textarea
                            value={editedValues.english.split('|')[1] || ''}
                            onChange={(e) => {
                              const parts = editedValues.english.split('|');
                              parts[1] = e.target.value;
                              setEditedValues(prev => ({ ...prev, english: parts.join('|') }));
                            }}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Content (Tamil)</Label>
                          <Textarea
                            value={editedValues.tamil.split('|')[1] || editedValues.tamil}
                            onChange={(e) => {
                              const parts = editedValues.tamil.split('|');
                              if (parts.length > 1) {
                                parts[1] = e.target.value;
                                setEditedValues(prev => ({ ...prev, tamil: parts.join('|') }));
                              } else {
                                setEditedValues(prev => ({ ...prev, tamil: `${parts[0]}|${e.target.value}` }));
                              }
                            }}
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Badge variant="outline" className="mb-2">English</Badge>
                          <p className="text-sm">{contentEn}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Tamil</Badge>
                          <p className="text-sm">{contentTa}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{company_name}}'}</code> as a placeholder for the company name in declaration text.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Signatures Tab */}
          <TabsContent value="signatures" className="space-y-6">
            <h3 className="text-lg font-semibold">Signature Labels</h3>
            
            {[
              { type: 'bill_of_sale_signature_seller', title: 'Seller Signature Label' },
              { type: 'bill_of_sale_signature_seller_note', title: 'Seller Signature Note' },
              { type: 'bill_of_sale_signature_buyer', title: 'Buyer Signature Label' },
              { type: 'bill_of_sale_signature_buyer_note', title: 'Buyer Signature Note' },
            ].map(({ type, title }) => {
              const block = getBlockByType(type);
              if (!block) return null;
              const isEditing = editingBlock === block.id;
              
              return (
                <div key={type} className="space-y-2">
                  <h4 className="font-medium">{title}</h4>
                  <div className="p-4 border rounded-lg space-y-3">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>English</Label>
                          <Input
                            value={editedValues.english}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tamil</Label>
                          <Input
                            value={editedValues.tamil}
                            onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Badge variant="outline" className="mb-2">English</Badge>
                          <p>{block.content_english}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-2">Tamil</Badge>
                          <p>{block.content_tamil}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{company_name}}'}</code> as a placeholder for the company name.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Strike Prices Tab */}
          <TabsContent value="strike-prices" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Strike Price Periods</h3>
                <p className="text-sm text-muted-foreground">Configure the repurchase option periods and labels</p>
              </div>
              <Button 
                onClick={() => {
                  const periods = getBlocksByType('bill_of_sale_strike_period');
                  const nextOrder = periods.length + 1;
                  const prevDays = periods.length > 0 
                    ? parseInt(periods[periods.length - 1].content_english.split('|')[2] || '90', 10)
                    : 0;
                  addContentBlock({
                    block_type: 'bill_of_sale_strike_period',
                    content_english: `${prevDays + 1}-${prevDays + 30} Days|${prevDays + 1}-${prevDays + 30} நாட்கள்|${prevDays + 30}`,
                    content_tamil: '',
                    display_order: nextOrder
                  });
                }}
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Period
              </Button>
            </div>

            {/* Table Headers */}
            <div className="space-y-4">
              <h4 className="font-medium">Table Headers</h4>
              {[
                { type: 'bill_of_sale_strike_period_header', title: 'Period Column' },
                { type: 'bill_of_sale_strike_price_header', title: 'Price Column' },
                { type: 'bill_of_sale_strike_status_header', title: 'Status Column' },
              ].map(({ type, title }) => {
                const block = getBlockByType(type);
                if (!block) return null;
                const isEditing = editingBlock === block.id;
                
                return (
                  <div key={type} className="flex items-center gap-4 p-3 border rounded-lg">
                    <span className="w-32 text-sm font-medium">{title}</span>
                    {isEditing ? (
                      <>
                        <Input
                          value={editedValues.english}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, english: e.target.value }))}
                          className="flex-1"
                          placeholder="English"
                        />
                        <Input
                          value={editedValues.tamil}
                          onChange={(e) => setEditedValues(prev => ({ ...prev, tamil: e.target.value }))}
                          className="flex-1"
                          placeholder="Tamil"
                        />
                        <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{block.content_english}</span>
                        <span className="flex-1 text-sm text-muted-foreground">{block.content_tamil}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Strike Periods */}
            <div className="space-y-4">
              <h4 className="font-medium">Period Definitions</h4>
              {getBlocksByType('bill_of_sale_strike_period').map((block, index) => {
                const parts = block.content_english.split('|');
                const labelEn = parts[0] || '';
                const labelTa = parts[1] || '';
                const days = parts[2] || '30';
                const isEditing = editingBlock === block.id;

                return (
                  <div key={block.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">Period {index + 1}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteContentBlock(block.id)}
                        disabled={saving || getBlocksByType('bill_of_sale_strike_period').length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Label (English)</Label>
                            <Input
                              value={editedValues.english.split('|')[0] || ''}
                              onChange={(e) => {
                                const parts = editedValues.english.split('|');
                                parts[0] = e.target.value;
                                setEditedValues(prev => ({ ...prev, english: parts.join('|') }));
                              }}
                              placeholder="e.g., 0-30 Days"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Label (Tamil)</Label>
                            <Input
                              value={editedValues.english.split('|')[1] || ''}
                              onChange={(e) => {
                                const parts = editedValues.english.split('|');
                                parts[1] = e.target.value;
                                setEditedValues(prev => ({ ...prev, english: parts.join('|') }));
                              }}
                              placeholder="e.g., 0-30 நாட்கள்"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Days (End)</Label>
                            <Input
                              type="number"
                              value={editedValues.english.split('|')[2] || '30'}
                              onChange={(e) => {
                                const parts = editedValues.english.split('|');
                                parts[2] = e.target.value;
                                setEditedValues(prev => ({ ...prev, english: parts.join('|') }));
                              }}
                              min={1}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEditing(block.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">English:</span> {labelEn}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tamil:</span> {labelTa}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Up to day:</span> {days}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEditing(block.id, block.content_english, block.content_tamil)}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Strike prices are calculated automatically based on the loan principal, interest rate, and the day ranges you define here.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
