import { Head, router } from '@inertiajs/react';
import { Search, ReceiptText, Calendar, Wallet, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import transactionsRoute from '@/routes/transactions';
import { cn } from '@/lib/utils';

interface LinkProp {
    url: string | null;
    label: string;
    active: boolean;
}

interface Transaction {
    id: number;
    transaction_id: string;
    machine_id: number;
    amount: number;
    payment_type: string | null;
    template_id: number | null;
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
}

interface TransactionPaginator {
    data: Transaction[];
    links: LinkProp[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface Props {
    transactions: TransactionPaginator;
    filters: {
        search?: string;
        status?: string;
    };
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    'WAITING_PAYMENT': { label: 'Waiting Payment', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200', icon: Clock },
    'SUCCESS': { label: 'Success', color: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
    'FAILED': { label: 'Failed', color: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
    'EXPIRED': { label: 'Expired', color: 'bg-gray-500/10 text-gray-600 border-gray-200', icon: Clock },
};

export default function TransactionIndex({ transactions, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleFilter = (key: string, value: string) => {
        const newFilters = {
            search: searchQuery,
            status: statusFilter,
            [key]: value,
        };

        router.get(transactionsRoute.index({ query: newFilters }).url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchQuery);
    };

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

    return (
        <>
            <Head title="Transactions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
                        <p className="text-muted-foreground">
                            Monitor photobooth usage and payment records.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by ID or Machine..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2">
                            {(filters.search || filters.status) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        router.get(transactionsRoute.index().url);
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            )}
                            <Select value={statusFilter} onValueChange={(val) => {
                                setStatusFilter(val);
                                handleFilter('status', val);
                            }}>
                                <SelectTrigger className="h-9 w-[180px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-sidebar/50">
                                <TableHead className="w-[150px]">Transaction ID</TableHead>
                                <TableHead>Machine</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>Started At</TableHead>
                                <TableHead>Finished At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        {(filters.search || filters.status)
                                            ? 'No transactions match your filters.'
                                            : 'No transactions found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.data.map((transaction) => {
                                    const config = statusConfig[transaction.status] || { 
                                        label: transaction.status, 
                                        color: 'bg-gray-500/10 text-gray-500', 
                                        icon: AlertCircle 
                                    };
                                    const Icon = config.icon;

                                    return (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate max-w-[100px]" title={transaction.transaction_id}>
                                                        {transaction.transaction_id}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{transaction.machine.name}</TableCell>
                                            <TableCell>{transaction.template?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(transaction.amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className={cn("inline-flex items-center gap-1.5 font-medium px-2 py-0.5", config.color)}>
                                                    <Icon className="h-3 w-3" />
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(transaction.started_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {formatDate(transaction.finished_at)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    <div className="border-t bg-sidebar/50">
                        <Pagination links={transactions.links} className="py-3" />
                    </div>
                </div>
            </div>
        </>
    );
}

TransactionIndex.layout = {
    breadcrumbs: [
        {
            title: 'Transactions',
            href: '/transactions',
        },
    ],
};
