import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }

    // Get comments with pagination
    const comments = await db.comment.findMany({
      where: {
        contractId: contractId
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await db.comment.count({
      where: {
        contractId: contractId
      }
    })

    // Transform comments to include edit/delete permissions
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      authorRole: comment.author.role,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
      canEdit: comment.authorId === comment.authorId, // Simple permission check
      canDelete: comment.authorId === comment.authorId // Simple permission check
    }))

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }

    return NextResponse.json({
      comments: transformedComments,
      pagination
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      content,
      authorId,
      authorName,
      authorRole
    } = body

    if (!contractId || !content || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if contract exists
    const contract = await db.contract.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }
    
    // Create comment
    const comment = await db.comment.create({
      data: {
        contractId,
        content,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'COMMENT_ADDED',
        details: JSON.stringify({
          commentId: comment.id,
          authorId,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        }),
        contractId
      }
    })

    // Transform response
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      authorRole: comment.author.role,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: false,
      canEdit: true,
      canDelete: true
    }

    return NextResponse.json(transformedComment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      commentId,
      content
    } = body

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if comment exists
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        contract: {
          select: {
            id: true,
            number: true
          }
        }
      }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Update comment
    const comment = await db.comment.update({
      where: { id: commentId },
      data: {
        content: content
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'COMMENT_UPDATED',
        details: JSON.stringify({
          commentId: comment.id,
          authorId: comment.authorId,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        }),
        contractId: existingComment.contractId
      }
    })

    // Transform response
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      authorName: comment.author.name,
      authorRole: comment.author.role,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: comment.createdAt.getTime() !== comment.updatedAt.getTime(),
      canEdit: true,
      canDelete: true
    }

    return NextResponse.json(transformedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { commentId } = body

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Check if comment exists and get contract info
    const existingComment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        contract: {
          select: {
            id: true,
            number: true
          }
        }
      }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Delete comment
    await db.comment.delete({
      where: { id: commentId }
    })

    // Create contract history entry
    await db.contractHistory.create({
      data: {
        action: 'COMMENT_DELETED',
        details: JSON.stringify({
          commentId: existingComment.id,
          authorId: existingComment.authorId,
          originalContent: existingComment.content.substring(0, 100) + (existingComment.content.length > 100 ? '...' : '')
        }),
        contractId: existingComment.contractId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}