import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

const fieldClass =
    'h-11 border-white/10 bg-white/5 text-white shadow-none placeholder:text-zinc-500 focus-visible:border-[#f85f00] focus-visible:ring-[#f85f00]/35';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {status && (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-center text-sm font-medium text-emerald-400">
                                {status}
                            </div>
                        )}

                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-zinc-300"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className={fieldClass}
                                />
                                <InputError
                                    message={errors.email}
                                    className="text-rose-400"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-zinc-300"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className={cn(
                                                'ml-auto text-sm text-[#f85f00] decoration-[#f85f00]/50 underline-offset-4 hover:text-[#ff7a26] hover:decoration-[#ff7a26]',
                                            )}
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={cn(fieldClass, 'pr-10')}
                                    toggleClassName="text-zinc-400 hover:text-zinc-200 focus-visible:ring-[#f85f00]/40"
                                />
                                <InputError
                                    message={errors.password}
                                    className="text-rose-400"
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-white/20 data-[state=checked]:border-[#f85f00] data-[state=checked]:bg-[#f85f00] data-[state=checked]:text-white"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm text-zinc-300"
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full bg-[#f85f00] font-semibold text-white shadow-lg shadow-[#f85f00]/25 transition-colors hover:bg-[#e05500]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}
