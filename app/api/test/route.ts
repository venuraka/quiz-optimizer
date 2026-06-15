import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')

    if (error) {
        return NextResponse.json({
            error: error.message
        })
    }

    return NextResponse.json(data)
}