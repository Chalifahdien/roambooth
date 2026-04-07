<?php

return [
    // Cache duration for dashboard aggregate payload.
    'cache_ttl_seconds' => env('DASHBOARD_CACHE_TTL_SECONDS', 120),

    // KPI targets used to compute progress bars.
    'targets' => [
        'transactions_per_day' => env('DASHBOARD_TARGET_TRANSACTIONS_PER_DAY', 100),
        'revenue_per_day' => env('DASHBOARD_TARGET_REVENUE_PER_DAY', 5000000),
        'machine_uptime_percent' => env('DASHBOARD_TARGET_MACHINE_UPTIME_PERCENT', 95),
    ],
];

