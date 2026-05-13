'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import TradingViewAttribution from "@/components/forms/TradingViewAttribution";
import {signUpWithEmail, setGuestMode} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import { useState } from 'react';

const SignUp = () => {
    const router = useRouter()
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: ''
        },
        mode: 'onBlur'
    });

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            
            if(result.success) {
                toast.success('Account created successfully!');
                router.push('/');
            } else {
                toast.error('Sign up failed', {
                    description: result.error || 'Failed to create an account.'
                })
            }
        } catch (e) {
            console.error(e);
            toast.error('Sign up failed', {
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[calc(100dvh-9rem)] overflow-y-auto pb-6">
                <InputField
                    name="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    register={register}
                    error={errors.fullName}
                    validation={{ required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } }}
                />

                <InputField
                    name="email"
                    label="Email"
                    placeholder="your.email@example.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: {
                            value: /^\w+@\w+\.\w+$/,
                            message: 'Invalid email address',
                        },
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter a strong password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } }}
                />

                <Button type="submit" disabled={isSubmitting} className="auth-gradient-btn w-full mt-5">
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div className="relative">
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

                <FooterLink text="Already have an account?" linkText="Sign in" href="/sign-in" />

                <TradingViewAttribution />
            </form>
        </>
    )
}
export default SignUp;
