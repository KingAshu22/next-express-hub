import { connectToDB } from "@/app/_utils/mongodb"
import Hsn from "@/models/Hsn"
import { NextResponse } from "next/server"

export async function GET(req) {
    try {
        await connectToDB()

        const { searchParams } = new URL(req.url)
        const query = searchParams.get("query")

        if (!query || query.trim() === "") {
            return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
        }

        // Split query into words, remove empty strings
        const words = query.trim().split(/\s+/).filter(Boolean)

        // Create a regex condition for each word (case-insensitive)
        const regexConditions = words.map(word => ({
            item: { $regex: word, $options: "i" }
        }))

        // Match items where ALL words are present somewhere in the item string
        const items = await Hsn.find({
            $and: regexConditions
        })

        // console.log("Search results for:", query, items)

        return NextResponse.json(items)
    } catch (error) {
        console.error("Error searching HSN codes:", error)
        return NextResponse.json({ error: "Failed to search HSN codes" }, { status: 500 })
    }
}
