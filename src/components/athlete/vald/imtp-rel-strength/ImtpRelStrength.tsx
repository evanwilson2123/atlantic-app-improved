"use client";

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';

interface ImtpRelStrengthStats {
    recordedUTC: string;
    RELATIVE_STRENGTH_trial_value: number;
}

const ImtpRelStrength = () => {
    // params
    const { profileId } = useParams();
    // set states
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // data states
    const [imtpRelStrengthStats, setImtpRelStrengthStats] = useState<ImtpRelStrengthStats[]>([]);

    useEffect(() => {
        const fetchRelStrengthStats = async () => {
            try {
                const response = await fetch(`/api/vald/imtp-rel-strength/chart/${profileId}`);
                if (!response.ok) {
                    console.error("Failed to fetch imtp rel strength chart", response.statusText);
                    setError(response.statusText);
                    return;
                }
                const data = await response.json();
                if (data.imtpRelStrengthStats) {
                    setImtpRelStrengthStats(data.imtpRelStrengthStats);
                } else {
                    console.error("Invalid response format from imtp rel strength chart");
                    setError("Invalid response format from imtp rel strength chart");
                    return;
                }
            }  catch (error) {
                setError(error instanceof Error ? error.message : "An unknown error occured");
            } finally {
                setLoading(false);
            }
        }
        if (profileId) {
            fetchRelStrengthStats();
        } else {
            // No param present, stop loading to avoid spinner hang
            setLoading(false);
        }
    })

  return (
    <div>ImtpRelStrength</div>
  )
}

export default ImtpRelStrength