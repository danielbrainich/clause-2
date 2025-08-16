import { useEffect, useState } from 'react';
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });


export default function Text({ congress, billType, billNumber }) {
    const [isLoading, setIsLoading] = useState(true);
    const [text, setText] = useState("");

    useEffect(() => {
        const fetchText = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/show-bill/${congress}/${billType}/${billNumber}/text`);
                if (!response.ok) {
                    throw new Error(`http error. status: ${response.status}`);
                }
                const data = await response.json();
                setText(data.textVersions[0].formats[1].url);
            }
            catch (error) {
                console.error(`failed to fetch one bill: ${error}`)
            }
            setIsLoading(false);
        }
        fetchText()
    }, [])


    return (
        text && (
            <>
                <a href={text} target="_blank" className={`${inter.className} text-sm text-slate-600 leading-snug hover:text-indigo-500 underline-animation w-fit`}>Link to full text</a>
            </>
        )
    );
}
