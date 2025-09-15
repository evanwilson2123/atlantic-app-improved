'use client'
import { VALDTest } from '@/lib/forcedecks-api';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const page = () => {
    const { athleteId, profileId } = useParams();
    const [tests, setTests] = useState<VALDTest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTests = async () => {
            const res = await fetch(`/api/vald?profileId=${profileId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch tests');
            }
            const data = await res.json();
            setTests(data.tests);
            console.log(data.tests);
            setLoading(false);
        }
        fetchTests();
        return () => {
            setLoading(false);
        }
    }, [athleteId, profileId]);
  return (
    <div>page</div>
  )
}

export default page