import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';

interface GradientBackgroundProps {
    children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
    useEffect(() => {
        // For web, apply gradient to document root
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            const html = document.documentElement;
            const body = document.body;
            
            // Apply styles to html
            if (html) {
                html.style.margin = '0';
                html.style.padding = '0';
                html.style.minHeight = '100vh';
                html.style.background = '#FFFFFF';
                html.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(188, 198, 204, 1) 100%, rgba(29, 51, 87, 1) 58%)';
                html.style.backgroundAttachment = 'fixed';
            }
            
            // Apply styles to body
            if (body) {
                body.style.margin = '0';
                body.style.padding = '0';
                body.style.minHeight = '100vh';
                body.style.background = '#FFFFFF';
                body.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(188, 198, 204, 1) 100%, rgba(29, 51, 87, 1) 58%)';
                body.style.backgroundAttachment = 'fixed';
            }
        }
    }, []);

    // For native, just return children
    if (Platform.OS !== 'web') {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                {children}
            </View>
        );
    }

    // For web, just return children - gradient is on document root
    return <>{children}</>;
};

export default GradientBackground;
