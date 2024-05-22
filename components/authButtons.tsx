"use client";

import Image from "next/image";
import googleLogo from "@/public/google.png";
import githubLogo from "@/public/github.png";
import { signIn } from "next-auth/react";
import { signOut } from 'next-auth/react'

export function GoogleSignInButton() {
    const handleClick = () => {
        signIn("google");
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center font-semibold justify-center h-14 px-6 mt-4 text-l transition-colors duration-300 bg-white border border-black text-black rounded-lg focus:shadow-outline"
        >
            <Image src={googleLogo} alt="Google Logo" width={20} height={20} />
            <span className="ml-4">Continue with Google</span>
        </button>
    );
}

export function GithubSignInButton() {
    const handleClick = () => {
        signIn("github");
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center font-semibold justify-center h-14 px-6 mt-4 text-l transition-colors duration-300 bg-white border border-black text-black rounded-lg focus:shadow-outline"
        >
            <Image src={githubLogo} alt="Github Logo" width={20} height={20} />
            <span className="ml-4">Continue with Github</span>
        </button>
    );
}

export function SignOutButton() {
    return (
        <div className="cursor-pointer" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign Out
        </div>
    )
}
