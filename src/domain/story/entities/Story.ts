/**
 * Story Entity - Domain Layer
 * Represents a story in the domain model
 */

export interface StoryTopic {
  category: string
  item: string
}

export interface StoryRole {
  name: string
  description: string
  traits: string[]
}

export interface StoryProps {
  id?: string
  userId: string
  title: string
  content: string
  topics: StoryTopic[]
  roles: StoryRole[]
  isPublic: boolean
  shareId?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Story {
  readonly id?: string
  readonly userId: string
  readonly title: string
  readonly content: string
  readonly topics: StoryTopic[]
  readonly roles: StoryRole[]
  readonly isPublic: boolean
  readonly shareId?: string
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: StoryProps) {
    this.id = props.id
    this.userId = props.userId
    this.title = props.title
    this.content = props.content
    this.topics = props.topics
    this.roles = props.roles
    this.isPublic = props.isPublic
    this.shareId = props.shareId
    this.createdAt = props.createdAt ?? new Date()
    this.updatedAt = props.updatedAt ?? new Date()
  }

  // Factory methods
  static create(props: Omit<StoryProps, 'id' | 'createdAt' | 'updatedAt'>): Story {
    return new Story({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static fromDatabase(row: Record<string, unknown>): Story {
    return new Story({
      id: row.id as string,
      userId: row.user_id as string,
      title: row.title as string,
      content: row.content as string,
      topics: typeof row.topics === 'string' ? JSON.parse(row.topics) : row.topics,
      roles: typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles,
      isPublic: row.is_public as boolean,
      shareId: row.share_id as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    })
  }

  // Business logic
  get wordCount(): number {
    return this.content.length
  }

  get preview(): string {
    return this.content.slice(0, 200) + (this.content.length > 200 ? '...' : '')
  }

  canBeSharedBy(userId: string): boolean {
    return this.userId === userId
  }

  // Immutable update
  makePublic(): Story {
    return new Story({
      ...this.toProps(),
      isPublic: true,
      shareId: this.shareId ?? crypto.randomUUID(),
      updatedAt: new Date()
    })
  }

  toProps(): StoryProps {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      content: this.content,
      topics: this.topics,
      roles: this.roles,
      isPublic: this.isPublic,
      shareId: this.shareId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}
