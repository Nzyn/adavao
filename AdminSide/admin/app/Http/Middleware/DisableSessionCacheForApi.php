<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DisableSessionCacheForApi
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Only apply to API routes that need caching
        if ($request->is('api/reports') || $request->is('api/csv-crime-data')) {
            // Remove session-based no-cache headers
            $response->headers->remove('Cache-Control');
            $response->headers->remove('Pragma');
            
            // Let the controller set its own cache headers
        }
        
        return $response;
    }
}
