"use client"

import { useState, useEffect } from "react"
import Dropzone from "react-dropzone"
import { Cropper, getCroppedImg } from "react-cropper-custom"
import "react-cropper-custom/dist/index.css"
import "./modal.css"
import { S3Client, PutObjectCommand, ListObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"
import { fromBase64 } from "@aws-sdk/util-base64"
import { FileText } from "lucide-react"

const PhotoUploader = ({ artistName, setProfilePic, initialImageLink }) => {
  // File state
  const [fileType, setFileType] = useState(null)
  const [fileName, setFileName] = useState(null)

  // Image state
  const [imageSrc, setImageSrc] = useState(null)
  const [cropData, setCropData] = useState(null)
  const [zoom, setZoom] = useState(1)

  // UI state
  const [showModal, setShowModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showCroppedImage, setShowCroppedImage] = useState(false)
  const [isFirstDrop, setIsFirstDrop] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // S3 state
  const [awsLink, setAwsLink] = useState(initialImageLink)

  // Check initial image on component mount
  useEffect(() => {
    if (initialImageLink && initialImageLink.length > 1) {
      setShowCroppedImage(true)
      setCropData(initialImageLink)

      // Determine if the initial file is a PDF
      if (initialImageLink.toLowerCase().endsWith(".pdf")) {
        setFileType("pdf")
        const nameFromUrl = initialImageLink.split("/").pop()
        setFileName(nameFromUrl)
      } else {
        setFileType("image")
      }
    }
  }, [initialImageLink])

  // Handle file drop from Dropzone
  const onFileDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    try {
      const file = acceptedFiles[0]
      setFileName(file.name)
      setError(null)

      // Check file type
      if (file.type === "application/pdf") {
        setFileType("pdf")
        await handlePdfUpload(file)
      } else if (file.type.startsWith("image/")) {
        setFileType("image")
        const reader = new FileReader()
        reader.onload = () => {
          setImageSrc(reader.result)
          setShowModal(true)
          if (isFirstDrop) {
            handleImageZoom()
            setIsFirstDrop(false)
          }
        }
        reader.onerror = () => {
          setError("Error reading file")
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error("Error handling file drop:", err)
      setError("Error processing file. Please try again.")
    }
  }

  // Handle PDF upload
  const handlePdfUpload = async (file) => {
    setIsLoading(true)
    try {
      const reader = new FileReader()

      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1]
          const fileSize = Math.round((base64Data.length * 3) / 4)

          // Check if file is too large (over 100KB)
          if (fileSize > 102400) {
            setError("PDF file is too large. Please upload a file smaller than 100KB.")
            setIsLoading(false)
            return
          }

          const uploadResult = await uploadFileToS3(base64Data, "application/pdf", ".pdf")
          setProfilePic(uploadResult)
          setShowCroppedImage(true)
          setAwsLink(uploadResult)
          setIsLoading(false)
        } catch (err) {
          console.error("Error in reader.onload:", err)
          setError("Error uploading PDF. Please try again.")
          setIsLoading(false)
        }
      }

      reader.onerror = () => {
        setError("Error reading PDF file")
        setIsLoading(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error handling PDF upload:", err)
      setError("Error processing PDF. Please try again.")
      setIsLoading(false)
    }
  }

  // Handle image zoom for cropper
  const handleImageZoom = () => {
    setZoom(2)
    setTimeout(() => {
      setZoom(1)
    }, 500)
  }

  // Handle crop completion
  const onCropComplete = async (croppedArea) => {
    try {
      const croppedImg = await getCroppedImg(imageSrc, croppedArea)
      setCropData(croppedImg)
    } catch (err) {
      console.error("Error completing crop:", err)
      setError("Error cropping image")
    }
  }

  // Compress image to target size
  const compressImage = async (base64) => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas")

            // Start with reasonable dimensions
            let width = 350
            let height = 350

            // Maintain aspect ratio
            if (img.width > img.height) {
              height = (img.height / img.width) * width
            } else {
              width = (img.width / img.height) * height
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext("2d")
            ctx.drawImage(img, 0, 0, width, height)

            // Start with high quality
            let quality = 0.8
            let webpData = canvas.toDataURL("image/webp", quality)
            let iterations = 0

            // Compress until file size is under 100KB or we've tried 10 times
            while (webpData.length > 133333 && quality > 0.1 && iterations < 10) {
              quality -= 0.1
              webpData = canvas.toDataURL("image/webp", quality)
              iterations++
            }

            resolve(webpData)
          } catch (err) {
            console.error("Error in img.onload:", err)
            reject("Error compressing image")
          }
        }

        img.onerror = () => {
          reject("Error loading image for compression")
        }

        img.src = base64
      } catch (err) {
        console.error("Error in compressImage:", err)
        reject("Error setting up image compression")
      }
    })
  }

  // Handle image upload after cropping
  const handleImageUpload = async () => {
    setIsLoading(true)
    try {
      if (!cropData) {
        setError("No image data available")
        setIsLoading(false)
        return
      }

      const compressedImage = await compressImage(cropData)
      const imageData = compressedImage.split(",")[1]

      const location = await uploadFileToS3(imageData, "image/webp", ".webp")
      setProfilePic(location)
      setShowModal(false)
      setIsFirstDrop(true)
      setZoom(1)
      setShowCroppedImage(true)
      setAwsLink(location)
      setIsLoading(false)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Error uploading image. Please try again.")
      setIsLoading(false)
    }
  }

  // Upload file to S3
  const uploadFileToS3 = async (base64Data, contentType, extension) => {
    try {
      // Create S3 client
      const s3Client = new S3Client({
        region: process.env.NEXT_PUBLIC_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
          secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
        },
      })

      // Create folder name and key
      const folderName = artistName ? artistName.replace(/\s+/g, "-") : "uploads"
      const folderKey = `${folderName}/`

      // Check if folder exists
      try {
        const listObjectsCommand = new ListObjectsCommand({
          Bucket: process.env.NEXT_PUBLIC_BUCKET,
          Prefix: folderKey,
        })

        const { Contents } = await s3Client.send(listObjectsCommand)

        if (!Contents || Contents.length === 0) {
          const createFolderParams = {
            Bucket: process.env.NEXT_PUBLIC_BUCKET,
            Key: folderKey,
            Body: "",
          }

          const putObjectCommand = new PutObjectCommand(createFolderParams)
          await s3Client.send(putObjectCommand)
        }
      } catch (err) {
        console.error("Error checking/creating folder:", err)
        // Continue anyway - folder might exist
      }

      // Generate unique filename
      const fileName = `${nanoid()}${extension}`

      // Convert base64 to buffer
      const buffer = fromBase64(base64Data)

      // Upload file
      const uploadParams = {
        Bucket: process.env.NEXT_PUBLIC_BUCKET,
        Key: `${folderKey}${fileName}`,
        Body: buffer,
        ACL: "public-read",
        ContentType: contentType,
      }

      const putObjectCommand = new PutObjectCommand(uploadParams)
      await s3Client.send(putObjectCommand)

      // Generate and return URL
      const awsFileUrl = `https://${process.env.NEXT_PUBLIC_BUCKET}.s3.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${folderName}/${fileName}`

      return awsFileUrl
    } catch (err) {
      console.error("Error uploading to S3:", err)
      throw new Error("Error uploading file to S3")
    }
  }

  // Handle save button click in cropper modal
  const handleSave = async () => {
    try {
      if (!cropData) {
        await handleImageZoom()
        setTimeout(() => {
          handleImageUpload()
        }, 1000)
      } else {
        handleImageUpload()
      }
    } catch (err) {
      console.error("Error saving image:", err)
      setError("Error saving image. Please try again.")
    }
  }

  // Handle file deletion
  const handleDeleteFile = async () => {
    try {
      if (awsLink) {
        await deleteFileFromS3(awsLink)
      }

      // Reset all state
      setFileType(null)
      setFileName(null)
      setImageSrc(null)
      setCropData(null)
      setShowModal(false)
      setShowCroppedImage(false)
      setProfilePic(null)
      setAwsLink(null)
      setError(null)
    } catch (err) {
      console.error("Error deleting file:", err)
      setError("Error deleting file. Please try again.")
    }
  }

  // Delete file from S3
  const deleteFileFromS3 = async (fileUrl) => {
    try {
      if (!fileUrl) return

      const objectKey = new URL(fileUrl).pathname.slice(1)

      const s3Client = new S3Client({
        region: process.env.NEXT_PUBLIC_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
          secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
        },
      })

      const deleteParams = {
        Bucket: process.env.NEXT_PUBLIC_BUCKET,
        Key: objectKey,
      }

      const deleteCommand = new DeleteObjectCommand(deleteParams)
      await s3Client.send(deleteCommand)

      console.log("File Deleted Successfully")
    } catch (err) {
      console.error("Error deleting from S3:", err)
      throw new Error("Error deleting file from S3")
    }
  }

  // Open preview modal
  const openPreviewModal = () => {
    setShowPreviewModal(true)
  }

  return (
    <>
      {/* File Upload Dropzone */}
      {!showCroppedImage && (
        <div className="mb-4">
          <Dropzone
            onDrop={onFileDrop}
            accept={{
              "image/*": [],
              "application/pdf": [".pdf"],
            }}
            maxSize={5000000} // 5MB max for initial upload, we'll compress later
            disabled={isLoading}
          >
            {({ getRootProps, getInputProps }) => (
              <section
                className={`bg-gray-200 rounded-lg p-4 pt-8 pb-8 text-center max-w-36 ${isLoading ? "opacity-50" : ""}`}
              >
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  {isLoading ? <p>Uploading...</p> : <p>Drag & drop Image or PDF to upload here or click to upload.</p>}
                </div>
              </section>
            )}
          </Dropzone>
        </div>
      )}

      {/* File Preview */}
      {showCroppedImage && (
        <div className="relative mb-4">
          <button
            className="absolute top-3 font-bold text-2xl left-32 bg-red-500 w-8 h-8 text-white pb-1 rounded-full z-10"
            onClick={handleDeleteFile}
            type="button"
            disabled={isLoading}
          >
            x
          </button>

          {fileType === "image" && awsLink && (
            <img
              src={awsLink || "/placeholder.svg"}
              alt="Uploaded Image"
              className="mb-4 rounded-lg max-w-36 cursor-pointer"
              onClick={openPreviewModal}
            />
          )}

          {fileType === "pdf" && awsLink && (
            <div
              className="mb-4 rounded-lg max-w-36 p-4 bg-gray-100 flex flex-col items-center cursor-pointer"
              onClick={openPreviewModal}
            >
              <FileText className="w-12 h-12 text-red-500" />
              <p className="text-sm mt-2 text-center truncate w-full">{fileName}</p>
            </div>
          )}
        </div>
      )}

      {/* Image Cropper Modal */}
      {showModal && imageSrc && (
        <div className="modal-overlay z-20">
          <div className="modal flex flex-col gap-4">
            <Cropper
              src={imageSrc}
              width={300}
              height={300}
              zoom={zoom}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
              disabled={isLoading}
            />
            <div className="flex justify-between">
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                type="button"
                onClick={() => {
                  setImageSrc(null)
                  setShowModal(false)
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? "opacity-50" : ""}`}
                type="button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for both Image and PDF */}
      {showPreviewModal && (
        <div className="modal-overlay z-20">
          <div className="modal max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-end mb-2">
              <button
                className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                onClick={() => setShowPreviewModal(false)}
              >
                ✕
              </button>
            </div>

            {fileType === "image" && awsLink && (
              <img
                src={awsLink || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}

            {fileType === "pdf" && awsLink && (
              <iframe
                src={`${awsLink}#view=FitH`}
                title="PDF Preview"
                className="w-full h-[80vh]"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
          <p>{error}</p>
        </div>
      )}
    </>
  )
}

export default PhotoUploader
