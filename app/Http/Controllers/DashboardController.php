<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Transaction;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $timezone = config('app.timezone', 'Asia/Jakarta');
        $cacheTtlSeconds = (int) config('dashboard.cache_ttl_seconds', 120);

        $now = Carbon::now($timezone);
        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');

        $rangeStart = $startDateInput
            ? Carbon::parse($startDateInput, $timezone)->startOfDay()
            : $now->copy()->startOfDay();
        $rangeEnd = $endDateInput
            ? Carbon::parse($endDateInput, $timezone)->endOfDay()
            : $now->copy()->endOfDay();

        if ($rangeEnd->lt($rangeStart)) {
            [$rangeStart, $rangeEnd] = [$rangeEnd->copy()->startOfDay(), $rangeStart->copy()->endOfDay()];
        }

        $rangeDays = max(1, $rangeStart->diffInDays($rangeEnd) + 1);
        $previousRangeStart = $rangeStart->copy()->subDays($rangeDays);
        $previousRangeEnd = $rangeStart->copy()->subSecond();

        $payload = Cache::remember(
            "dashboard:metrics:{$rangeStart->toDateString()}:{$rangeEnd->toDateString()}",
            now()->addSeconds($cacheTtlSeconds),
            function () use ($rangeStart, $rangeEnd, $previousRangeStart, $previousRangeEnd) {
                $successStatus = 'COMPLETED';

                $periodTransactions = Transaction::whereBetween('created_at', [$rangeStart, $rangeEnd])->count();
                $previousPeriodTransactions = Transaction::whereBetween('created_at', [$previousRangeStart, $previousRangeEnd])->count();

                $periodRevenue = (int) Transaction::whereBetween('created_at', [$rangeStart, $rangeEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');
                $previousPeriodRevenue = (int) Transaction::whereBetween('created_at', [$previousRangeStart, $previousRangeEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');

                $periodSessions = Transaction::whereBetween('started_at', [$rangeStart, $rangeEnd])->count();
                $periodVoucherUsage = Transaction::whereBetween('created_at', [$rangeStart, $rangeEnd])
                    ->whereNotNull('voucher_id')
                    ->count();
                $activeVoucherCount = Voucher::where('status', 'ready')->count();

                $stats = [
                    [
                        'title' => 'Transaksi Periode',
                        'value' => (string) $periodTransactions,
                        'change' => $this->formatChange($periodTransactions, $previousPeriodTransactions, 'vs periode sebelumnya'),
                        'icon' => 'credit-card',
                    ],
                    [
                        'title' => 'Pendapatan Periode',
                        'value' => 'Rp ' . number_format($periodRevenue, 0, ',', '.'),
                        'change' => $this->formatChange($periodRevenue, $previousPeriodRevenue, 'vs periode sebelumnya'),
                        'icon' => 'dollar-sign',
                    ],
                    [
                        'title' => 'Sesi Photo Booth',
                        'value' => (string) $periodSessions,
                        'change' => 'Berdasarkan started_at di periode terpilih',
                        'icon' => 'camera',
                    ],
                    [
                        'title' => 'Voucher Dipakai',
                        'value' => (string) $periodVoucherUsage,
                        'change' => $activeVoucherCount . ' voucher ready',
                        'icon' => 'ticket',
                    ],
                ];

                $recentActivities = Transaction::with(['machine:id,name', 'template:id,name'])
                    ->whereBetween('created_at', [$rangeStart, $rangeEnd])
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

                $previousPeriodLabel = sprintf(
                    '%s - %s',
                    $previousRangeStart->translatedFormat('d M Y'),
                    $previousRangeEnd->translatedFormat('d M Y')
                );
                $selectedPeriodLabel = sprintf(
                    '%s - %s',
                    $rangeStart->translatedFormat('d M Y'),
                    $rangeEnd->translatedFormat('d M Y')
                );
                $successTransactions = Transaction::whereBetween('created_at', [$rangeStart, $rangeEnd])
                    ->where('status', $successStatus)
                    ->count();
                $successRate = $periodTransactions > 0
                    ? round(($successTransactions / $periodTransactions) * 100)
                    : 0;

                $totalRevenue = (int) Transaction::where('status', $successStatus)
                    ->sum('amount');

                $revenueSummary = [
                    'today' => 'Rp ' . number_format($periodRevenue, 0, ',', '.'),
                    'yesterday' => 'Rp ' . number_format($previousPeriodRevenue, 0, ',', '.'),
                    'thisWeek' => (string) $periodTransactions,
                    'thisMonth' => $successRate . '%',
                    'total' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                    'periodLabel' => $selectedPeriodLabel,
                    'previousPeriodLabel' => $previousPeriodLabel,
                ];

                return [
                    'stats' => $stats,
                    'recentActivities' => $recentActivities,
                    'performanceTargets' => $this->buildPerformanceTargets($rangeStart, $rangeEnd),
                    'transactionChartData' => $this->buildRangeTransactionChart($rangeStart, $rangeEnd),
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
            'reportFilters' => [
                'startDate' => $rangeStart->toDateString(),
                'endDate' => $rangeEnd->toDateString(),
            ],
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

    private function buildRangeTransactionChart(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $raw = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'date');

        $chart = [];
        $totalDays = max(1, $rangeStart->diffInDays($rangeEnd) + 1);
        for ($i = 0; $i < $totalDays; $i++) {
            $date = $rangeStart->copy()->addDays($i);
            $dateKey = $date->toDateString();

            $chart[] = [
                'day' => $date->translatedFormat('d M'),
                'total' => (int) ($raw[$dateKey] ?? 0),
            ];
        }

        return $chart;
    }
}

