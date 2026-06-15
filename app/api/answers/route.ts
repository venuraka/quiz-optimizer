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

}