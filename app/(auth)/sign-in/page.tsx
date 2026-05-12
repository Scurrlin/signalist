'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import TradingViewAttribution from '@/components/forms/TradingViewAttribution';
import {signInWithEmail, setGuestMode} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import { useState } from 'react';

const SignIn = () => {
    const router = useRouter()
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            
            if(result.success) {
                toast.success('Welcome back!');
                router.push('/');
            } else {
                toast.error('Sign in failed', {
                    description: result.error || 'Invalid email or password.'
                })
            }
        } catch (e) {
            console.error(e);
            toast.error('Sign in failed', {
                description: e instanceof Error ? e.message : 'Something went wrong. Please try again.'
            })
        }
    }

    const handleGuestMode = async () => {
        try {
            setIsGuestLoading(true);
            const result = await setGuestMode();
            
            if (result.success) {
                toast.success('Welcome! Feel free to take a look around');
                router.push('/');
            } else {
                toast.error('Failed to enter guest mode');
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong');
        } finally {
            setIsGuestLoading(false);
        }
    }

    return (
        <>
            <h1 className="form-title">$ignalist</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } }}
                />

                <Button type="submit" disabled={isSubmitting} className="auth-gradient-btn w-full mt-5">
                    {isSubmitting ? 'Signing In' : 'Sign In'}
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0A0E27] px-2 text-gray-500">Or</span>
                    </div>
                </div>

                <Button 
                    type="button" 
                    onClick={handleGuestMode}
                    disabled={isGuestLoading}
                    className="auth-gradient-btn w-full"
                >
                    {isGuestLoading ? 'Loading...' : 'Continue as Guest'}
                </Button>

                <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up" />

                <TradingViewAttribution />
            </form>
        </>
    );
};
export default SignIn;
