import { Head, router, usePage } from '@inertiajs/react';
import { Activity, CircleCheck, Coins, GalleryVertical, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type ReportRange = {
    startDate: string;
    endDate: string;
    label: string;
};

type SummaryCards = {
    totalSessions: number;
    totalRevenue: number;
    successfulTransactions: number;
    averagePerSession: number;
};

type DailyChartPoint = {
    day: string;
    sessions: number;
    revenue: number;
};

type PaymentStatusRow = {
    status: string;
    count: number;
    totalAmount: number;
};

type SessionStatusRow = {
    status: string;
    count: number;
};

type TopMachineRow = {
    id: number;
    name: string;
    sessions: number;
};

type TopTemplateRow = {
    id: number;
    name: string;
    usage: number;
};

type DashboardPageProps = {
    reportRange: ReportRange;
    summaryCards: SummaryCards;
    dailyCharts: DailyChartPoint[];
    paymentStatus: PaymentStatusRow[];
    sessionStatus: SessionStatusRow[];
    topMachines: TopMachineRow[];
    topTemplates: TopTemplateRow[];
};

const quickRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', preset: 'this-month' as const },
    { label: 'Last month', preset: 'last-month' as const },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);

const formatStatus = (value: string) =>
    value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const toDateValue = (date: Date) => date.toISOString().slice(0, 10);

const buildRange = (input: (typeof quickRanges)[number]) => {
    const today = new Date();
    const end = new Date(today);
    let start = new Date(today);

    if (input.days !== undefined) {
        start.setDate(today.getDate() - (input.days - 1));
    } else if (input.preset === 'this-month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end.setFullYear(start.getFullYear(), start.getMonth() + 1, 0);
    }

    return {
        start_date: toDateValue(start),
        end_date: toDateValue(end),
    };
};

type MiniBarChartProps = {
    data: DailyChartPoint[];
    valueKey: 'sessions' | 'revenue';
    colorClass: string;
};

function MiniBarChart({ data, valueKey, colorClass }: MiniBarChartProps) {
    const maxValue = Math.max(1, ...data.map((item) => item[valueKey]));

    return (
        <div className="flex min-h-[230px] items-end gap-2 overflow-x-auto pb-2">
            {data.map((item) => {
                const value = item[valueKey];
                const height = Math.max(8, Math.round((value / maxValue) * 155));

                return (
                    <div key={`${valueKey}-${item.day}`} className="flex min-w-[28px] flex-col items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{value}</span>
                        <div className={`w-5 rounded-sm ${colorClass}`} style={{ height }} title={`${item.day}: ${value}`} />
                        <span className="text-[10px] text-muted-foreground">{item.day}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Dashboard() {
    const { reportRange, summaryCards, dailyCharts, paymentStatus, sessionStatus, topMachines, topTemplates } =
        usePage<DashboardPageProps>().props;
    const [startDate, setStartDate] = useState(reportRange.startDate);
    const [endDate, setEndDate] = useState(reportRange.endDate);

    const applyFilter = () => {
        router.get(
            dashboard({
                query: { start_date: startDate, end_date: endDate },
            }).url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <CardTitle className="text-base">Period Filter</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                {quickRanges.map((item) => (
                                    <Button
                                        key={item.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                dashboard({ query: buildRange(item) }).url,
                                                {},
                                                { preserveState: true, preserveScroll: true, replace: true },
                                            )
                                        }
                                    >
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">From Date</span>
                            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-[210px]" />
                        </div>
                        <div className="grid gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground">To Date</span>
                            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-[210px]" />
                        </div>
                        <Button onClick={applyFilter}>Apply</Button>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Total Sessions</p>
                                <p className="text-3xl font-semibold">{summaryCards.totalSessions}</p>
                            </div>
                            <Activity className="h-7 w-7 text-blue-500" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Total Revenue</p>
                                <p className="text-3xl font-semibold">{formatCurrency(summaryCards.totalRevenue)}</p>
                            </div>
                            <Coins className="h-7 w-7 text-green-500" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Successful Transactions</p>
                                <p className="text-3xl font-semibold">{summaryCards.successfulTransactions}</p>
                            </div>
                            <CircleCheck className="h-7 w-7 text-emerald-500" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Avg per Session</p>
                                <p className="text-3xl font-semibold">{formatCurrency(summaryCards.averagePerSession)}</p>
                            </div>
                            <TrendingUp className="h-7 w-7 text-fuchsia-500" />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sessions per Day</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MiniBarChart data={dailyCharts} valueKey="sessions" colorClass="bg-blue-500/85" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Revenue per Day</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MiniBarChart data={dailyCharts} valueKey="revenue" colorClass="bg-green-500/85" />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payment Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <th className="py-2">Status</th>
                                        <th className="py-2 text-right">Count</th>
                                        <th className="py-2 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentStatus.map((row) => (
                                        <tr key={row.status} className="border-b last:border-0">
                                            <td className="py-2">{formatStatus(row.status)}</td>
                                            <td className="py-2 text-right">{row.count}</td>
                                            <td className="py-2 text-right">{formatCurrency(row.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Session Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <th className="py-2">Status</th>
                                        <th className="py-2 text-right">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionStatus.map((row) => (
                                        <tr key={row.status} className="border-b last:border-0">
                                            <td className="py-2">{formatStatus(row.status)}</td>
                                            <td className="py-2 text-right">{row.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Machines (by Sessions)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <th className="py-2">#</th>
                                        <th className="py-2">Machine</th>
                                        <th className="py-2 text-right">Sessions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topMachines.map((row, index) => (
                                        <tr key={row.id} className="border-b last:border-0">
                                            <td className="py-2">{index + 1}</td>
                                            <td className="py-2">{row.name}</td>
                                            <td className="py-2 text-right">{row.sessions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <GalleryVertical className="h-4 w-4" />
                                Top Templates (by Usage)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                                        <th className="py-2">#</th>
                                        <th className="py-2">Template</th>
                                        <th className="py-2 text-right">Usage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topTemplates.map((row, index) => (
                                        <tr key={row.id} className="border-b last:border-0">
                                            <td className="py-2">{index + 1}</td>
                                            <td className="py-2">{row.name}</td>
                                            <td className="py-2 text-right">{row.usage}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
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
