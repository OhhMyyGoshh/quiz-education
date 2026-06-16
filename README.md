# Quiz Education — Project Overview

> Hệ thống quản lý lớp học và thi trắc nghiệm trực tuyến, full-stack TypeScript.

---

## 1. Tech Stack

| Layer | Technology | Chi tiết |
|---|---|---|
| Backend Runtime | Node.js + TypeScript | Express 5, strict typing throughout |
| Database | MongoDB + Mongoose 9 | Document-based, schema validation |
| Authentication | JWT (Access + Refresh) | 15m access token / 7d refresh token |
| Frontend | React + TypeScript | React Router v7, Vite |
| Styling | Tailwind CSS | CSS variables, dark mode, design tokens |
| Icons | Lucide React | Bộ icon nhất quán toàn app |
| Brand Color | `#008A50` | `var(--primary)`, green |
| Font | Outfit | Variable font, modern sans-serif |

---

## 2. Kiến Trúc Hệ Thống

### Backend — 4-Layer Architecture

```
Request → Controller → Service → Repository → MongoDB
                ↑           ↑
           auth middleware  AppError
```

| Layer | File | Trách nhiệm |
|---|---|---|
| **Model** | `*.model.ts` | Mongoose schema, interface, pre-save hooks |
| **Repository** | `*.repository.ts` | Toàn bộ MongoDB queries, không có business logic |
| **Service** | `*.service.ts` | Business logic, validation, orchestration |
| **Controller** | `*.controller.ts` | Parse request, gọi service, format response |

### Frontend — Feature-based Structure

```
src/
├── api/           # fetch wrappers typed, mỗi domain 1 file
├── types/         # interface definitions tách biệt
├── context/       # AuthContext, ProtectedRoute
├── components/    # Dashboard, DashboardLayout, ProfileModal...
└── pages/
    ├── admin/
    ├── teacher/
    └── student/
```

---

## 3. Chức Năng Hệ Thống

### 3.1 Authentication & Profile

| Tính năng | Endpoint | Mô tả |
|---|---|---|
| Đăng ký | `POST /api/auth/register` | Hash password bcryptjs (12 rounds) |
| Đăng nhập | `POST /api/auth/login` | Trả access + refresh token |
| Làm mới token | `POST /api/auth/refresh` | Rotate refresh token |
| Đăng xuất | `POST /api/auth/logout` | Xoá refresh token khỏi DB |
| Lấy thông tin | `GET /api/auth/me` | User hiện tại |
| Cập nhật profile | `PUT /api/auth/profile` | Đổi name, email |
| Đổi mật khẩu | `PUT /api/auth/change-password` | Verify current → hash new |

### 3.2 Quiz Management

| Tính năng | Endpoint | Chi tiết |
|---|---|---|
| CRUD Quiz | `GET/POST/PUT/DELETE /api/quizzes` | Teacher tạo, sửa, xoá quiz của mình |
| Publish/Unpublish | `PATCH /api/quizzes/:id/publish` | Toggle `isPublished` |
| Quiz công khai | `GET /api/quizzes/public` | Student xem quiz đã published |
| Chi tiết public | `GET /api/quizzes/public/:id` | Kèm `maxAttempts`, `userAttempts` |
| Admin xem tất cả | `GET /api/quizzes/all` | Kể cả quiz chưa publish |

### 3.3 Cài Đặt Quiz Nâng Cao

| Setting | Type | Mô tả |
|---|---|---|
| `maxAttempts` | `number` (0 = ∞) | Giới hạn số lần làm. Backend check trước khi grade. |
| `showAnswerAfter` | `boolean` (default: `true`) | Hiện đáp án đúng sau nộp. Backend ẩn `correctChoiceIndex` nếu `false`. |
| `lockAnswers` | `boolean` (default: `false`) | Khoá đáp án sau khi chọn, không cho đổi. |

### 3.4 Classroom Management

Luồng hoàn chỉnh: **Teacher tạo lớp → chia sẻ mã 6 ký tự → Student join → Teacher gán quiz → Student làm bài**

| Tính năng | Role | Endpoint |
|---|---|---|
| Tạo lớp | Teacher | `POST /api/classrooms` |
| Danh sách lớp của mình | Teacher | `GET /api/classrooms/my` |
| Cập nhật lớp | Teacher | `PUT /api/classrooms/:id` |
| Xoá lớp (soft delete) | Teacher | `DELETE /api/classrooms/:id` |
| Kick học sinh | Teacher | `DELETE /api/classrooms/:id/students/:sid` |
| Gán quiz vào lớp | Teacher | `POST /api/classrooms/:id/quizzes` |
| Bỏ quiz khỏi lớp | Teacher | `DELETE /api/classrooms/:id/quizzes/:qid` |
| Tham gia bằng mã | Student | `POST /api/classrooms/join` |
| Danh sách lớp đang học | Student | `GET /api/classrooms/enrolled` |
| Quiz published của lớp | Student | `GET /api/classrooms/:id/quizzes` |
| Rời lớp | Student | `DELETE /api/classrooms/:id/leave` |
| Xem tất cả lớp | Admin | `GET /api/classrooms/admin/all` |

> Mã tham gia 6 ký tự được tự sinh bằng `Math.random().toString(36)` trong Mongoose `pre('validate')` hook, lưu uppercase, có index để query nhanh.

### 3.5 Submissions & Grading

| Tính năng | Endpoint | Mô tả |
|---|---|---|
| Nộp bài | `POST /api/submissions/:quizId/submit` | Server grade, check maxAttempts, lưu DB |
| Kết quả của tôi | `GET /api/submissions/my-results` | Lịch sử làm bài, phân trang |
| Kết quả quiz | `GET /api/submissions/quiz/:quizId` | Teacher xem điểm từng student |
| Thống kê teacher | `GET /api/submissions/teacher/stats` | `topQuizzes`, `submissionsPerDay` |
| Thống kê admin | `GET /api/submissions/admin/stats` | `roleBreakdown`, system-wide stats |

---

## 4. Phân Quyền & Vai Trò

Hệ thống có **3 role** theo thứ bậc: `Admin > Teacher > Student`

Middleware `auth.middleware.ts` cung cấp 4 guard:

- `authenticate` — verify JWT, inject `req.user`
- `studentUp` — role phải là `student | teacher | admin`
- `teacherUp` — role phải là `teacher | admin`
- `adminOnly` — chỉ `admin`

### 4.1 Admin

| Chức năng | Endpoint | Ghi chú |
|---|---|---|
| CRUD Users | `CRUD /api/users` | Thay đổi role, reset tài khoản |
| Xem tất cả quiz | `GET /api/quizzes/all` | Kể cả quiz chưa publish |
| Xem tất cả lớp | `GET /api/classrooms/admin/all` | Bao gồm lớp inactive |
| Thống kê hệ thống | `GET /api/submissions/admin/stats` | `totalUsers`, `roleBreakdown`, `submissions/day` |
| Dashboard | `AdminDashboard` component | KPI cards + bar chart + user breakdown |

### 4.2 Teacher

| Chức năng | Endpoint / Component | Ghi chú |
|---|---|---|
| CRUD Quiz | `/api/quizzes` | Chỉ xem/sửa quiz do mình tạo |
| Cài đặt nâng cao | `QuizSettingsPanel` | `maxAttempts`, `showAnswerAfter`, `lockAnswers` |
| Tạo & quản lý lớp | `/api/classrooms` | Sinh mã 6 ký tự tự động |
| Gán quiz vào lớp | `POST /api/classrooms/:id/quizzes` | Quiz phải do teacher đó tạo |
| Kick học sinh | `DELETE .../students/:sid` | Xoá khỏi danh sách enrolled |
| Xem kết quả | `/api/submissions/quiz/:id` | Lọc theo quiz, phân trang |
| Thống kê cá nhân | `/api/submissions/teacher/stats` | Top quizzes, submissions per day |
| Dashboard | `TeacherDashboard` | Quiz list + top quiz + quick actions |

### 4.3 Student

| Chức năng | Endpoint / Component | Ghi chú |
|---|---|---|
| Tham gia lớp | `POST /api/classrooms/join` | Bằng mã 6 ký tự |
| Xem quiz từ lớp | `GET /api/classrooms/:id/quizzes` | Chỉ `isPublished = true` |
| Làm quiz | `StudentQuizPage` | Intro → Làm bài → Kết quả |
| Lịch sử làm bài | `GET /api/submissions/my-results` | Phân trang, accordion detail |
| Dashboard | `StudentDashboard` | KPI cards + quiz từ lớp enrolled |
| Rời lớp | `DELETE /api/classrooms/:id/leave` | — |
| Cập nhật profile | `PUT /api/auth/profile` | Đổi tên, email |
| Đổi mật khẩu | `PUT /api/auth/change-password` | Verify mật khẩu cũ trước |

### 4.4 Ma Trận Quyền Hạn

| Tính năng | Admin | Teacher | Student |
|---|:---:|:---:|:---:|
| Quản lý users | ✅ Full CRUD | ❌ | ❌ |
| Xem tất cả quiz | ✅ | ❌ (chỉ của mình) | ❌ (chỉ published) |
| Tạo / sửa quiz | ❌ | ✅ | ❌ |
| Tạo lớp học | ❌ | ✅ | ❌ |
| Gán quiz vào lớp | ❌ | ✅ | ❌ |
| Kick học sinh | ❌ | ✅ | ❌ |
| Tham gia lớp | ❌ | ❌ | ✅ |
| Làm quiz | ❌ | ❌ | ✅ |
| Thống kê hệ thống | ✅ | ❌ | ❌ |
| Thống kê cá nhân | ❌ | ✅ | ✅ |

---



## 5. Data Models

### User
| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase |
| `password` | String | `select: false`, bcrypt hash |
| `role` | Enum | `admin \| teacher \| student`, default: `student` |
| `refreshToken` | String | `select: false`, dùng để verify/rotate |

### Quiz
| Field | Type | Ghi chú |
|---|---|---|
| `title` | String | required |
| `subject` | String | required |
| `duration` | Number | phút |
| `questions` | `IQuestion[]` | embedded: `text`, `choices[]`, `explanation`, `order` |
| `createdBy` | ObjectId→User | ref |
| `isPublished` | Boolean | default: `false` |
| `maxAttempts` | Number | 0 = không giới hạn |
| `showAnswerAfter` | Boolean | default: `true` |
| `lockAnswers` | Boolean | default: `false` |

### Classroom
| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required |
| `code` | String | 6 ký tự uppercase, unique, index |
| `teacherId` | ObjectId→User | ref |
| `students` | `ObjectId[]→User` | danh sách enrolled |
| `quizzes` | `ObjectId[]→Quiz` | quizzes được gán |
| `isActive` | Boolean | soft delete flag |

### Submission
| Field | Type | Ghi chú |
|---|---|---|
| `quizId` | ObjectId→Quiz | ref |
| `studentId` | ObjectId→User | ref |
| `answers` | `IAnswer[]` | `questionId`, `choiceIndex`, `isCorrect` |
| `score` | Number | số câu đúng |
| `percent` | Number | `score/total * 100` |
| `timeTaken` | Number | giây |

---

## 6. Frontend Pages

| Role | Route | Component | Chức năng |
|---|---|---|---|
| Admin | `/admin` | `AdminDashboard` | KPI + roleBreakdown + bar chart |
| Admin | `/admin/users` | `AdminUsersPage` | CRUD users |
| Admin | `/admin/quizzes` | `AdminQuizzesPage` | Xem tất cả quiz |
| Admin | `/admin/stats` | `AdminStatsPage` | Biểu đồ hệ thống |
| Teacher | `/teacher` | `TeacherDashboard` | Quiz list + top quiz + quick links |
| Teacher | `/teacher/quizzes` | `TeacherQuizzesPage` | Quản lý quiz |
| Teacher | `/teacher/quizzes/create` | `QuizFormPage` | Tạo quiz + settings panel |
| Teacher | `/teacher/classrooms` | `TeacherClassroomsPage` | Quản lý lớp, gán quiz, kick student |
| Teacher | `/teacher/results` | `TeacherResultsPage` | Xem điểm học sinh |
| Teacher | `/teacher/stats` | `TeacherStatsPage` | Thống kê cá nhân |
| Student | `/student` | `StudentDashboard` | KPI + quiz từ lớp enrolled |
| Student | `/student/quizzes` | `StudentQuizzesPage` | Quiz từ lớp (filter: subject, class) |
| Student | `/student/quizzes/:id` | `StudentQuizPage` | Làm bài (4 phases) |
| Student | `/student/classrooms` | `StudentClassroomsPage` | Tham gia/xem lớp |
| Student | `/student/results` | `StudentResultsPage` | Lịch sử làm bài (accordion) |

### StudentQuizPage — 4 Phases

| Phase | Hiển thị | Logic |
|---|---|---|
| `intro` | Tên quiz, thông tin, attempt count | Disable nút nếu hết `maxAttempts` |
| `doing` | Câu hỏi + choices + timer + navigator | `lockAnswers` khoá lựa chọn đã chọn |
| `submitting` | Spinner | `POST /api/submissions/:id/submit` |
| `finished` | Score card + answer review | `showAnswerAfter` hiện `correctChoiceIndex` |

---

## 7. Toàn Bộ API Routes

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout         [auth]
GET    /api/auth/me             [auth]
PUT    /api/auth/profile        [auth]
PUT    /api/auth/change-password [auth]
```

### Users (Admin)
```
GET    /api/users               [adminOnly]
POST   /api/users               [adminOnly]
GET    /api/users/:id           [adminOnly]
PUT    /api/users/:id           [adminOnly]
DELETE /api/users/:id           [adminOnly]
```

### Quizzes
```
GET    /api/quizzes/all         [adminOnly]
GET    /api/quizzes             [teacherUp]
POST   /api/quizzes             [teacherUp]
GET    /api/quizzes/:id         [teacherUp]
PUT    /api/quizzes/:id         [teacherUp]
DELETE /api/quizzes/:id         [teacherUp]
PATCH  /api/quizzes/:id/publish [teacherUp]
GET    /api/quizzes/public      [studentUp]
GET    /api/quizzes/public/:id  [studentUp]
```

### Submissions
```
POST   /api/submissions/:quizId/submit    [studentUp]
GET    /api/submissions/my-results        [studentUp]
GET    /api/submissions/quiz/:quizId      [teacherUp]
GET    /api/submissions/teacher/stats     [teacherUp]
GET    /api/submissions/admin/stats       [adminOnly]
```

### Classrooms
```
# Static paths trước param paths (quan trọng!)
POST   /api/classrooms/join              [studentUp]
GET    /api/classrooms/enrolled          [studentUp]
GET    /api/classrooms/admin/all         [adminOnly]
POST   /api/classrooms                   [teacherUp]
GET    /api/classrooms/my                [teacherUp]
GET    /api/classrooms/:id/quizzes       [studentUp]
DELETE /api/classrooms/:id/leave         [studentUp]
GET    /api/classrooms/:id               [teacherUp]
PUT    /api/classrooms/:id               [teacherUp]
DELETE /api/classrooms/:id               [teacherUp]
DELETE /api/classrooms/:id/students/:sid [teacherUp]
POST   /api/classrooms/:id/quizzes       [teacherUp]
DELETE /api/classrooms/:id/quizzes/:qid  [teacherUp]
```

---

## 🚀 Hướng Dẫn Cài Đặt Và Chạy Dự Án

Dự án này sử dụng Node.js, TypeScript (Express 5) cho Backend và React (Vite) cho Frontend. Dưới đây là các bước để khởi chạy hệ thống trên môi trường local:

### 1. Yêu Cầu Hệ Thống 
* Cài đặt phiên bản Node.js ổn định.
* Cài đặt MongoDB trên máy hoặc chuẩn bị sẵn chuỗi kết nối (URI) tới cơ sở dữ liệu MongoDB.

### 2. Cài Đặt Các Gói Phụ Thuộc 
* Mở Terminal tại thư mục gốc của dự án.
* Di chuyển vào thư mục Backend và chạy lệnh: `npm install`
* Di chuyển vào thư mục Frontend và chạy lệnh: `npm install`

### 3. Khởi Chạy Hệ Thống
* **Khởi chạy Backend:** Mở Terminal ở thư mục Backend và chạy lệnh khởi động môi trường dev (thường là `npm run dev`).
* **Khởi chạy Frontend:** Mở thêm một Terminal mới ở thư mục Frontend và chạy lệnh `npm run dev`.
* Truy cập vào đường dẫn máy chủ cục bộ do Vite cung cấp (thường là `http://localhost:5173`) trên trình duyệt.

---

## 🔐 Tài Khoản Truy Cập Mặc Định

Sau khi khởi chạy thành công, bạn có thể sử dụng tài khoản có sẵn dưới đây để đăng nhập và trải nghiệm các tính năng cấp cao nhất của hệ thống:

| Vai trò | Email | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Admin** | `admin@quiz.com` | `123456` | Quản lý người dùng, xem toàn bộ lớp học, xem toàn bộ quiz và thống kê hệ thống |

