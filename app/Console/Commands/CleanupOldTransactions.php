<?php

namespace App\Console\Commands;

use App\Models\Transaction;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

#[Signature('app:cleanup-old-transactions')]
#[Description('Cleanup transaction photos and final images older than 3 days')]
class CleanupOldTransactions extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subDays(3);

        $this->info("Cleaning up transactions created before {$cutoffDate->toDateTimeString()}...");

        $transactions = Transaction::with(['photos', 'finalImage'])
            ->where('created_at', '<', $cutoffDate)
            ->get();

        $count = $transactions->count();
        $this->info("Found {$count} transactions to clean up.");

        foreach ($transactions as $transaction) {
            $this->comment("Deleting transaction #{$transaction->id} ({$transaction->transaction_id})...");
            
            // Delete session photos from storage
            foreach ($transaction->photos as $photo) {
                if ($photo->photo_path) {
                    Storage::disk('public')->delete($photo->photo_path);
                }
            }

            // Delete final image and video from storage
            if ($transaction->finalImage) {
                if ($transaction->finalImage->image_path) {
                    Storage::disk('public')->delete($transaction->finalImage->image_path);
                }
                if ($transaction->finalImage->video_path) {
                    Storage::disk('public')->delete($transaction->finalImage->video_path);
                }
            }

            // Delete the transaction record (cascades to related tables)
            $transaction->delete();
        }

        $this->info("Cleanup completed.");
    }
}
