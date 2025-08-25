import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import * as fs from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const contractId = data.get('contractId') as string
    const documentType = data.get('documentType') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(process.cwd(), 'uploads', fileName)

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Save file
    await writeFile(filePath, buffer)

    // Get the latest version number for this contract
    const existingDocuments = await db.document.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    })

    const versionNumber = existingDocuments.length > 0 
      ? Math.max(...existingDocuments.map(d => d.versions?.[0]?.version || 0)) + 1
      : 1

    // Create document record
    const document = await db.document.create({
      data: {
        filename: file.name,
        filePath: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        type: documentType || 'OTHER',
        contractId
      }
    })

    // Create document version
    const documentVersion = await db.documentVersion.create({
      data: {
        version: versionNumber,
        filePath: `/uploads/${fileName}`,
        changes: JSON.stringify({
          action: 'UPLOADED',
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString()
        }),
        documentId: document.id,
        authorId: 'demo-user-id' // В реальном приложении здесь будет ID текущего пользователя
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'DOCUMENT_UPLOADED',
        details: JSON.stringify({
          documentId: document.id,
          fileName: file.name,
          fileSize: file.size,
          documentType,
          version: versionNumber
        }),
        contractId
      }
    })

    // Create notification for contract initiator
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { initiator: true }
    })

    if (contract) {
      await db.notification.create({
        data: {
          userId: contract.initiatorId,
          type: 'DOCUMENT_UPLOADED',
          title: 'Загружен новый документ',
          message: `К договору ${contract.number} загружен документ: ${file.name}`,
          contractId,
          actionUrl: `/contracts/${contractId}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        filePath: document.filePath,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        type: document.type,
        version: documentVersion.version
      }
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}