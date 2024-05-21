import { useState, useEffect } from 'react';

export default function SaveBillButton({billType, billNumber, congress}) {

    const handleClick = () => {
        console.log("props", billType, billNumber, congress)
    }

    return (
        <button onClick={handleClick} className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded" type="submit">Save Bill</button>
    )
}
