<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    /**
     * Get all unread notifications for the authenticated user.
     */
    public function getUnread(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $notifications = Cache::remember("notifications_unread_{$userId}", 60, function() use ($userId) {
                return Notification::where('user_id', $userId)
                    ->where('read', false)
                    ->orderBy('created_at', 'desc')
                    ->get();
            });

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'count' => $notifications->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching unread notifications', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching notifications'
            ], 500);
        }
    }

    /**
     * Get all notifications for the authenticated user.
     */
    public function getAll(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 20);
            $offset = $request->get('offset', 0);

            $userId = auth()->id();
            $cacheKey = "notifications_all_{$userId}_{$limit}_{$offset}";
            
            $notifications = Cache::remember($cacheKey, 60, function() use ($userId, $limit, $offset) {
                return Notification::where('user_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->offset($offset)
                    ->get();
            });

            $total = Cache::remember("notifications_count_{$userId}", 60, function() use ($userId) {
                return Notification::where('user_id', $userId)->count();
            });

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching notifications', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching notifications'
            ], 500);
        }
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id): JsonResponse
    {
        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            $notification->markAsRead();
            
            // Invalidate cache
            $userId = auth()->id();
            Cache::forget("notifications_unread_{$userId}");
            Cache::forget("unread_notifications_count_{$userId}");
            // We can't easily invalidate specific pagination keys, but they have short TTL (60s)
            // Ideally we would use tags if using Redis, but this is a quick fix.
            // A brute-force clear could be used if strictly needed, but let's rely on TTL for pagination lists.

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error marking notification as read', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error marking notification as read'
            ], 404);
        }
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            Notification::where('user_id', auth()->id())
                ->where('read', false)
                ->update(['read' => true]);

            // Invalidate cache
            $userId = auth()->id();
            Cache::forget("notifications_unread_{$userId}");
            Cache::forget("unread_notifications_count_{$userId}");

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error marking all notifications as read', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error marking notifications as read'
            ], 500);
        }
    }

    /**
     * Delete a notification.
     */
    public function delete(string $id): JsonResponse
    {
        try {
            $notification = Notification::where('id', $id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            $notification->delete();

            // Invalidate cache
            $userId = auth()->id();
            Cache::forget("notifications_unread_{$userId}");
            Cache::forget("unread_notifications_count_{$userId}");
            Cache::forget("notifications_count_{$userId}");

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting notification', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error deleting notification'
            ], 404);
        }
    }

    /**
     * Get unread notification count.
     */
    public function getUnreadCount(): JsonResponse
    {
        try {
            $userId = auth()->id();
            $count = Cache::remember("unread_notifications_count_{$userId}", 60, function() use ($userId) {
                 return Notification::where('user_id', $userId)
                    ->where('read', false)
                    ->count();
            });

            return response()->json([
                'success' => true,
                'unread_count' => $count
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching unread count', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching unread count'
            ], 500);
        }
    }
}
