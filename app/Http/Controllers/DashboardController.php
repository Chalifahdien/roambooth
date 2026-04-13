<?php

namespace App\Http\Controllers;

use App\Models\Machine;
use App\Models\Transaction;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $timezone = config('app.timezone', 'Asia/Jakarta');
        $cacheTtlSeconds = (int) config('dashboard.cache_ttl_seconds', 120);

        $now = Carbon::now($timezone);
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        if ($startDate === null && $endDate === null) {
            $reportStart = $now->copy()->startOfDay();
            $reportEnd = $now->copy()->endOfDay();
        } else {
            $reportStart = Carbon::parse($startDate ?? $endDate, $timezone)->startOfDay();
            $reportEnd = Carbon::parse($endDate ?? $startDate, $timezone)->endOfDay();
        }

        if ($reportEnd->lt($reportStart)) {
            [$reportStart, $reportEnd] = [$reportEnd->copy()->startOfDay(), $reportStart->copy()->endOfDay()];
        }

        $payload = Cache::remember(
            "dashboard:metrics:{$reportStart->toDateString()}:{$reportEnd->toDateString()}",
            now()->addSeconds($cacheTtlSeconds),
            function () use ($reportStart, $reportEnd) {
                $successStatus = 'COMPLETED';
                $periodDays = $reportStart->diffInDays($reportEnd) + 1;
                $previousPeriodEnd = $reportStart->copy()->subDay()->endOfDay();
                $previousPeriodStart = $previousPeriodEnd->copy()->subDays($periodDays - 1)->startOfDay();

                $rangeTransactions = Transaction::whereBetween('created_at', [$reportStart, $reportEnd])->count();
                $previousTransactions = Transaction::whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])->count();

                $rangeRevenue = (int) Transaction::whereBetween('created_at', [$reportStart, $reportEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');
                $previousRevenue = (int) Transaction::whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])
                    ->where('status', $successStatus)
                    ->sum('amount');

                $rangeSessions = Transaction::whereBetween('started_at', [$reportStart, $reportEnd])->count();
                $rangeVoucherUsage = Transaction::whereBetween('created_at', [$reportStart, $reportEnd])
                    ->whereNotNull('voucher_id')
                    ->count();
                $activeVoucherCount = Voucher::where('status', 'ready')->count();

                $stats = [
                    [
                        'title' => 'Transaksi Periode',
                        'value' => (string) $rangeTransactions,
                        'change' => $this->formatChange($rangeTransactions, $previousTransactions, 'dari periode sebelumnya'),
                        'icon' => 'credit-card',
                    ],
                    [
                        'title' => 'Pendapatan Periode',
                        'value' => 'Rp ' . number_format($rangeRevenue, 0, ',', '.'),
                        'change' => $this->formatChange($rangeRevenue, $previousRevenue, 'dari periode sebelumnya'),
                        'icon' => 'dollar-sign',
                    ],
                    [
                        'title' => 'Sesi Photo Booth',
                        'value' => (string) $rangeSessions,
                        'change' => 'Berdasarkan started_at pada periode dipilih',
                        'icon' => 'camera',
                    ],
                    [
                        'title' => 'Voucher Dipakai',
                        'value' => (string) $rangeVoucherUsage,
                        'change' => $activeVoucherCount . ' voucher ready',
                        'icon' => 'ticket',
                    ],
                ];

                $recentActivities = Transaction::with(['machine:id,name', 'template:id,name'])
                    ->whereBetween('created_at', [$reportStart, $reportEnd])
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

                $periodAnchor = $reportEnd->copy();
                $thisWeekStart = $periodAnchor->copy()->startOfWeek();
                $thisMonthStart = $periodAnchor->copy()->startOfMonth();

                $thisWeekRevenue = (int) Transaction::where('created_at', '>=', $thisWeekStart)
                    ->where('created_at', '<=', $periodAnchor)
                    ->where('status', $successStatus)
                    ->sum('amount');

                $thisMonthRevenue = (int) Transaction::where('created_at', '>=', $thisMonthStart)
                    ->where('created_at', '<=', $periodAnchor)
                    ->where('status', $successStatus)
                    ->sum('amount');

                $totalRevenue = (int) Transaction::where('status', $successStatus)
                    ->sum('amount');

                $revenueSummary = [
                    'today' => 'Rp ' . number_format($rangeRevenue, 0, ',', '.'),
                    'yesterday' => 'Rp ' . number_format($previousRevenue, 0, ',', '.'),
                    'thisWeek' => 'Rp ' . number_format($thisWeekRevenue, 0, ',', '.'),
                    'thisMonth' => 'Rp ' . number_format($thisMonthRevenue, 0, ',', '.'),
                    'total' => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
                ];

                return [
                    'stats' => $stats,
                    'recentActivities' => $recentActivities,
                    'performanceTargets' => $this->buildPerformanceTargets($reportStart, $reportEnd),
                    'transactionChartData' => $this->buildTransactionChartForRange($reportStart, $reportEnd),
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
            'reportRange' => [
                'startDate' => $reportStart->toDateString(),
                'endDate' => $reportEnd->toDateString(),
                'label' => $reportStart->isSameDay($reportEnd)
                    ? $reportStart->translatedFormat('d M Y')
                    : $reportStart->translatedFormat('d M Y') . ' - ' . $reportEnd->translatedFormat('d M Y'),
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
            ->where('status', 'COMPLETED')
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

    private function buildTransactionChartForRange(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $startDate = $rangeStart->copy()->startOfDay();
        $endDate = $rangeEnd->copy()->endOfDay();

        if ($startDate->diffInDays($endDate) + 1 > 31) {
            $startDate = $endDate->copy()->subDays(30)->startOfDay();
        }

        $raw = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'date');

        $chart = [];
        $totalDays = $startDate->diffInDays($endDate) + 1;
        for ($i = 0; $i < $totalDays; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateKey = $date->toDateString();

            $chart[] = [
                'day' => $date->translatedFormat('d M'),
                'total' => (int) ($raw[$dateKey] ?? 0),
            ];
        }

        return $chart;
    }
}

