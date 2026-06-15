# Quiz Optimizer Project

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL

## Database Design

Tables:
- quizzes
- questions
- users
- answers

Relationships:
- One Quiz -> Many Questions
- One User -> Many Answers
- One Question -> Many Answers

## API Endpoints

### GET /api/quizzes
Returns all quizzes.

### GET /api/quizzes/[id]/questions
Returns questions for a selected quiz.

### POST /api/answers
Stores user answers.

### POST /api/optimize
Returns the optimal set of questions based on available time.

## Optimization Logic

The optimization endpoint selects questions that maximize total score while staying within the available time limit.

Inputs:
- Quiz ID
- Available Time

Outputs:
- Best Score
- Recommended Questions

## Testing

All endpoints were tested using Postman.

## Future Improvements

- User authentication
- Score calculation
- Leaderboards
- AI-based question recommendations