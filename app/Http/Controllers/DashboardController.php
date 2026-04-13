<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
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
                $rangeQuery = Transaction::query()->whereBetween('created_at', [$reportStart, $reportEnd]);

                $totalSessions = (clone $rangeQuery)->count();
                $totalRevenue = (int) (clone $rangeQuery)
                    ->where('status', $successStatus)
                    ->sum('amount');
                $successfulTransactions = (clone $rangeQuery)
                    ->where('status', $successStatus)
                    ->count();
                $averagePerSession = $totalSessions > 0
                    ? (int) round($totalRevenue / $totalSessions)
                    : 0;

                $chartData = $this->buildDailyChart($reportStart, $reportEnd, $successStatus);

                $paymentStatus = (clone $rangeQuery)
                    ->select('status', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(amount),0) as total_amount'))
                    ->groupBy('status')
                    ->orderByDesc('count')
                    ->get()
                    ->map(fn ($row) => [
                        'status' => (string) $row->status,
                        'count' => (int) $row->count,
                        'totalAmount' => (int) $row->total_amount,
                    ])
                    ->values()
                    ->all();

                $sessionStatus = (clone $rangeQuery)
                    ->select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->orderByDesc('count')
                    ->get()
                    ->map(fn ($row) => [
                        'status' => (string) $row->status,
                        'count' => (int) $row->count,
                    ])
                    ->values()
                    ->all();

                $topMachines = (clone $rangeQuery)
                    ->join('machines', 'transactions.machine_id', '=', 'machines.id')
                    ->select('machines.id', 'machines.name', DB::raw('COUNT(transactions.id) as sessions'))
                    ->groupBy('machines.id', 'machines.name')
                    ->orderByDesc('sessions')
                    ->limit(5)
                    ->get()
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => (string) $row->name,
                        'sessions' => (int) $row->sessions,
                    ])
                    ->values()
                    ->all();

                $topTemplates = (clone $rangeQuery)
                    ->whereNotNull('transactions.template_id')
                    ->join('templates', 'transactions.template_id', '=', 'templates.id')
                    ->select('templates.id', 'templates.name', DB::raw('COUNT(transactions.id) as usage'))
                    ->groupBy('templates.id', 'templates.name')
                    ->orderByDesc('usage')
                    ->limit(5)
                    ->get()
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => (string) $row->name,
                        'usage' => (int) $row->usage,
                    ])
                    ->values()
                    ->all();

                return [
                    'summaryCards' => [
                        'totalSessions' => $totalSessions,
                        'totalRevenue' => $totalRevenue,
                        'successfulTransactions' => $successfulTransactions,
                        'averagePerSession' => $averagePerSession,
                    ],
                    'dailyCharts' => $chartData,
                    'paymentStatus' => $paymentStatus,
                    'sessionStatus' => $sessionStatus,
                    'topMachines' => $topMachines,
                    'topTemplates' => $topTemplates,
                ];
            }
        );

        return Inertia::render('dashboard', [
            'summaryCards' => $payload['summaryCards'],
            'dailyCharts' => $payload['dailyCharts'],
            'paymentStatus' => $payload['paymentStatus'],
            'sessionStatus' => $payload['sessionStatus'],
            'topMachines' => $payload['topMachines'],
            'topTemplates' => $payload['topTemplates'],
            'reportRange' => [
                'startDate' => $reportStart->toDateString(),
                'endDate' => $reportEnd->toDateString(),
                'label' => $reportStart->isSameDay($reportEnd)
                    ? $reportStart->translatedFormat('d M Y')
                    : $reportStart->translatedFormat('d M Y') . ' - ' . $reportEnd->translatedFormat('d M Y'),
            ],
        ]);
    }

    private function buildDailyChart(Carbon $rangeStart, Carbon $rangeEnd, string $successStatus): array
    {
        $startDate = $rangeStart->copy()->startOfDay();
        $endDate = $rangeEnd->copy()->endOfDay();

        if ($startDate->diffInDays($endDate) + 1 > 31) {
            $startDate = $endDate->copy()->subDays(30)->startOfDay();
        }

        $sessionsRaw = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'date');

        $revenueRaw = Transaction::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COALESCE(SUM(amount),0) as total')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', $successStatus)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('total', 'date');

        $chart = [];
        $totalDays = $startDate->diffInDays($endDate) + 1;
        for ($i = 0; $i < $totalDays; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateKey = $date->toDateString();

            $chart[] = [
                'day' => $date->translatedFormat('d M'),
                'sessions' => (int) ($sessionsRaw[$dateKey] ?? 0),
                'revenue' => (int) ($revenueRaw[$dateKey] ?? 0),
            ];
        }

        return $chart;
    }
}

