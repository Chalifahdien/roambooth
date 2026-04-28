<?php
$content = file_get_contents("app/Http/Controllers/DashboardController.php");
$content = str_replace("public function __invoke(Request \$request): Response\n    {", "public function __invoke(Request \$request): Response\n    {\n        \$activeMachineId = \$request->session()->get(\"active_machine_id\") ?? \App\Models\Machine::first()?->id;", $content);
$content = str_replace("Transaction::where", "Transaction::where(\"machine_id\", \$activeMachineId)->where", $content);
$content = str_replace("Transaction::with", "Transaction::where(\"machine_id\", \$activeMachineId)->with", $content);
$content = str_replace("Transaction::select", "Transaction::where(\"machine_id\", \$activeMachineId)->select", $content);
$content = str_replace("Voucher::where", "Voucher::where(\"machine_id\", \$activeMachineId)->where", $content);
$content = str_replace("function () use (\$rangeStart", "function () use (\$activeMachineId, \$rangeStart", $content);
$content = preg_replace("/private function buildPerformanceTargets\(Carbon \\$todayStart, Carbon \\$todayEnd\): array\n    \{/", "private function buildPerformanceTargets(Carbon \$todayStart, Carbon \$todayEnd, \$activeMachineId): array\n    {", $content);
$content = preg_replace("/\\$this->buildPerformanceTargets\(\\$rangeStart, \\$rangeEnd\)/", "\$this->buildPerformanceTargets(\$rangeStart, \$rangeEnd, \$activeMachineId)", $content);
$content = preg_replace("/private function buildRangeTransactionChart\(Carbon \\$rangeStart, Carbon \\$rangeEnd\): array\n    \{/", "private function buildRangeTransactionChart(Carbon \$rangeStart, Carbon \$rangeEnd, \$activeMachineId): array\n    {", $content);
$content = preg_replace("/\\$this->buildRangeTransactionChart\(\\$rangeStart, \\$rangeEnd\)/", "\$this->buildRangeTransactionChart(\$rangeStart, \$rangeEnd, \$activeMachineId)", $content);
file_put_contents("app/Http/Controllers/DashboardController.php", $content);

