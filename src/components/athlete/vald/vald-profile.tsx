"use client";
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import AthleteNavbar from '../AthleteNavbar';

interface TestType {
    type: "CMJ" | "SJ" | "HJ" | "PP" | "IMTP";
    testId: string;
    recordedUTC: string;
}

interface ValdProfileResponse {
    cmjTest?: TestType | null;
    sjTest?: TestType | null;
    hjTest?: TestType | null;
    ppTest?: TestType | null;
    imtpTest?: TestType | null;
}

function isValidTest(test: TestType | null | undefined): test is TestType {
    return Boolean(
        test &&
        typeof test.type === "string" &&
        typeof test.testId === "string" && test.testId.trim() !== "" &&
        typeof test.recordedUTC === "string" && test.recordedUTC.trim() !== ""
    );
}

const ValdProfile = () => {
    const { athleteId, profileId } = useParams<{ athleteId: string; profileId: string }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testTypes, setTestTypes] = useState<ValdProfileResponse | null>(null);

    useEffect(() => {
        const fetchValdProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!profileId) return;
                const response = await fetch(`/api/vald/profile/${profileId}`);
                if (!response.ok) {
                    console.error("Failed to fetch vald profile", response.statusText);
                    setError(response.statusText);
                    return;
                }
                const data = await response.json();
                setTestTypes(data.profileResponse);
            } catch (error) {
                console.error("Error fetching vald profile", error);
                setError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchValdProfile();
    }, [profileId]);

    const syncTests = async () => {
        const response = await fetch(`/api/athletes/vald/${profileId}/sync-tests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!response.ok) {
            console.error("Failed to sync tests", response.statusText);
            setError(response.statusText);
            return;
        }
        const data = await response.json();
        if (data.success) {
            console.log("Tests synced successfully");
        } else {
            console.error("Failed to sync tests", data.error);
            setError(data.error);
        }
    }
  return (
    <div className="space-y-5">
        <AthleteNavbar athleteId={athleteId as string} profileId={profileId as string} />
        {/* Header */}
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vald Profile</h1>
                {/* sync tests button */}
                <button
                    onClick={() => syncTests()}
                    className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    Sync Tests
                </button>
            </div>
        </div>

        {/* States */}
        {loading && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-600 dark:text-gray-300">
                Loading profile...
            </div>
        )}
        {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
                {error}
            </div>
        )}

        {/* Tests Grid */}
        {!loading && !error && testTypes && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Latest Tests</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {([testTypes.cmjTest, testTypes.sjTest, testTypes.hjTest, testTypes.ppTest, testTypes.imtpTest]
                        .filter(isValidTest)
                    ).map((test) => (
                        <div key={test.testId} className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 border border-gray-100 dark:border-gray-800">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Test Type</div>
                            <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{test.type}</div>
                            <div className="mt-3 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Test ID</div>
                            <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{test.testId}</div>
                            <div className="mt-3 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Recorded</div>
                            <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(test.recordedUTC).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  )
}

export default ValdProfile;