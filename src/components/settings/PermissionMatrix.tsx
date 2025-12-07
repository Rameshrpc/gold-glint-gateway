import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

const PERMISSION_MATRIX = [
  { role: 'Super Admin', roleKey: 'super_admin', view: true, add: true, edit: true, delete: true, highValue: true },
  { role: 'Tenant Admin', roleKey: 'tenant_admin', view: true, add: true, edit: true, delete: true, highValue: true },
  { role: 'Branch Manager', roleKey: 'branch_manager', view: true, add: true, edit: true, delete: false, highValue: 'grantable' },
  { role: 'Loan Officer', roleKey: 'loan_officer', view: true, add: true, edit: false, delete: false, highValue: false },
  { role: 'Appraiser', roleKey: 'appraiser', view: true, add: true, edit: false, delete: false, highValue: false },
  { role: 'Collection Agent', roleKey: 'collection_agent', view: true, add: true, edit: false, delete: false, highValue: false },
  { role: 'Auditor', roleKey: 'auditor', view: true, add: false, edit: false, delete: false, highValue: false },
  { role: 'Moderator', roleKey: 'moderator', view: true, add: false, edit: false, delete: false, highValue: false },
];

const PermissionCell = ({ value }: { value: boolean | string }) => {
  if (value === 'grantable') {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
        Grantable
      </Badge>
    );
  }
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  }
  return <X className="h-4 w-4 text-destructive/60 mx-auto" />;
};

export function PermissionMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Permission Matrix</CardTitle>
        <CardDescription>
          Overview of role-based permissions. Edit/Delete is locked to admin roles only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Role</TableHead>
                <TableHead className="text-center w-20">View</TableHead>
                <TableHead className="text-center w-20">Add</TableHead>
                <TableHead className="text-center w-20">Edit</TableHead>
                <TableHead className="text-center w-20">Delete</TableHead>
                <TableHead className="text-center min-w-[100px]">High Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_MATRIX.map((row) => (
                <TableRow key={row.roleKey}>
                  <TableCell className="font-medium">{row.role}</TableCell>
                  <TableCell className="text-center">
                    <PermissionCell value={row.view} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionCell value={row.add} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionCell value={row.edit} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionCell value={row.delete} />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionCell value={row.highValue} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
