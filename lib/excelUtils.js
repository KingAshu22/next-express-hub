export function generateMultiCountryTemplate() {
  const headers = ["Zone", "Countries", "Charge Name", "Charge Type", "Charge Value"]
  const sampleData = [
    ["1", "Bangladesh,Bhutan,Maldives", "Fuel Surcharge", "Percentage", "20"],
    ["2", "Hong Kong,Malaysia,Singapore", "Remote Area", "One Time", "15"],
  ]
  const rateHeaders = ["kg", "Zone 1", "Zone 2", "Zone 3"]
  const rateSampleData = [
    ["0.5", "1092", "1085", "950"],
    ["1", "1315", "1296", "1150"],
    ["2", "1500", "1450", "1300"],
  ]

  return {
    zones: { headers, data: sampleData },
    rates: { headers: rateHeaders, data: rateSampleData },
  }
}

export function generateSingleCountryTemplate() {
  const headers = ["Zone Name", "Postal Codes", "Start Weight", "End Weight", "Step", "Rate per Kg"]
  const sampleData = [
    ["Zone A", "2003,2005,2010-2015", "0.5", "1", "0.5", "1092"],
    ["Zone B", "3000-3010", "0.5", "1", "0.5", "1085"],
  ]

  return { headers, data: sampleData }
}

export function downloadExcelTemplate(templateData, filename) {
  let csvContent = ""

  if (templateData.zones) {
    csvContent += "ZONES\n"
    csvContent += templateData.zones.headers.join(",") + "\n"
    templateData.zones.data.forEach((row) => {
      csvContent += row.join(",") + "\n"
    })
    csvContent += "\n\nRATES\n"
    csvContent += templateData.rates.headers.join(",") + "\n"
    templateData.rates.data.forEach((row) => {
      csvContent += row.join(",") + "\n"
    })
  } else {
    csvContent += templateData.headers.join(",") + "\n"
    templateData.data.forEach((row) => {
      csvContent += row.join(",") + "\n"
    })
  }

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}
