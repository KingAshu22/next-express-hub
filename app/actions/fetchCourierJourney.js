// app/actions/fetchCourierJourney.js
"use server";

export async function fetchCourierJourneyTracking(cNoteNumber) {
    try {
        const response = await fetch("http://courierjourney.xpresion.in/api/v1/Tracking/Tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                UserID: "CJEH065", // Your UserID
                Password: "CJEH@065", // Your Password
                AWBNo: cNoteNumber,
                Type: "A",
            }),
            cache: 'no-store' // Ensure fresh data is fetched every time
        });

        if (!response.ok) {
            // Do not throw an error here, return a failure state
            return { success: false, error: `API request failed with status ${response.status}` };
        }

        const data = await response.json();

        if (data?.Response?.ErrorCode !== "0") {
            return { success: false, error: data?.Response?.ErrorDisc || "API returned an error" };
        }

        return {
            success: true,
            data: data.Response, // Return the entire 'Response' object which includes 'Events'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}