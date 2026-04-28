import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function CreateMachineModal({ isOpen, setIsOpen }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        // Since we don't have direct access to route helper here without ziggy, we can use the relative path
        // but inertia provides route() globally if configured, else use '/machines'
        const url = (window as any).route ? (window as any).route('machines.store') : '/machines';
        
        post(url, {
            onSuccess: () => {
                setIsOpen(false);
                reset();
                toast.success('Machine created successfully');
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                reset();
                clearErrors();
            }
            setIsOpen(open);
        }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Machine
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
