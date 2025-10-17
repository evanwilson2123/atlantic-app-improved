"use client";
import { Athlete, Tech } from '@/types/types';
import React, { useState } from 'react'

const UpdatedAthleteProfile = () => {
    // states
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [techs, setTechs] = useState<Tech[]>([]);
  return (
    <div>UpdatedAthleteProfile</div>
  )
}

export default UpdatedAthleteProfile