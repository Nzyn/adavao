<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'attachments.*' => 'nullable|file|max:10240', // 10MB max
        ]);

        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                // Store in public/announcements folder. ensure 'public' disk is configured
                $path = $file->store('announcements', 'public');
                $attachmentPaths[] = $path;
            }
        }

        Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'attachments' => !empty($attachmentPaths) ? $attachmentPaths : null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Announcement posted successfully!');
    }
}
