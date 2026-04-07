<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Transaction;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $timezone = config('app.timezone', 'Asia/Jakarta');
        $cacheTtlSeconds = (int) config('dashboard.cache_ttl_seconds', 120);

        $now = Carbon::now($timezone);
        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy()->endOfDay();
        $yesterdayStart = $todayStart->copy()->subDay()->startOfDay();
        $yesterdayEnd = $todayStart->copy()->subDay()->endOfDay();

        $payload = Cache::remember(
            "dashboard:metrics:{$todayStart->toDateString()}",
            now()->addSeconds($cacheTtlSeconds),
            function () use ($todayStart, $todayEnd, $yesterdayStart, $yesterdayEnd, $now) {
                $successStatus = 'COMPLETED';

                $todayTransactions = Transaction::whereBetween('created_at', [$todayStart, $todayEnd])->count();
                $yesterdayTransactions = Transaction::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])->count();

                $todayRevenue = (int) Transaction::whereBetween('created_at', [$todayStart, $todayEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');
                $yesterdayRevenue = (int) Transaction::whereBetween('created_at', [$yesterdayStart, $yesterdayEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');

                $todaySessions = Transaction::whereBetween('started_at', [$todayStart, $todayEnd])->count();
                $todayVoucherUsage = Transaction::whereBetween('created_at', [$todayStart, $todayEnd])
                    ->whereNotNull('voucher_id')
                    ->count();
                $activeVoucherCount = Voucher::where('status', 'ready')->count();

                $stats = [
                    [
                        'title' => 'Transaksi Hari Ini',
                        'value' => (string) $todayTransactions,
                        'change' => $this->formatChange($todayTransactions, $yesterdayTransactions, 'dari kemarin'),
                        'icon' => 'credit-card',
                    ],
                    [
                        'title' => 'Pendapatan Hari Ini',
                        'value' => 'Rp ' . number_format($todayRevenue, 0, ',', '.'),
                        'change' => $this->formatChange($todayRevenue, $yesterdayRevenue, 'dari kemarin'),
                        'icon' => 'dollar-sign',
                    ],
                    [
                        'title' => 'Sesi Photo Booth',
                        'value' => (string) $todaySessions,
                        'change' => 'Berdasarkan started_at hari ini',
                        'icon' => 'camera',
                    ],
                    [
                        'title' => 'Voucher Dipakai',
                        'value' => (string) $todayVoucherUsage,
                        'change' => $activeVoucherCount . ' voucher ready',
                        'icon' => 'ticket',
                    ],
                ];

                $recentActivities = Transaction::with(['machine:id,name', 'template:id,name'])
                    ->latest()
                    ->limit(4)
                    ->get()
                    ->map(function (Transaction $transaction) {
                        $machineName = $transaction->machine?->name ?? 'Unknown Machine';
                        $templateName = $transaction->template?->name ?? 'Tanpa Template';
                        $status = strtoupper((string) $transaction->status);

                        return [
                            'id' => $transaction->id,
                            'title' => "Transaksi {$transaction->transaction_id} {$status} di {$machineName} ({$templateName})",
                            'time' => $transaction->created_at?->diffForHumans() ?? '-',
                        ];
                    })
                    ->values()
                    ->all();

                $thisWeekStart = $now->copy()->startOfWeek();
                $thisMonthStart = $now->copy()->startOfMonth();

                $thisWeekRevenue = (int) Transaction::where('created_at', '>=', $thisWeekStart)
                    ->where('status', $successStatus)
                    ->sum('amount');

                $thisMonthRevenue = (int) Transaction::where('created_at', '>=', $thisMonthStart)
                    ->where('status', $successStatus)
                    ->sum('amount');

                $totalRevenue = (int) Transaction::where('status', $successStatus)
                    ->sum('amount');

                $revenueSummary = [
                    'today' => 'Rp ' . number_format($todayRevenue, 0, ',', '.'),
                    'yesterday' => 'Rp ' . number_format($yesterdayRevenue, 0, ',', '.'),
                    'thisWeek' => 'Rp ' . number_format($thisWeekRevenue, 0, ',', '.'),
                    'thisMonth' => 'Rp ' . number_format($thisMonthRevenue, 0, ',', '.'),
                    'total' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                ];

                return [
                    'stats' => $stats,
                    'recentActivities' => $recentActivities,
                    'performanceTargets' => $this->buildPerformanceTargets($todayStart, $todayEnd),
                    'transactionChartData' => $this->buildWeeklyTransactionChart($now),
                    'revenueSummary' => $revenueSummary,
                ];
            }
        );

        return Inertia::render('dashboard', [
            'stats' => $payload['stats'],
            'recentActivities' => $payload['recentActivities'],
            'performanceTargets' => $payload['performanceTargets'],
            'transactionChartData' => $payload['transactionChartData'],
            'revenueSummary' => $payload['revenueSummary'],
        ]);
    }

    private function formatChange(int $today, int $yesterday, string $suffix): string
    {
        if ($yesterday === 0) {
            if ($today === 0) {
                return '0% ' . $suffix;
            }

            return '+100% ' . $suffix;
        }

        $percent = (($today - $yesterday) / $yesterday) * 100;
        $rounded = round($percent);
        $sign = $rounded > 0 ? '+' : '';

        return "{$sign}{$rounded}% {$suffix}";
    }

    private function buildPerformanceTargets(Carbon $todayStart, Carbon $todayEnd): array
    {
        $transactionTarget = (int) config('dashboard.targets.transactions_per_day', 100);
        $revenueTarget = (int) config('dashboard.targets.revenue_per_day', 5000000);
        $uptimeTarget = (int) config('dashboard.targets.machine_uptime_percent', 95);

        $todayTransactionCount = Transaction::whereBetween('created_at', [$todayStart, $todayEnd])->count();
        $todayRevenue = (int) Transaction::whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', 'SUCCESS')
            ->sum('amount');
        $activeMachines = Machine::where('is_active', true)->count();
        $totalMachines = Machine::count();

        $transactionProgress = max(0, min(100, (int) round(($todayTransactionCount / max(1, $transactionTarget)) * 100)));
        $revenueProgress = max(0, min(100, (int) round(($todayRevenue / max(1, $revenueTarget)) * 100)));
        $uptimeProgress = $totalMachines > 0
            ? max(0, min(100, (int) round(($activeMachines / $totalMachines) * 100)))
            : $uptimeTarget;

        return [
            ['label' => 'Target Transaksi', 'value' => $transactionProgress],
            ['label' => 'Target Pendapatan', 'value' => $revenueProgress],
            ['label' => 'Uptime Mesin', 'value' => $uptimeProgress],
        ];
    }

    private function buildWeeklyTransactionChart(Carbon $now): array
    {
        $startDate = $now->copy()->startOfDay()->subDays(6);
        $endDate = $now->copy()->endOfDay();

        $raw = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'date');

        $labels = [
            0 => 'Min',
            1 => 'Sen',
            2 => 'Sel',
            3 => 'Rab',
            4 => 'Kam',
            5 => 'Jum',
            6 => 'Sab',
        ];

        $chart = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateKey = $date->toDateString();

            $chart[] = [
                'day' => $labels[$date->dayOfWeek],
                'total' => (int) ($raw[$dateKey] ?? 0),
            ];
        }

        return $chart;
    }
}

