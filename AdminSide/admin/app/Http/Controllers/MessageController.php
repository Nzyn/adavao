<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Display the messages page
     */
    public function index()
    {
        // Get all users (excluding the current admin)
        $users = User::where('id', '!=', Auth::id())
            ->orderBy('firstname', 'asc')
            ->orderBy('lastname', 'asc')
            ->get();

        return view('messages', compact('users'));
    }

    /**
     * Get messages for a specific user conversation
     */
    public function getConversation($userId)
    {
        $currentUserId = Auth::id();

        // Get all messages between the current admin and the selected user
        $messages = Message::where(function ($query) use ($currentUserId, $userId) {
            $query->where('sender_id', $currentUserId)
                  ->where('receiver_id', $userId);
        })
        ->orWhere(function ($query) use ($currentUserId, $userId) {
            $query->where('sender_id', $userId)
                  ->where('receiver_id', $currentUserId);
        })
        ->with(['sender', 'receiver'])
        ->orderBy('sent_at', 'asc')
        ->get();

        // Mark messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $currentUserId)
            ->where('status', false)
            ->update(['status' => true]);

        return response()->json([
            'success' => true,
            'messages' => $messages
        ]);
    }

    /**
     * Send a new message
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:5000',
        ]);

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
            'status' => false,
            'sent_at' => now(),
        ]);

        $message->load(['sender', 'receiver']);

        return response()->json([
            'success' => true,
            'message' => $message
        ]);
    }

    /**
     * Get unread message count
     */
    public function getUnreadCount()
    {
        $unreadCount = Message::where('receiver_id', Auth::id())
            ->where('status', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Get conversations list with unread count and last message (sorted by recent)
     */
    public function getConversationsList()
    {
        $currentUserId = Auth::id();

        // Get all unique users who have messaged with current admin
        $conversations = Message::where(function ($query) use ($currentUserId) {
            $query->where('sender_id', $currentUserId)
                  ->orWhere('receiver_id', $currentUserId);
        })
        ->select(DB::raw('CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as user_id, MAX(sent_at) as last_message_time'), 
                 'message as last_message')
        ->setBindings([$currentUserId])
        ->groupBy(DB::raw('CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END'), 'message')
        ->setBindings([$currentUserId, $currentUserId])
        ->orderBy('last_message_time', 'desc')
        ->get();

        // Get details for each conversation
        $result = [];
        foreach ($conversations as $conv) {
            $user = User::find($conv->user_id);
            if (!$user) continue;

            $unreadCount = Message::where('sender_id', $conv->user_id)
                ->where('receiver_id', $currentUserId)
                ->where('status', false)
                ->count();

            $result[] = [
                'id' => $user->id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'email' => $user->email,
                'last_message' => $conv->last_message,
                'last_message_time' => $conv->last_message_time,
                'unread_count' => $unreadCount
            ];
        }

        return response()->json([
            'success' => true,
            'conversations' => $result
        ]);
    }

    /**
     * Update typing status
     */
    public function updateTypingStatus(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'is_typing' => 'required|boolean'
        ]);

        try {
            $typingStatusFile = storage_path('app/typing_' . Auth::id() . '_' . $request->receiver_id . '.json');
            
            if ($request->is_typing) {
                file_put_contents($typingStatusFile, json_encode([
                    'is_typing' => true,
                    'timestamp' => now()->timestamp
                ]));
            } else {
                if (file_exists($typingStatusFile)) {
                    unlink($typingStatusFile);
                }
            }

            return response()->json([
                'success' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if user is typing
     */
    public function checkTypingStatus($userId)
    {
        try {
            $typingStatusFile = storage_path('app/typing_' . $userId . '_' . Auth::id() . '.json');
            
            if (file_exists($typingStatusFile)) {
                $data = json_decode(file_get_contents($typingStatusFile), true);
                
                // Check if typing status is still valid (within last 3 seconds)
                if (now()->timestamp - $data['timestamp'] < 3) {
                    return response()->json([
                        'success' => true,
                        'is_typing' => true
                    ]);
                } else {
                    unlink($typingStatusFile);
                }
            }

            return response()->json([
                'success' => true,
                'is_typing' => false
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'is_typing' => false
            ]);
        }
    }
}
