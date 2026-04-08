<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinalImage;
use App\Models\Machine;
use App\Models\Transaction;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FinalImageController extends Controller
{
    /**
     * Store a final image and optional video for a transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $token = $request->header('X-Machine-Token');

        if (!$token) {
            return response()->json(['message' => 'Machine token is required'], 401);
        }

        $machine = Machine::where('token', $token)->where('is_active', true)->first();

        if (!$machine) {
            return response()->json(['message' => 'Invalid or inactive machine token'], 403);
        }

        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|exists:transactions,id',
            'template_id' => 'required|exists:templates,id',
            'image' => 'required|image|max:10240', // Max 10MB
            'video' => 'nullable|mimes:mp4,mov,avi,webm|max:51200',
            'photos' => 'nullable|array',
            'photos.*.frame_id' => 'required_with:photos|exists:template_frames,id',
            'photos.*.image' => 'required_with:photos|image|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify transaction belongs to this machine
        $transaction = Transaction::where('id', $request->transaction_id)
            ->where('machine_id', $machine->id)
            ->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found or unauthorized'], 404);
        }

        $baseFolder = 'transaction_photo/' . $transaction->id;

        // 1. Process Final Image/Video
        $imagePath = $request->file('image')->store($baseFolder . '/final_images', 'public');
        $videoPath = $request->hasFile('video')
            ? $request->file('video')->store($baseFolder . '/final_videos', 'public')
            : null;

        $finalImage = FinalImage::create([
            'transaction_id' => $transaction->id,
            'token' => $request->token_final_image,
            'image_path' => $imagePath,
            'video_path' => $videoPath,
        ]);

        // 2. Process Individual Photos (Source Photos)
        if ($request->has('photos') && is_array($request->photos)) {
            foreach ($request->file('photos') as $index => $photoData) {
                if (isset($photoData['image'])) {
                    $photoPath = $photoData['image']->store($baseFolder . '/photos', 'public');

                    \App\Models\TransactionPhoto::create([
                        'transaction_id' => $transaction->id,
                        'frame_id' => $request->input("photos.$index.frame_id"),
                        'photo_path' => $photoPath,
                        'taken_at' => now(), // Or use a value from request if provided
                    ]);
                }
            }
        }

        // 3. Update Transaction status and finished_at
        $transaction->update([
            'status' => 'COMPLETED',
            'template_id' => $request->template_id,
            'finished_at' => now(),
        ]);

        if ($transaction->voucher_id) {
            /** @var \App\Models\Voucher|null $usedVoucher */
            $usedVoucher = Voucher::find($transaction->voucher_id);
            if ($usedVoucher) {
                $usedVoucher->used_count += 1;
                if ($usedVoucher->used_count >= $usedVoucher->limit) {
                    $usedVoucher->status = 'used';
                }
                $usedVoucher->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Final image uploaded successfully',
            'data' => $finalImage
        ], 201);
    }

    /**
     * Update the print status of a final image.
     */
    public function print(Request $request, $id): JsonResponse
    {
        $token = $request->header('X-Machine-Token');

        if (!$token) {
            return response()->json(['message' => 'Machine token is required'], 401);
        }

        $machine = Machine::where('token', $token)->where('is_active', true)->first();

        if (!$machine) {
            return response()->json(['message' => 'Invalid or inactive machine token'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount_print' => 'required|integer',
            'print_quantity' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $finalImage = FinalImage::where('id', $id)
            ->whereHas('transaction', function ($query) use ($machine) {
                $query->where('machine_id', $machine->id);
            })
            ->first();

        if (!$finalImage) {
            return response()->json(['message' => 'Final image record not found or unauthorized'], 404);
        }

        $finalImage->update([
            'amount_print' => $request->amount_print,
            'print_quantity' => $request->print_quantity ?? 1,
            'printed' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Print status updated successfully',
            'data' => $finalImage
        ]);
    }
}