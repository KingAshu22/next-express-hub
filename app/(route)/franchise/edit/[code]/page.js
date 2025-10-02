"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import FranchiseForm from "@/app/_components/FranchiseForm";

const EditFranchise = ({ params }) => {
    const { code } = use(params);
    console.log("Code: " + code);

    const [franchise, setFranchise] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Franchise Data", franchise);
    }, [franchise]);

    useEffect(() => {
        const fetchFranchise = async () => {
            console.log(`Franchise fetching data ${code}`);
            try {
                const response = await axios.get(
                    `/api/franchises/${code}`
                );
                const data = response.data;
                setFranchise(data);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch Franchise data");
                setLoading(false);
            }
        };

        fetchFranchise();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

    return (
        <div className="min-h-screen flex items-center justify-center">
            <FranchiseForm isEdit={true} franchise={franchise} />
        </div>
    );
};

export default withAuth(EditFranchise);
