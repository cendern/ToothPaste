import React, { useState, useEffect } from 'react';
import { Button, Typography, Input } from "@material-tailwind/react";
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { unlockWithPassword, unlockPasswordless, isUnlocked, getRequiredAuthMode, clearMasterSalt } from '../../services/EncryptedStorage';

const AuthenticationOverlay = ({ onAuthSuccess, onClose }) => {
    const [mode, setMode] = useState(null); // 'choose' | 'password' | 'passwordless' | null (loading)
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [isFirstTimePassword, setIsFirstTimePassword] = useState(true);
    const [showForgotConfirmation, setShowForgotConfirmation] = useState(false);

    // Determine required auth mode on mount
    useEffect(() => {
        const initAuthMode = async () => {
            const requiredMode = await getRequiredAuthMode();
            setMode(requiredMode);
            // If mode is 'password' from initialization, it means password was already set, so NOT first time
            setIsFirstTimePassword(requiredMode !== 'password');
            setHasChecked(true);  // Only mark as checked after auth mode is determined
        };
        initAuthMode();
    }, []);

    // If already unlocked, auto-succeed
    useEffect(() => {
        if (hasChecked && isUnlocked()) {
            onAuthSuccess();
        }
    }, [hasChecked, onAuthSuccess]);

    // Unlock with password
    const handlePasswordUnlock = async () => {
        try {
            if (!password.trim()) {
                setError('Please enter a password');
                return;
            }
            
            setError(null);
            setIsLoading(true);
            console.log("[AuthenticationOverlay] Starting password-based unlock...");

            await unlockWithPassword(password);
            console.log("[AuthenticationOverlay] Password-based unlock successful");
            setIsLoading(false);
            onAuthSuccess();
        } catch (e) {
            console.error("[AuthenticationOverlay] Password unlock error:", e);
            setError('Unlock failed: ' + e.message);
            setIsLoading(false);
        }
    };

    // Handle forgot password
    const handleForgotPassword = async () => {
        try {
            setIsLoading(true);
            
            // Clear auth encryption and database
            await clearMasterSalt();
            
            // Reset state
            setPassword('');
            setError(null);
            setShowForgotConfirmation(false);
            setMode('choose');
            setIsLoading(false);
        } catch (error) {
            console.error("[AuthenticationOverlay] Error clearing data:", error);
            setError('Failed to reset: ' + error.message);
            setIsLoading(false);
        }
    };

    // Unlock passwordless (insecure mode)
    const handlePasswordlessUnlock = async () => {
        try {
            setError(null);
            setIsLoading(true);
            console.log("[AuthenticationOverlay] Starting passwordless unlock...");

            await unlockPasswordless();
            console.log("[AuthenticationOverlay] Passwordless unlock successful");
            setIsLoading(false);
            onAuthSuccess();
        } catch (e) {
            console.error("[AuthenticationOverlay] Passwordless unlock error:", e);
            setError('Unlock failed: ' + e.message);
            setIsLoading(false);
        }
    };

    if (!hasChecked) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-hover/60 flex flex-col justify-center items-center z-[9999]" onClick={onClose}>
            <div className="bg-shelf p-5 rounded-lg w-11/12 max-w-lg flex flex-col justify-center items-center shadow-lg relative" onClick={(e) => e.stopPropagation()}>
                {/* Close Button*/}
                <button
                    onClick={onClose}
                    className="absolute top-2.5 right-2.5 bg-transparent border-0 text-2xl cursor-pointer text-text"
                >
                    ×
                </button>

                {showForgotConfirmation ? (
                    <>
                        <Typography type="h5" className="text-text font-header normal-case font-semibold text-center mb-4">
                            Forgot Password?
                        </Typography>
                        <Typography type="h6" className="text-text text-sm font-normal text-center mb-6">
                            This will forget all paired devices and macros, are you sure you don't have it written down on a sticky note somewhere?
                        </Typography>
                        <div className="flex gap-3 w-full">
                            <Button
                                onClick={() => setShowForgotConfirmation(false)}
                                className='flex-1 min-h-10 bg-hover text-text hover:bg-hover/80 flex flex-wrap items-center justify-center border-none p-2'
                            >
                                <Typography className="text-text font-header normal-case font-semibold ">
                                    Never mind, I'll find it.
                                </Typography>
                            </Button>
                            <Button
                                onClick={handleForgotPassword}
                                loading={isLoading.toString()}
                                disabled={isLoading}
                                className='flex-1 min-h-10 bg-red-500 text-text hover:bg-red-600 border-none flex flex-wrap items-center justify-center p-2'
                            >
                                <Typography className="text-text font-header normal-case font-semibold">
                                    Its gone forever, reset.
                                </Typography>
                            </Button>
                        </div>
                    </>
                ) : mode === 'password' ? (
                    <>
                        <Typography type="h4" className="text-text font-header normal-case font-semibold text-center mb-4">
                            Enter Password
                        </Typography>

                        <Typography type="h6" className="text-text text-sm font-normal text-center mb-4">
                            {isFirstTimePassword 
                                ? "Use this password to unlock your device and access your data. Make sure to remember it!"
                                : "Your data is encrypted with a password. Enter it to unlock your device."
                            }
                        </Typography>

                        <Input
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordUnlock()}
                            disabled={isLoading}
                            className="mb-4 text-text"
                        />

                        <Button
                            onClick={handlePasswordUnlock}
                            loading={isLoading.toString()}
                            disabled={isLoading || !password.trim()}
                            className='w-full min-h-10 mb-3 bg-primary text-text hover:bg-primary-hover focus:bg-primary-focus active:bg-primary-active flex flex-wrap items-center justify-center p-2'
                        >
                            <Typography type="h6" className={`text-text font-sans normal-case font-semibold ${isLoading ? "hidden" : ""}`}>
                                {isFirstTimePassword ? "Set Password and Unlock" : "Unlock"}
                            </Typography>
                        </Button>

                        {!isFirstTimePassword && (
                            <button
                                onClick={() => setShowForgotConfirmation(true)}
                                className="text-sm text-primary hover:text-primary-hover underline mt-2"
                                disabled={isLoading}
                            >
                                Forgot Password?
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <Typography type="h4" className="text-text font-header normal-case font-semibold text-center mb-4">
                            Let's get started...
                        </Typography>

                        <Typography type="h6" className="text-text text-sm text-center mb-6">
                            Choose how to unlock your device. 
                        </Typography>

                        <Button
                            onClick={() => setMode('password')}
                            className='w-full min-h-10 mb-3 bg-primary text-text hover:bg-primary-hover active:bg-primary-active flex flex-wrap items-center justify-center p-2'
                        >
                            <Typography type="h6" className="text-text font-sans normal-case font-semibold">
                                Unlock with Password
                            </Typography>
                        </Button>

                        <Button onClick={handlePasswordlessUnlock} className='w-full min-h-10 mb-3 flex flex-wrap items-center justify-center bg-orange border-none p-2'>
                            <Typography type="h6" className="text-text normal-case font-semibold ">
                                Use Passwordless
                            </Typography>
                        </Button>

                        <Typography type="h6" className="text-gray-500 text-xs font-normal text-center mt-4">
                            Passwordless mode is faster, but doesn't encrypt the data stored on this device. 
                            Your data is still End-to-End encrypted.
                        </Typography>
                    </>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-500 w-full text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthenticationOverlay;
