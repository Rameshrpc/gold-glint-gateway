import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrintSettings, PrintContentBlock } from '@/hooks/usePrintSettings';
import { Loader2, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';

export function EditableContentSettings() {
  const { 
    contentBlocks,
    loading, 
    saving, 
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
    <>
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
    </>
  );
}
