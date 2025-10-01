import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useSession } from './SessionContext';

const SignalRContext = createContext({});

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
};

export const SignalRProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const [connectionState, setConnectionState] = useState('Disconnected');
    const { user, accessToken } = useSession();
    const connectionRef = useRef(null);
    const eventListenersRef = useRef(new Map());

    useEffect(() => {
        if (!user || !accessToken) {
            if (connectionRef.current) {
                console.log('📡 [SignalR] User logged out, disconnecting...');
                connectionRef.current.stop();
                connectionRef.current = null;
                setConnection(null);
                setConnectionState('Disconnected');
            }
            return;
        }

        const connectSignalR = async () => {
            try {
                console.log('📡 [SignalR] Creating connection...');

                const newConnection = new HubConnectionBuilder()
                    .withUrl('https://localhost:5001/hubs/notification', {
                        accessTokenFactory: () => accessToken,
                        withCredentials: false
                    })
                    .withAutomaticReconnect()
                    .configureLogging(LogLevel.Information)
                    .build();

                // Connection state event handlers
                newConnection.onclose((error) => {
                    console.log('❌ [SignalR] Connection closed', error);
                    setConnectionState('Disconnected');
                });

                newConnection.onreconnecting((error) => {
                    console.log('🔄 [SignalR] Reconnecting...', error);
                    setConnectionState('Reconnecting');
                });

                newConnection.onreconnected((connectionId) => {
                    console.log('✅ [SignalR] Reconnected with connection ID:', connectionId);
                    setConnectionState('Connected');

                    // Re-join groups after reconnection
                    if (user.currentBreweryId) {
                        newConnection.invoke('JoinBreweryGroup', user.currentBreweryId);
                    }
                });

                // Start the connection
                await newConnection.start();
                console.log('✅ [SignalR] Connected successfully');
                setConnectionState('Connected');

                // Join brewery group if user has selected a brewery
                if (user.currentBreweryId) {
                    await newConnection.invoke('JoinBreweryGroup', user.currentBreweryId);
                    console.log('🏭 [SignalR] Joined brewery group:', user.currentBreweryId);
                }

                connectionRef.current = newConnection;
                setConnection(newConnection);

            } catch (error) {
                console.error('❌ [SignalR] Connection failed:', error);
                setConnectionState('Failed');
            }
        };

        connectSignalR();

        // Cleanup on unmount or dependency change
        return () => {
            if (connectionRef.current) {
                console.log('📡 [SignalR] Cleaning up connection...');
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, [user, accessToken]);

    // Function to add event listeners
    const addEventListener = (eventName, callback) => {
        if (!connection) {
            console.warn('⚠️ [SignalR] Cannot add event listener - no connection');
            return;
        }

        // Remove existing listener for this event if any
        if (eventListenersRef.current.has(eventName)) {
            connection.off(eventName, eventListenersRef.current.get(eventName));
        }

        // Add new listener
        connection.on(eventName, callback);
        eventListenersRef.current.set(eventName, callback);

        console.log('👂 [SignalR] Added event listener for:', eventName);
    };

    // Function to remove event listeners
    const removeEventListener = (eventName) => {
        if (!connection || !eventListenersRef.current.has(eventName)) {
            return;
        }

        connection.off(eventName, eventListenersRef.current.get(eventName));
        eventListenersRef.current.delete(eventName);

        console.log('🚫 [SignalR] Removed event listener for:', eventName);
    };

    // Function to send messages to the hub
    const invoke = async (methodName, ...args) => {
        if (!connection || connectionState !== 'Connected') {
            console.warn('⚠️ [SignalR] Cannot invoke method - not connected');
            return false;
        }

        try {
            await connection.invoke(methodName, ...args);
            return true;
        } catch (error) {
            console.error('❌ [SignalR] Failed to invoke method:', methodName, error);
            return false;
        }
    };

    const value = {
        connection,
        connectionState,
        addEventListener,
        removeEventListener,
        invoke,
        isConnected: connectionState === 'Connected'
    };

    return (
        <SignalRContext.Provider value={value}>
            {children}
        </SignalRContext.Provider>
    );
};