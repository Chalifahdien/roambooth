import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, Copy, Check, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import machinesRoute from '@/routes/machines';
import { toast } from 'sonner';

interface Machine {
    id: number;
    name: string;
    is_active: boolean;
    payment_required: boolean;
    token: string | null;
    amount_koran: number;
    amount_reguler: number;
    amount_flipbook: number;
    amount_print_koran: number;
    amount_print_reguler: number;
    amount_print_flipbook: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    machines: Machine[];
}

export default function MachineIndex({ machines }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    const filteredMachines = machines.filter(machine => {
        const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (machine.token && machine.token.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && machine.is_active) ||
            (statusFilter === 'inactive' && !machine.is_active);

        const matchesPayment = paymentFilter === 'all' ||
            (paymentFilter === 'required' && machine.payment_required) ||
            (paymentFilter === 'free' && !machine.payment_required);

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        is_active: true,
        payment_required: true,
        token: '',
        amount_koran: 0,
        amount_reguler: 0,
        amount_flipbook: 0,
        amount_print_koran: 0,
        amount_print_reguler: 0,
        amount_print_flipbook: 0,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (machine: Machine) => {
        setSelectedMachine(machine);
        setData({
            name: machine.name,
            is_active: machine.is_active,
            payment_required: machine.payment_required,
            token: machine.token || '',
            amount_koran: machine.amount_koran || 0,
            amount_reguler: machine.amount_reguler || 0,
            amount_flipbook: machine.amount_flipbook || 0,
            amount_print_koran: machine.amount_print_koran || 0,
            amount_print_reguler: machine.amount_print_reguler || 0,
            amount_print_flipbook: machine.amount_print_flipbook || 0,
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (machine: Machine) => {
        setSelectedMachine(machine);
        setIsDeleteModalOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(machinesRoute.store().url, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                toast.success('Machine created successfully');
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMachine) return;
        put(machinesRoute.update(selectedMachine.id).url, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                toast.success('Machine updated successfully');
            },
        });
    };

    const submitDelete = () => {
        if (!selectedMachine) return;
        destroy(machinesRoute.destroy(selectedMachine.id).url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedMachine(null);
                toast.success('Machine deleted successfully');
            },
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Token copied to clipboard');
    };

    const generateRandomToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const regenerateToken = () => {
        setData('token', generateRandomToken());
        toast.info('New token generated. Save to apply changes.');
    };

    return (
        <>
            <Head title="Manage Machines" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Machines</h2>
                        <p className="text-muted-foreground">
                            Manage your photobooth machines here.
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" /> Add Machine
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search machines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setPaymentFilter('all');
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            )}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 w-[130px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="h-9 w-[130px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payment</SelectItem>
                                    <SelectItem value="required">Required</SelectItem>
                                    <SelectItem value="free">Free</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Table>
                        <TableHeader className='bg-sidebar'>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMachines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all')
                                            ? 'No machines match your filters.'
                                            : 'No machines found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMachines.map((machine) => (
                                    <TableRow key={machine.id}>
                                        <TableCell className="font-medium">{machine.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={machine.is_active ? 'default' : 'secondary'}>
                                                {machine.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={machine.payment_required ? 'outline' : 'secondary'}>
                                                {machine.payment_required ? 'Required' : 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                {machine.token && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(machine.token!)}
                                                        title="Copy Token"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {machine.token || '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className='text-end'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditModal(machine)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteModal(machine)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Machine Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={submitCreate}>
                        <DialogHeader>
                            <DialogTitle>Add Machine</DialogTitle>
                            <DialogDescription>
                                Create a new machine for your photobooth system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Booth A"
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Enable or disable this machine.</p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="payment_required">Payment Required</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Specify if payment is mandatory.</p>
                                </div>
                                <Switch
                                    id="payment_required"
                                    checked={data.payment_required}
                                    onCheckedChange={(checked) => setData('payment_required', checked)}
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium leading-none">Photo Concept Price (IDR)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_koran">Koran</Label>
                                        <Input
                                            id="amount_koran"
                                            type="number"
                                            value={data.amount_koran}
                                            onChange={(e) => setData('amount_koran', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_reguler">Reguler</Label>
                                        <Input
                                            id="amount_reguler"
                                            type="number"
                                            value={data.amount_reguler}
                                            onChange={(e) => setData('amount_reguler', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_flipbook">Flipbook</Label>
                                        <Input
                                            id="amount_flipbook"
                                            type="number"
                                            value={data.amount_flipbook}
                                            onChange={(e) => setData('amount_flipbook', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium leading-none">Printing Cost (IDR)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_print_koran">Koran</Label>
                                        <Input
                                            id="amount_print_koran"
                                            type="number"
                                            value={data.amount_print_koran}
                                            onChange={(e) => setData('amount_print_koran', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_print_reguler">Reguler</Label>
                                        <Input
                                            id="amount_print_reguler"
                                            type="number"
                                            value={data.amount_print_reguler}
                                            onChange={(e) => setData('amount_print_reguler', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="amount_print_flipbook">Flipbook</Label>
                                        <Input
                                            id="amount_print_flipbook"
                                            type="number"
                                            value={data.amount_print_flipbook}
                                            onChange={(e) => setData('amount_print_flipbook', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create Machine
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Machine Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Machine</DialogTitle>
                            <DialogDescription>
                                Update the details of your machine.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-token">Token</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="edit-token"
                                        value={data.token}
                                        readOnly
                                        disabled
                                        className="bg-muted cursor-not-allowed flex-1 opacity-60"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={regenerateToken}
                                        className="shrink-0"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" /> Change Token
                                    </Button>
                                </div>
                                {errors.token && <p className="text-sm text-destructive">{errors.token}</p>}
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="edit-is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Enable or disable this machine.</p>
                                </div>
                                <Switch
                                    id="edit-is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="edit-payment_required">Payment Required</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Specify if payment is mandatory.</p>
                                </div>
                                <Switch
                                    id="edit-payment_required"
                                    checked={data.payment_required}
                                    onCheckedChange={(checked) => setData('payment_required', checked)}
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium leading-none">Photo Concept Price (IDR)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_koran">Koran</Label>
                                        <Input
                                            id="edit-amount_koran"
                                            type="number"
                                            value={data.amount_koran}
                                            onChange={(e) => setData('amount_koran', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_reguler">Reguler</Label>
                                        <Input
                                            id="edit-amount_reguler"
                                            type="number"
                                            value={data.amount_reguler}
                                            onChange={(e) => setData('amount_reguler', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_flipbook">Flipbook</Label>
                                        <Input
                                            id="edit-amount_flipbook"
                                            type="number"
                                            value={data.amount_flipbook}
                                            onChange={(e) => setData('amount_flipbook', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium leading-none">Printing Cost (IDR)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_print_koran">Koran</Label>
                                        <Input
                                            id="edit-amount_print_koran"
                                            type="number"
                                            value={data.amount_print_koran}
                                            onChange={(e) => setData('amount_print_koran', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_print_reguler">Reguler</Label>
                                        <Input
                                            id="edit-amount_print_reguler"
                                            type="number"
                                            value={data.amount_print_reguler}
                                            onChange={(e) => setData('amount_print_reguler', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-amount_print_flipbook">Flipbook</Label>
                                        <Input
                                            id="edit-amount_print_flipbook"
                                            type="number"
                                            value={data.amount_print_flipbook}
                                            onChange={(e) => setData('amount_print_flipbook', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Machine</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedMachine?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={processing}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

MachineIndex.layout = {
    breadcrumbs: [
        {
            title: 'Machines',
            href: machinesRoute.index().url,
        },
    ],
};
