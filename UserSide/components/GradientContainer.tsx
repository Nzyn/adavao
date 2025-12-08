import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';

interface GradientContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const GradientContainer: React.FC<GradientContainerProps> = ({ children, style }) => {
    // For web, use CSS gradient border
    if (Platform.OS === 'web') {
        return (
            <div
                style={{
                    marginVertical: 8,
                    marginHorizontal: 12,
                    ...(style as React.CSSProperties),
                    background: 'linear-gradient(135deg, #1D3557, #bcc6cc, #FFFFFF)',
                    borderRadius: '12px',
                    padding: '2px',
                }}
            >
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '16px',
                        boxShadow: '0 2px 4px rgba(29, 53, 87, 0.15)',
                    }}
                >
                    {children as React.ReactNode}
                </div>
            </div>
        );
    }

    // For native, use simpler styling with border
    return (
        <View
            style={[
                {
                    marginVertical: 8,
                    marginHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#1D3557',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <View
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    overflow: 'hidden',
                    padding: 16,
                    elevation: 3,
                    shadowColor: '#1D3557',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                }}
            >
                {children}
            </View>
        </View>
    );
};

export default GradientContainer;
