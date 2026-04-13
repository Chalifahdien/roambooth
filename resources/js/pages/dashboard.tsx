import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BellRing,
    Camera,
    CheckCircle2,
    CreditCard,
    DollarSign,
    Gauge,
    Sparkles,
    Ticket,
    TrendingUp,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import machinesRoute from '@/routes/machines';
import templatesRoute from '@/routes/templates';
import vouchersRoute from '@/routes/vouchers';

type IconKey = 'credit-card' | 'dollar-sign' | 'camera' | 'ticket';

type DashboardStat = {
    title: string;
    value: string;
    change: string;
    icon: IconKey;
};

type DashboardActivity = {
    id: number;
    title: string;
    time: string;
};

type DashboardTarget = {
    label: string;
    value: number;
};

type DashboardChartPoint = {
    day: string;
    total: number;
};

type RevenueSummary = {
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    total: string;
    periodLabel: string;
    previousPeriodLabel: string;
};

type ReportFilters = {
    startDate: string;
    endDate: string;
};

type DashboardPageProps = {
    auth?: { user?: { name?: string } };
    stats: DashboardStat[];
    recentActivities: DashboardActivity[];
    performanceTargets: DashboardTarget[];
    transactionChartData: DashboardChartPoint[];
    revenueSummary: RevenueSummary;
    reportFilters: ReportFilters;
};

const iconMap: Record<IconKey, ComponentType<{ className?: string }>> = {
    'credit-card': CreditCard,
    'dollar-sign': DollarSign,
    camera: Camera,
    ticket: Ticket,
};

export default function Dashboard() {
    const { auth, stats, recentActivities, performanceTargets, transactionChartData, revenueSummary, reportFilters } =
        usePage<DashboardPageProps>().props;
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'Tim';
    const maxTransaction = Math.max(1, ...transactionChartData.map((item) => item.total));
    const [startDate, setStartDate] = useState(reportFilters.startDate);
    const [endDate, setEndDate] = useState(reportFilters.endDate);

    const applyDateFilter = () => {
        router.get(
            dashboard({
                query: {
                    start_date: startDate,
                    end_date: endDate,
                },
            }).url,
            {},
            { preserveState: true, replace: true }
        );
    };

    const resetDateFilter = () => {
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
        setEndDate(today);
        router.get(
            dashboard({
                query: {
                    start_date: today,
                    end_date: today,
                },
            }).url,
            {},
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="py-4">
                    <CardHeader className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-xl">
                                Halo, {firstName}! 👋
                            </CardTitle>
                            <CardDescription>
                                Ringkasan performa bisnis Potopi Photobooth hari ini.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Trending Positif
                        </Badge>
                    </CardHeader>
                </Card>

                <Card className="py-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filter Report Tanggal</CardTitle>
                        <CardDescription>
                            Pilih rentang tanggal untuk melihat ringkasan report.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="grid gap-1.5">
                            <label htmlFor="start-date" className="text-sm text-muted-foreground">Dari tanggal</label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(event) => setStartDate(event.target.value)}
                                className="w-full md:w-[190px]"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="end-date" className="text-sm text-muted-foreground">Sampai tanggal</label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(event) => setEndDate(event.target.value)}
                                className="w-full md:w-[190px]"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={applyDateFilter}>Tampilkan Report</Button>
                            <Button variant="outline" onClick={resetDateFilter}>Reset</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => {
                        const Icon = iconMap[item.icon] ?? CreditCard;

                        return (
                            <Card key={item.title} className="py-5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <CardDescription>{item.title}</CardDescription>
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{item.value}</div>
                                    <p className="text-muted-foreground mt-1 text-xs">{item.change}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-4">
                    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Rincian Total Pendapatan
                            </CardTitle>
                            <CardDescription>
                                Periode aktif: {revenueSummary.periodLabel}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Pendapatan Periode</p>
                                    <p className="text-xl font-bold">{revenueSummary.today}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Periode Sebelumnya</p>
                                    <p className="text-xl font-bold">{revenueSummary.yesterday}</p>
                                    <p className="text-xs text-muted-foreground">{revenueSummary.previousPeriodLabel}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{revenueSummary.thisWeek}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{revenueSummary.thisMonth}</p>
                                </div>
                                <div className="space-y-1 border-t md:border-l md:border-t-0 md:pl-4 pt-2 md:pt-0 col-span-2 md:col-span-1 border-border">
                                    <p className="text-sm font-medium text-muted-foreground">Total Keseluruhan</p>
                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{revenueSummary.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BellRing className="h-4 w-4" />
                                Aktivitas Terbaru
                            </CardTitle>
                            <CardDescription>Update penting 1-2 jam terakhir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentActivities.length > 0 ? (
                                recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                                            <p className="text-sm">{activity.title}</p>
                                        </div>
                                        <span className="text-muted-foreground text-xs">{activity.time}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
                                    Belum ada aktivitas terbaru.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Gauge className="h-4 w-4" />
                                Target Harian
                            </CardTitle>
                            <CardDescription>Progress terhadap target operasional.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {performanceTargets.map((target) => (
                                <div key={target.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{target.label}</span>
                                        <span className="font-medium">{target.value}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-primary"
                                            style={{ width: `${target.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button size="sm" className="w-full">
                                Lihat Laporan Lengkap
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            Grafik Transaksi Periode
                        </CardTitle>
                        <CardDescription>
                            Tren jumlah transaksi berdasarkan rentang tanggal terpilih.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid auto-cols-fr grid-flow-col items-end gap-3 overflow-x-auto">
                            {transactionChartData.length > 0 ? (
                                transactionChartData.map((point) => {
                                    const barHeight = Math.max(10, Math.round((point.total / maxTransaction) * 140));

                                    return (
                                        <div key={point.day} className="flex flex-col items-center gap-2">
                                            <span className="text-xs font-medium">{point.total}</span>
                                            <div
                                                className="w-full max-w-10 rounded-md bg-primary/85 transition-all hover:bg-primary"
                                                style={{ height: `${barHeight}px` }}
                                                title={`${point.day}: ${point.total} transaksi`}
                                            />
                                            <span className="text-muted-foreground text-xs">{point.day}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted-foreground col-span-7 rounded-lg border border-dashed p-3 text-sm">
                                    Belum ada data transaksi untuk ditampilkan.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4" />
                            Aksi Cepat
                        </CardTitle>
                        <CardDescription>
                            Shortcut untuk aktivitas yang sering dilakukan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <Button variant="outline" asChild>
                            <Link href={vouchersRoute.index().url}>
                                Buat Voucher Baru
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={templatesRoute.create().url}>
                                Tambah Template
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={machinesRoute.index().url}>
                                Cek Status Mesin
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
    ],
};
