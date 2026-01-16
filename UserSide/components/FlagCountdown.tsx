import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface FlagCountdownProps {
    expiresAt: string | null;
}

const FlagCountdown: React.FC<FlagCountdownProps> = ({ expiresAt }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft('');
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const diff = expiry.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Expiring soon...');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`Restriction lifts in ${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`Restriction lifts in ${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`Restriction lifts in ${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!timeLeft) {
        return null;
    }

    return <Text style={styles.countdown}>⏱️ {timeLeft}</Text>;
};

const styles = StyleSheet.create({
    countdown: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
});

export default FlagCountdown;
