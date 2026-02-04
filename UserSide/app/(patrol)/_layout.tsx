import React from 'react';
import { Stack } from 'expo-router';

export default function PatrolLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="dispatches" />
            <Stack.Screen name="dispatch-details" />
            <Stack.Screen name="history" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
