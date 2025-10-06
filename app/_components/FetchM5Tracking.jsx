"use server"

export async function fetchM5Tracking(cNoteNumber) {
  try {
    const response = await fetch("http://apiv2.m5clogs.com/api/Track/GetTrackings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ValidateAccount: [
          {
            AccountCode: process.env.NEXT_PUBLIC_ACCOUNT_CODE,
            Username: process.env.NEXT_PUBLIC_USERNAME,
            Password: process.env.NEXT_PUBLIC_PASSWORD,
            AccessKey: process.env.NEXT_PUBLIC_ACCESS_KEY,
          },
        ],
        Awbno: cNoteNumber,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()

    // Check if the response indicates success
    if (data[0]?.messages?.[0]?.Response !== "1") {
      throw new Error(data[0]?.messages?.[0]?.ErrorDescription || "Failed to fetch tracking details")
    }

    return {
      success: true,
      data: data[0],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
