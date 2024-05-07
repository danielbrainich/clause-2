import { useEffect, useState } from 'react';

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
                <div className="font-bold text-slate-900">Text</div>
                <a href={text} target="_blank" className="text-slate-500">Link to full text</a>
            </>
        )
    );
}
