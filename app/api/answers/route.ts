import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    const body = await request.json()

    const { user_id, question_id, answer } = body

    const { data, error } = await supabase
        .from('answers')
        .insert([
            {
                user_id,
                question_id,
                answer
            }
        ])
        .select()

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json(data)
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('userId')

    if (!user_id) {
        return NextResponse.json(
            { error: 'userId is required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase
        .from('answers')
        .select(`
            id,
            answer,
            question_id,
            questions (
                id,
                question,
                score,
                quizzes (
                    id,
                    title
                )
            )
        `)
        .eq('user_id', parseInt(user_id, 10))

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json(data)
}