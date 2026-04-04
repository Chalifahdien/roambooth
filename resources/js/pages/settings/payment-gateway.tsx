import * as React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CreditCard, ShieldCheck, Globe, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import paymentGateway from '@/routes/settings/payment-gateway';
import { toast } from 'sonner';

interface Gateway {
    id: number;
    name: string;
    client_key: string | null;
    server_key: string | null;
    merchant_id: string | null;
    is_production: boolean;
    is_active: boolean;
}

interface Props {
    gateways: Gateway[];
}

export default function PaymentGatewaySettings({ gateways }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        gateways: gateways.map(g => ({
            id: g.id,
            name: g.name,
            client_key: g.client_key || '',
            server_key: g.server_key || '',
            merchant_id: g.merchant_id || '',
            is_production: g.is_production,
        })),
        active_gateway_id: gateways.find(g => g.is_active)?.id?.toString() || gateways[0]?.id?.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(paymentGateway.update().url, {
            onSuccess: () => toast.success('Payment gateway settings updated successfully'),
            onError: () => toast.error('Failed to update settings'),
        });
    };

    const updateGatewayField = (id: number, field: string, value: any) => {
        const newData = [...data.gateways];
        const index = newData.findIndex(g => g.id === id);
        if (index !== -1) {
            newData[index] = { ...newData[index], [field]: value };
            setData('gateways', newData);
        }
    };

    return (
        <>
            <Head title="Payment Gateway Settings" />
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Payment Gateway</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure your payment gateway API keys and production mode.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {data.gateways.map((gateway, index) => (
                        <Card key={gateway.id} className={data.active_gateway_id === gateway.id.toString() ? 'border-primary shadow-sm' : ''}>
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" />
                                            {gateway.name} Configuration
                                        </CardTitle>
                                        <CardDescription>
                                            Enter your {gateway.name} API credentials.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={`active-${gateway.id}`} className="text-sm font-medium">
                                            {data.active_gateway_id === gateway.id.toString() ? 'Active' : 'Inactive'}
                                        </Label>
                                        <Switch
                                            id={`active-${gateway.id}`}
                                            checked={data.active_gateway_id === gateway.id.toString()}
                                            onCheckedChange={(val: boolean) => {
                                                if (val) {
                                                    setData('active_gateway_id', gateway.id.toString());
                                                } else if (data.active_gateway_id === gateway.id.toString()) {
                                                    setData('active_gateway_id', null as any);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid gap-2">
                                    <Label htmlFor={`client-key-${gateway.id}`}>Client Key / ID</Label>
                                    <Input
                                        id={`client-key-${gateway.id}`}
                                        value={gateway.client_key}
                                        onChange={(e) => updateGatewayField(gateway.id, 'client_key', e.target.value)}
                                        placeholder={`Enter ${gateway.name} Client Key`}
                                    />
                                    {errors[`gateways.${index}.client_key` as any] && (
                                        <p className="text-xs text-destructive">{errors[`gateways.${index}.client_key` as any]}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`server-key-${gateway.id}`}>Server Key / Secret Key</Label>
                                    <Input
                                        id={`server-key-${gateway.id}`}
                                        type="password"
                                        value={gateway.server_key}
                                        onChange={(e) => updateGatewayField(gateway.id, 'server_key', e.target.value)}
                                        placeholder={`Enter ${gateway.name} Server Key`}
                                    />
                                    {errors[`gateways.${index}.server_key` as any] && (
                                        <p className="text-xs text-destructive">{errors[`gateways.${index}.server_key` as any]}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`merchant-id-${gateway.id}`}>Merchant ID (Optional)</Label>
                                    <Input
                                        id={`merchant-id-${gateway.id}`}
                                        value={gateway.merchant_id}
                                        onChange={(e) => updateGatewayField(gateway.id, 'merchant_id', e.target.value)}
                                        placeholder={`Enter ${gateway.name} Merchant ID`}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Production Mode</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable this for live transactions. Disable for Sandbox/Test mode.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={gateway.is_production}
                                        onCheckedChange={(val: boolean) => updateGatewayField(gateway.id, 'is_production', val)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} className="px-8">
                            {processing ? 'Saving...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

PaymentGatewaySettings.layout = {
    breadcrumbs: [
        {
            title: 'Settings',
            href: '/settings/profile',
        },
        {
            title: 'Payment Gateway',
            href: '/settings/payment-gateway',
        },
    ],
};
