'use client'

export default function deleteItemButton({ id, deleteSuccess, setDeleteSuccess }) {

    const handleClick = async () => {
        try {
            const response = await fetch(`/api/delete-record/${id}`, { method: "DELETE"});
            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }
            const data = await response.json()
            console.log(data.message)
            setDeleteSuccess(!deleteSuccess);
        }
        catch (error) {
            console.error(`Failed to delete record with id ${id}: ${error.message}`);
        }
    }

    return (
        <button onClick={handleClick} className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded" type="submit">Delete</button>
    )
}
