import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Silk from '@/components/ui/silk';
import LoadingScreen from '@/components/LoadingScreen';

const LoginPage = () => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('login');
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const navigate = useNavigate();

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Password validation
    const validatePassword = (password) => {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasMinLength = password.length >= 8;

        return {
            valid: hasUpper && hasLower && hasNumber && hasSpecial && hasMinLength,
            hasUpper,
            hasLower,
            hasNumber,
            hasSpecial,
            hasMinLength,
        };
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error('Google login error:', error);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            await signInWithEmail(email, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Email login error:', error);
            if (error.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else {
                setError('Failed to sign in. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            setError('Password does not meet the requirements.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await signUpWithEmail(email, password, displayName);
            setSuccessMessage('Account created successfully! You can now sign in.');
            setActiveTab('login');
            // Clear the form
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setError('Email already in use. Try signing in instead.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await resetPassword(email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
            setForgotPasswordMode(false);
        } catch (error) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
            } else {
                setError('Failed to send password reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Reset states when changing tabs
    const handleTabChange = (value) => {
        setActiveTab(value);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {loading && <LoadingScreen message="Authenticating..." />}
            {/* Left panel - form */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-white">
                <div className="w-full max-w-md login-card">
                    <div className="mb-6 md:mb-8 login-form-element">
                        <img src={Logo} alt="Threadly" className="h-8 mb-6 md:mb-8" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {forgotPasswordMode ? 'Reset password' : activeTab === 'login' ? 'Log in to your account' : 'Create account'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            {forgotPasswordMode
                                ? 'Enter your email to receive a password reset link'
                                : activeTab === 'login'
                                    ? 'Enter your email and password to log in'
                                    : 'Join Threadly to manage your Slack messages'
                            }
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-700">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="mb-4 border-green-200 bg-green-50 text-green-700">
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {!forgotPasswordMode ? (
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Sign In</TabsTrigger>
                                <TabsTrigger value="register">Create Account</TabsTrigger>
                            </TabsList>

                            {/* Sign In Tab */}
                            <TabsContent value="login" className="space-y-4">
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForgotPasswordMode(true);
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            >
                                                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#8760F7] hover:bg-[#7050d0] pulse-on-hover"
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGoogleLogin}
                                    variant="outline"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Sign in with Google
                                </Button>
                            </TabsContent>

                            {/* Register Tab */}
                            <TabsContent value="register" className="space-y-4">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Full Name</Label>
                                        <Input
                                            id="displayName"
                                            type="text"
                                            placeholder="Your Name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="registerEmail">Email Address</Label>
                                        <Input
                                            id="registerEmail"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="registerPassword">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="registerPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={togglePasswordVisibility}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            >
                                                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Password requirements */}
                                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                                            <p>Password must contain:</p>
                                            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 list-disc">
                                                <li className={password.length >= 8 ? "text-green-600" : ""}>
                                                    At least 8 characters
                                                </li>
                                                <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                                                    Uppercase letter
                                                </li>
                                                <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                                                    Lowercase letter
                                                </li>
                                                <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                                                    Number
                                                </li>
                                                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : ""}>
                                                    Special character
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className={`${confirmPassword && password !== confirmPassword
                                                ? 'border-red-500 focus:ring-red-500'
                                                : ''
                                                }`}
                                        />
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#8760F7] hover:bg-[#7050d0] pulse-on-hover"
                                        disabled={loading || !validatePassword(password).valid || password !== confirmPassword}
                                    >
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        // Forgot Password Form
                        <div className="space-y-4">
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="resetEmail">Email Address</Label>
                                    <Input
                                        id="resetEmail"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-[#8760F7] hover:bg-[#7050d0]"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </Button>

                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotPasswordMode(false);
                                            setError('');
                                            setSuccessMessage('');
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Threadly - All rights reserved.
                </div>
            </div>

            {/* Right panel - image/illustration */}
            <div className="hidden md:block md:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0">
                    <Silk
                        speed={5}
                        scale={1}
                        color="#747881ff"
                        noiseIntensity={1.5}
                        rotation={0}
                    />
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 rounded-lg overflow-hidden shadow-2xl login-card">
                    <div className="p-6 bg-white rounded-t-lg">
                        <div className="flex items-center justify-between mb-6">
                            <img src={Logo} alt="Threadly" className="h-6" />
                            <span className="text-sm font-medium text-gray-500">Manage your messages</span>
                        </div>

                        {/* App illustration/mockup */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="h-4 w-3/4 bg-[#8760F7]/20 rounded-full mb-4 animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-[#8760F7]/20 rounded-full mb-6 animate-pulse"></div>

                            {/* New message indicator */}
                            <div className="p-4 bg-gray-50 border-t">
                                <div className="flex space-x-2 items-center">
                                    <div className="bg-white p-2 rounded-full border flex-1">
                                        <div className="h-3 w-1/3 bg-gray-200 rounded-full"></div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-[#8760F7] flex items-center justify-center text-white">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 4L3 11L10 14M20 4L13 21L10 14M20 4L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-[#8760F7] text-white">
                        <p className="text-lg font-medium">The easiest way to manage your Slack messages</p>
                        <p className="text-white/70 text-sm">Join the Threadly community now!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
