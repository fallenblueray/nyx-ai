/**
 * Word Count Value Object - Domain Layer
 * Represents the user's word count with business rules
 */

export class WordCount {
  private readonly _value: number
  private readonly MAX_FREE = 8000

  private constructor(value: number) {
    this._value = Math.max(0, value)
  }

  static create(value: number): WordCount {
    return new WordCount(value)
  }

  static createFree(): WordCount {
    return new WordCount(8000)
  }

  get value(): number {
    return this._value
  }

  canDeduct(words: number): boolean {
    return this._value >= words
  }

  deduct(words: number): WordCount {
    if (!this.canDeduct(words)) {
      throw new Error('字數不足')
    }
    return new WordCount(this._value - words)
  }

  add(words: number): WordCount {
    return new WordCount(this._value + words)
  }

  isLowThreshold(threshold = 1000): boolean {
    return this._value < threshold
  }

  toJSON(): number {
    return this._value
  }
}
