import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    const { quizId, availableTime } = await request.json()

    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    let bestScore = 0
    let bestQuestions: any[] = []

    const n = questions.length

    for (let mask = 0; mask < (1 << n); mask++) {
        let totalTime = 0
        let totalScore = 0
        let selected = []

        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                totalTime += questions[i].time_required
                totalScore += questions[i].score
                selected.push(questions[i])
            }
        }

        if (
            totalTime <= availableTime &&
            totalScore > bestScore
        ) {
            bestScore = totalScore
            bestQuestions = selected
        }
    }

    return NextResponse.json({
        bestScore,
        questions: bestQuestions
    })
}