/**
 * Generate Story Use Case - Application Layer
 * Orchestrates the story generation workflow
 */

import { createStoryGenerator, type GenerateStoryOutput } from '@/domain/story/services/StoryGenerator'
import { WordCount } from '@/domain/story/value-objects/WordCount'
import { Story } from '@/domain/story/entities/Story'
import { SupabaseStoryRepository, SupabaseUserProfileRepository } from '@/infrastructure/repositories/SupabaseStoryRepository'

export interface GenerateStoryInput {
  userId: string
  systemPrompt: string
  userPrompt: string
  model?: string
}

export interface GenerateStoryResult {
  content: string
  wordsUsed: number
  remaining: number
}

export class GenerateStoryUseCase {
  private storyGenerator = createStoryGenerator()
  private storyRepo = new SupabaseStoryRepository()
  private userProfileRepo = new SupabaseUserProfileRepository()

  async execute(input: GenerateStoryInput): Promise<GenerateStoryResult> {
    // Step 1: Generate story using AI
    const generationResult = await this.generateWithAI(input)

    // Step 2: Check word count
    const currentWordCount = await this.userProfileRepo.getWordCount(input.userId)
    const wordCount = WordCount.create(currentWordCount)

    if (!wordCount.canDeduct(generationResult.wordsUsed)) {
      throw new Error('字數不足')
    }

    // Step 3: Deduct word count
    const remaining = await this.userProfileRepo.deductWordCount(
      input.userId,
      generationResult.wordsUsed
    )

    return {
      content: generationResult.content,
      wordsUsed: generationResult.wordsUsed,
      remaining
    }
  }

  private async generateWithAI(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
    return this.storyGenerator.generate({
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      model: input.model
    })
  }
}
