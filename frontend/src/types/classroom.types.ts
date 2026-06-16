// src/types/classroom.types.ts

export interface StudentRef {
  _id: string;
  name: string;
  email: string;
}

export interface TeacherRef {
  _id: string;
  name: string;
  email: string;
}

export interface ClassroomQuiz {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  isPublished: boolean;
  questionCount?: number;
}

export interface Classroom {
  _id: string;
  name: string;
  description: string;
  code: string;
  teacherId: TeacherRef;
  students: StudentRef[];
  quizzes: ClassroomQuiz[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateClassroomPayload {
  name: string;
  description?: string;
}

export interface JoinClassroomPayload {
  code: string;
}
