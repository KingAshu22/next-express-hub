import * as cheerio from "cheerio"
import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const trackingNumber = searchParams.get("trackingNumber")
  const link = searchParams.get("link") // Keep backward compatibility

  if (!trackingNumber && !link) {
    return NextResponse.json({ error: "Missing trackingNumber or link parameter" }, { status: 400 })
  }

  try {
    const trackingData = {
      trackingNumber: trackingNumber || null,
      shipmentDetails: {},
      currentStatus: {},
      timeline: [],
      events: [],
    }

    // If tracking number is provided, use the new flow
    if (trackingNumber) {
      console.log("[v0] Starting Aramex tracking for number:", trackingNumber)

      // Step 1: Get the initial tracking page
      const initialResponse = await fetch("https://www.aramex.com/md/en/track/shipments", {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      })

      if (!initialResponse.ok) {
        throw new Error(`Failed to fetch initial Aramex page: ${initialResponse.status}`)
      }

      const initialHtml = await initialResponse.text()
      const $initial = cheerio.load(initialHtml)

      // Extract form data and tokens
      const formAction = $initial("form").attr("action") || "/md/en/track/shipments"
      const csrfToken = $initial('input[name="__RequestVerificationToken"]').val()

      console.log("[v0] Form action:", formAction, "CSRF token found:", !!csrfToken)

      // Step 2: Submit the tracking number
      const formData = new URLSearchParams()
      formData.append("TrackNumbers", trackingNumber)
      if (csrfToken) {
        formData.append("__RequestVerificationToken", csrfToken)
      }

      const submitResponse = await fetch(`https://www.aramex.com${formAction}`, {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://www.aramex.com",
          Referer: "https://www.aramex.com/md/en/track/shipments",
        },
        body: formData.toString(),
        redirect: "follow",
      })

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit tracking number: ${submitResponse.status}`)
      }

      const resultsHtml = await submitResponse.text()
      const $results = cheerio.load(resultsHtml)

      console.log("[v0] Got results page, looking for shipment cards")

      // Step 3: Look for shipment card and extract details link
      const shipmentCard = $results(".shipmet-card, .shipment-card, .tracking-result").first()
      let detailsUrl = null

      if (shipmentCard.length) {
        // Try to find the details link
        const detailsLink = shipmentCard.find("a").first()
        if (detailsLink.length) {
          detailsUrl = detailsLink.attr("href")
          if (detailsUrl && !detailsUrl.startsWith("http")) {
            detailsUrl = `https://www.aramex.com${detailsUrl}`
          }
        }
      }

      console.log("[v0] Details URL found:", detailsUrl)

      // Step 4: If we have a details URL, fetch the detailed tracking info
      if (detailsUrl) {
        const detailsResponse = await fetch(detailsUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: submitResponse.url,
          },
        })

        if (detailsResponse.ok) {
          const detailsHtml = await detailsResponse.text()
          const $details = cheerio.load(detailsHtml)

          // Extract data from history-details-card
          const historyCard = $details(".history-details-card")
          if (historyCard.length) {
            console.log("[v0] Found history details card, extracting events")

            // Extract tracking events from the table
            historyCard.find("table tbody tr").each((_, row) => {
              const $row = $details(row)

              const dateElement = $row.find(".date")
              const timeElement = $row.find(".time")
              const cityElement = $row.find(".city")
              const countryElement = $row.find(".country")
              const activityElement = $row.find(".activity")

              if (dateElement.length && activityElement.length) {
                const date = dateElement.text().trim()
                const time = timeElement.text().trim()
                const city = cityElement.text().trim()
                const country = countryElement.text().trim()
                const activity = activityElement.text().trim()

                if (date && activity) {
                  const event = {
                    date: date,
                    time: time,
                    location: city ? `${city}, ${country}` : country,
                    status: activity,
                    timestamp: `${date}${time ? ` ${time}` : ""}`,
                  }

                  trackingData.timeline.push(event)
                  trackingData.events.push(event)
                }
              }
            })
          }
        }
      }

      // If no details URL found, try to extract from results page
      if (!detailsUrl || trackingData.events.length === 0) {
        console.log("[v0] Extracting data from results page")

        // Try to extract basic info from results page
        $results("table tbody tr, .tracking-history tr, .timeline-table tr").each((_, row) => {
          const $row = $results(row)
          const cells = $row.find("td")

          if (cells.length >= 3) {
            const dateCell = cells.eq(0).text().trim()
            const locationCell = cells.eq(1).text().trim()
            const statusCell = cells.eq(2).text().trim()
            const timeCell = cells.length > 3 ? cells.eq(3).text().trim() : ""

            if (dateCell && statusCell) {
              const event = {
                date: dateCell,
                time: timeCell,
                location: locationCell || "Unknown",
                status: statusCell,
                timestamp: `${dateCell}${timeCell ? ` ${timeCell}` : ""}`,
              }

              trackingData.timeline.push(event)
              trackingData.events.push(event)
            }
          }
        })
      }

      trackingData.trackingNumber = trackingNumber
    }
    // Fallback to old URL-based method for backward compatibility
    else if (link) {
      console.log("[v0] Using fallback URL method for:", link)

      // Validate URL using try-catch instead of URL.canParse
      try {
        new URL(link)
      } catch (e) {
        return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 })
      }

      const response = await fetch(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch Aramex page: ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract tracking number from URL or page
      const trackingNumberFromUrl =
        link.match(/TrackNumbers=([^&]+)/)?.[1] ||
        link.match(/q=([^&]+)/)?.[1] ||
        $(".tracking-number, .awb-number").text().trim()

      if (trackingNumberFromUrl) {
        try {
          trackingData.trackingNumber = decodeURIComponent(trackingNumberFromUrl.replace(/\+/g, " "))
        } catch (e) {
          trackingData.trackingNumber = trackingNumberFromUrl
        }
      }

      // Extract events using existing selectors
      $("table tbody tr, .tracking-history tr").each((_, row) => {
        const $row = $(row)
        const dateElement = $row.find(".date")
        const timeElement = $row.find(".time")
        const locationElement = $row.find(".addr, .location")
        const activityElement = $row.find(".activity, .status")

        if (dateElement.length && activityElement.length) {
          const date = dateElement.text().trim()
          const time = timeElement.text().trim()
          const country = locationElement.find(".country").text().trim()
          const city = locationElement.find(".city").text().trim()
          const activity = activityElement.text().trim()

          if (date && activity) {
            const event = {
              date: date,
              time: time,
              location: city ? `${city}, ${country}` : country || locationElement.text().trim(),
              status: activity,
              timestamp: `${date}${time ? ` ${time}` : ""}`,
            }

            trackingData.timeline.push(event)
            trackingData.events.push(event)
          }
        }
      })
    }

    // Sort events by date (newest first)
    if (trackingData.events.length > 0) {
      trackingData.events.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date)
        const dateB = new Date(b.timestamp || b.date)
        return dateB - dateA
      })
      trackingData.timeline = [...trackingData.events]

      // Set current status to the latest event
      trackingData.currentStatus = {
        status: trackingData.events[0].status,
        location: trackingData.events[0].location,
        timestamp: trackingData.events[0].timestamp,
      }
    }

    trackingData.metadata = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: link || `https://www.aramex.com/md/en/track/shipments?TrackNumbers=${trackingNumber}`,
      totalEvents: trackingData.events.length,
      hasCurrentStatus: !!trackingData.currentStatus.status,
      method: trackingNumber ? "tracking_number" : "direct_url",
    }

    console.log("[v0] Final tracking data:", JSON.stringify(trackingData, null, 2))

    return NextResponse.json(trackingData, { status: 200 })
  } catch (error) {
    console.error("[v0] Aramex scraping error:", error)
    return NextResponse.json(
      {
        error: "Failed to scrape Aramex tracking data",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
