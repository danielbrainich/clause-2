import { useState, useEffect } from 'react';

export default function SaveBillButton({bioguideId}) {

    const handleClick = () => {
        console.log("props", bioguideId)
    }

    return (
        <button onClick={handleClick} className="mb-5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded" type="submit">Save Legislator</button>
    )
}
