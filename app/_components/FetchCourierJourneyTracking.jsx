"use server"

export async function fetchCourierJourneyTracking(cNoteNumber) {
    try {
        const response = await fetch("http://courierjourney.xpresion.in/api/v1/Tracking/Tracking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                UserID: "CJEH065",
                Password: "CJEH@065",
                AWBNo: cNoteNumber,
                Type: "A",
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Validate structure
        if (!data?.Response || data.Response?.ErrorCode !== "0") {
            throw new Error(data?.Response?.ErrorDisc || "Failed to fetch Courier Journey tracking details");
        }

        return {
            success: true,
            data: data.Response,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
