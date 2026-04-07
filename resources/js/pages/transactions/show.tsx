import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    Calendar,
    Clock,
    CreditCard,
    Monitor,
    FileImage,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ReceiptText,
    Image as ImageIcon,
    Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Transaction {
    id: number;
    transaction_id: string;
    machine_id: number;
    amount: number;
    payment_type: string | null;
    template_id: number | null;
    voucher_id: number | null;
    status: string;
    started_at: string | null;
    expires_at: string | null;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
    machine: {
        id: number;
        name: string;
    };
    template: {
        id: number;
        name: string;
    } | null;
    voucher: {
        id: number;
        code: string;
        type: string;
    } | null;
    final_image: {
        id: number;
        image_url: string;
        video_url: string | null;
        print_quantity: number;
    } | null;
    photos: Array<{
        id: number;
        photo_url: string;
        taken_at: string;
        frame_id: number;
    }>;
}

interface Props {
    transaction: Transaction;
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    'WAITING_PAYMENT': { label: 'Waiting Payment', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Clock },
    'SUCCESS': { label: 'DONE', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
    'FAILED': { label: 'Failed', color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
    'EXPIRED': { label: 'Expired', color: 'bg-gray-500/10 text-gray-600 border-gray-200', icon: Clock },
};

export default function TransactionShow({ transaction }: Props) {
    const config = statusConfig[transaction.status] || {
        label: transaction.status,
        color: 'bg-gray-500/10 text-gray-500',
        icon: AlertCircle
    };
    const StatusIcon = config.icon;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    };

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Head title={`Transaction #${transaction.transaction_id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4 justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Transaction Detail</h2>
                        <p className="text-muted-foreground">
                            Viewing details for transaction ID: {transaction.transaction_id}
                        </p>
                    </div>

                    <Link href="/transactions">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-md">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Session Information */}
                    <Card className='gap-0 py-4'>
                        <CardHeader className="pb-3 border-b mb-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-primary" />
                                Session Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-muted-foreground">Session ID</div>
                                <div className="font-bold">#{transaction.id}</div>

                                <div className="text-muted-foreground">Status</div>
                                <div>
                                    <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-medium px-2 py-0.5", config.color)}>
                                        {config.label}
                                    </Badge>
                                </div>

                                <div className="text-muted-foreground">Machine</div>
                                <div className="font-medium text-primary uppercase">{transaction.machine.name}</div>

                                <div className="text-muted-foreground">Template</div>
                                <div className="font-medium text-primary uppercase">{transaction.template?.name || '-'}</div>

                                <div className="text-muted-foreground">Started At</div>
                                <div>{formatDate(transaction.started_at)}</div>

                                <div className="text-muted-foreground">Finished At</div>
                                <div>{formatDate(transaction.finished_at)}</div>

                                <div className="text-muted-foreground">Created</div>
                                <div>{formatDate(transaction.created_at)}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card className='gap-0 py-4'>
                        <CardHeader className="pb-3 border-b mb-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Payment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-muted-foreground">Order ID</div>
                                <div className="font-medium">{transaction.transaction_id}</div>

                                <div className="text-muted-foreground">Amount</div>
                                <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                                <div className="text-muted-foreground">Paid At</div>
                                <div>{transaction.status === 'SUCCESS' ? formatDate(transaction.finished_at) : '-'}</div>

                                <div className="text-muted-foreground">Print Quantity</div>
                                <div className="font-bold">{transaction.final_image?.print_quantity || 0} print(s)</div>

                                <div className="text-muted-foreground">Total Cost</div>
                                <div className="font-bold text-primary">{formatCurrency(transaction.amount)}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Final Image */}
                    <Card className='gap-0 py-4'>
                        <CardHeader className="pb-3 border-b mb-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                Final Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            {transaction.final_image?.image_url ? (
                                <>
                                    <div className="relative group max-w-xs mx-auto mb-6 bg-sidebar rounded-lg p-2 border">
                                        <img
                                            src={transaction.final_image.image_url}
                                            alt="Final Result"
                                            className="rounded shadow-lg w-full max-h-[400px] object-contain"
                                        />
                                    </div>
                                    <Button
                                        className="w-full max-w-[200px]"
                                        onClick={() => handleDownload(transaction.final_image!.image_url, `final_${transaction.transaction_id}.png`)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <FileImage className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    No final image available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Live Photo */}
                    <Card className='gap-0 py-4'>
                        <CardHeader className="pb-3 border-b mb-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Video className="h-5 w-5 text-primary" />
                                Live Photo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            {transaction.final_image?.video_url ? (
                                <>
                                    <div className="relative group max-w-xs mx-auto mb-6 bg-sidebar rounded-lg p-2 border">
                                        <video
                                            src={transaction.final_image.video_url}
                                            controls
                                            className="rounded shadow-lg w-full max-h-[400px] object-contain"
                                        />
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="w-full max-w-[240px]"
                                        onClick={() => handleDownload(transaction.final_image!.video_url!, `video_${transaction.transaction_id}.mp4`)}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Live Photo
                                    </Button>
                                </>
                            ) : (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Video className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    No live photo video available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Session Photos */}
                <Card className='gap-0 py-4'>
                    <CardHeader className="pb-3 border-b mb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            Session Photos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transaction.photos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {transaction.photos.map((photo, index) => (
                                    <div key={photo.id} className="relative group overflow-hidden rounded-lg border bg-sidebar p-1">
                                        <img
                                            src={photo.photo_url}
                                            alt={`Capture ${index + 1}`}
                                            className="aspect-[3/4] w-full object-cover rounded shadow-sm"
                                        />
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="text-[10px] scale-90 origin-top-left bg-black/50 text-white border-none backdrop-blur-sm">
                                                FRAME
                                            </Badge>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-7 w-7 rounded-full bg-white/90 shadow-lg text-primary"
                                                onClick={() => handleDownload(photo.photo_url, `capture_${index + 1}_${transaction.transaction_id}.jpg`)}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                No session photos available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TransactionShow.layout = (page: any) => ({
    breadcrumbs: [
        { title: 'Transactions', href: '/transactions' },
        { title: 'Detail', href: '#' },
    ],
    children: page,
});
