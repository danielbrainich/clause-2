import { useEffect, useState } from "react";
import Link from "next/link";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export default function Cosponsors({ congress, billType, billNumber }) {
  const [isLoading, setIsLoading] = useState(true);
  const [cosponsors, setCosponsors] = useState("");

  useEffect(() => {
    const fetchCosponsors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/show-bill/${congress}/${billType}/${billNumber}/cosponsors`
        );
        if (!response.ok) {
          throw new Error(`http error. status: ${response.status}`);
        }
        const data = await response.json();
        setCosponsors(data.cosponsors);
        console.log(data.cosponsors);
      } catch (error) {
        console.error(`failed to fetch one bill: ${error}`);
      }
      setIsLoading(false);
    };
    fetchCosponsors();
  }, []);

  return (
    <>
      {cosponsors && cosponsors.length > 0 ? (
        cosponsors.map((cosponsor) => (
          <Link key={cosponsor.url} href={`/pol/${cosponsor.bioguideId}`}>
            <div>{cosponsor.fullName}</div>
          </Link>
        ))
      ) : (
        <div
          className={`${inter.className} text-sm text-slate-600 leading-snug ml-1 sm:ml-2`}
        >
          None
        </div>
      )}
    </>
  );
}
