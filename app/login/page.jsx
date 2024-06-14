import { GoogleSignInButton, GithubSignInButton } from '@/components/authButtons';
import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function Login() {

    const session = await getServerSession(authConfig);

    if (session) {
        redirect('/')
    }

    return (
        <>
            <div className="flex flex-col items-center">
                <GoogleSignInButton />
                <GithubSignInButton />
            </div>
        </>
)
}
