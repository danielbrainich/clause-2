'use client'

export default function SaveLegislator({ bioguideId }) {

    const handleClick = async () => {
        try {
            const requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bioguideId: bioguideId,
                })
            }
            console.log(requestOptions)
            const response = await fetch(`/api/add-record`, requestOptions);
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json();
            console.log(data);
        }
        catch (error) {
            console.error(`failed to save bill: ${error}`)
        }
    }

    return (
        <button onClick={handleClick} className="mb-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded" type="submit">Save Legislator</button>
    )
}
