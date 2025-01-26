"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import ClientRegisterForm from "@/app/_components/ClientForm";

const EditClient = ({ params }) => {
    const { code } = use(params);
    console.log("Code: " + code);

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Client Data", client);
    }, [client]);

    useEffect(() => {
        const fetchClient = async () => {
            console.log(`Client fetching data ${code}`);
            try {
                const response = await axios.get(
                    `/api/clients/${code}`
                );
                const data = response.data;
                setClient(data[0]);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch Client data");
                setLoading(false);
            }
        };

        fetchClient();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

    return (
        <div className="min-h-screen flex items-center justify-center">
            <ClientRegisterForm isEdit={true} client={client} />
        </div>
    );
};

export default withAuth(EditClient);
