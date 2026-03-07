import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// 簡單的密碼驗證
export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // 從環境變數獲取管理員密碼
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('[Admin Verify] ADMIN_PASSWORD not set')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // 生成簡單 token
    const token = randomBytes(32).toString('hex')

    return NextResponse.json({
      success: true,
      token,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('[Admin Verify] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}